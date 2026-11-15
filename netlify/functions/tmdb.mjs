/**
 * TMDB proxy (Netlify Functions v2, ESM).
 *
 *  GET /.netlify/functions/tmdb?endpoint=/movie/popular&page=2
 *
 * - Keeps the TMDB key on the server (TMDB_API_KEY or TMDB_READ_TOKEN).
 * - Only forwards read-only TMDB endpoints the app actually uses.
 * - Retries transient failures and falls back to the api.tmdb.org alias when
 *   api.themoviedb.org is slow or unreachable.
 * - Successful responses are cached on Netlify's CDN (durable cache), with
 *   stale-while-revalidate, so most visitors never wait on TMDB at all.
 *
 * Note: the file is .mjs on purpose. package.json has "type": "module", so the
 * old CommonJS `exports.handler` in tmdb.js could not load.
 */

const UPSTREAMS = ['https://api.themoviedb.org/3', 'https://api.tmdb.org/3'];
const ATTEMPT_TIMEOUT_MS = 4000;
// Stay well inside Netlify's 10s synchronous function limit.
const DEADLINE_MS = 8500;
// Alternate hosts: a hang on one host is followed by a try on the other.
const PLAN = [UPSTREAMS[0], UPSTREAMS[1], UPSTREAMS[0], UPSTREAMS[1]];

// Read-only endpoints the app uses. Anything else is rejected.
const ALLOWED = /^\/(trending\/(all|movie|tv)\/(day|week)|(movie|tv)\/(popular|top_rated|upcoming|now_playing|on_the_air|airing_today)|(movie|tv)\/\d+(\/(credits|videos|similar|recommendations|reviews|keywords|release_dates|content_ratings|images))?|search\/(multi|movie|tv)|discover\/(movie|tv)|genre\/(movie|tv)\/list|configuration)$/;

const PARAM_NAME = /^[a-z0-9_.]{1,40}$/i;

const json = (status, body, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });

const cacheHeadersFor = (endpoint) => {
  // Search changes with every keystroke: short cache. Lists/details: longer.
  const isSearch = endpoint.startsWith('/search/');
  const browser = isSearch ? 300 : 600;
  const cdn = isSearch ? 900 : 3600;
  return {
    'cache-control': `public, max-age=${browser}`,
    'netlify-cdn-cache-control': `public, durable, s-maxage=${cdn}, stale-while-revalidate=86400`,
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_TOKEN;
  if (!apiKey && !readToken) {
    return json(500, { error: 'Missing TMDB_API_KEY (or TMDB_READ_TOKEN) on server' });
  }

  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || '';
  if (!ALLOWED.test(endpoint)) {
    return json(400, { error: 'Invalid endpoint' });
  }

  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key === 'endpoint' || key === 'api_key') continue;
    if (!PARAM_NAME.test(key) || value.length > 200) return json(400, { error: `Invalid parameter: ${key}` });
    params.set(key, value);
  }
  if (!readToken) params.set('api_key', apiKey);

  const headers = { accept: 'application/json' };
  if (readToken) headers.authorization = `Bearer ${readToken}`;

  let lastStatus = 502;
  const started = Date.now();
  for (let i = 0; i < PLAN.length; i++) {
    const remaining = DEADLINE_MS - (Date.now() - started);
    if (remaining < 600) break;
    if (i > 0) await sleep(100 + Math.random() * 200);
    try {
      const res = await fetch(`${PLAN[i]}${endpoint}?${params}`, {
        headers,
        signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining)),
      });
      const body = await res.text();

      if (res.ok) {
        return new Response(body, {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8', ...cacheHeadersFor(endpoint) },
        });
      }

      lastStatus = res.status;
      // Definitive client errors (bad id, invalid key…) — pass straight through.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return new Response(body, {
          status: res.status,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': res.status === 404 ? 'public, max-age=300' : 'no-store',
          },
        });
      }
    } catch {
      lastStatus = 504; // timeout / network error — move on to the next host
    }
  }

  return json(lastStatus >= 500 ? lastStatus : 502, { error: 'TMDB is unreachable right now' });
};
