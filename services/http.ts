/**
 * Resilient TMDB transport.
 *
 * Why this exists: `api.themoviedb.org` is blocked or flaky on some ISPs and
 * networks, and serverless proxies have cold starts. A single `fetch()` call
 * meant the app "sometimes" showed nothing. This layer makes every request:
 *
 *  1. Cached     – in memory (instant) and persistently (Cache API, falls back
 *                  to localStorage), so repeat visits render immediately.
 *  2. De-duped   – identical in-flight requests share one network call.
 *  3. Multi-source – Netlify proxy (key stays server-side) → api.themoviedb.org
 *                  → api.tmdb.org (official alias that works where the main
 *                  domain is blocked). The last source that worked is
 *                  remembered so later requests go straight to it.
 *  4. Hedged     – if a source hasn't answered within HEDGE_DELAY_MS, the next
 *                  one is raced in parallel instead of waiting for a timeout.
 *  5. Retried    – transient failures (network error, 429, 5xx) back off and
 *                  retry, every attempt has a hard timeout.
 *  6. Stale-safe – if every source fails, the last good copy is served
 *                  (marked "degraded") instead of an error screen.
 */

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'not-found' | 'bad-response' | 'offline' | 'config';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  /** A definitive answer from TMDB (e.g. 404) — trying other sources won't help. */
  fatal: boolean;

  constructor(kind: ApiErrorKind, message: string, opts: { status?: number; fatal?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = opts.status;
    this.fatal = opts.fatal ?? false;
  }
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

interface Source {
  id: string;
  timeoutMs: number;
  build: (endpoint: string, params: Record<string, string>) => string;
}

const env = import.meta.env;
const CLIENT_KEY = (env.VITE_TMDB_API_KEY || '').trim();
const USE_PROXY = env.VITE_USE_TMDB_PROXY !== 'false';
const PROXY_URL = env.VITE_TMDB_PROXY_URL || '/.netlify/functions/tmdb';

const SOURCES: Source[] = [];

if (USE_PROXY) {
  SOURCES.push({
    id: 'proxy',
    // Generous: covers a serverless cold start plus the proxy's own upstream retry.
    timeoutMs: 12000,
    build: (endpoint, params) => `${PROXY_URL}?${new URLSearchParams({ endpoint, ...params }).toString()}`,
  });
}

if (CLIENT_KEY) {
  for (const base of ['https://api.themoviedb.org/3', 'https://api.tmdb.org/3']) {
    SOURCES.push({
      id: base,
      timeoutMs: 9000,
      build: (endpoint, params) =>
        `${base}${endpoint}?${new URLSearchParams({ ...params, api_key: CLIENT_KEY }).toString()}`,
    });
  }
}

const HEDGE_DELAY_MS = 2500;
const PREFERRED_KEY = 'wl:api-source';
const PREFERRED_TTL_MS = 12 * 60 * 60 * 1000;

const readPreferred = (): string | null => {
  try {
    const raw = localStorage.getItem(PREFERRED_KEY);
    if (!raw) return null;
    const { id, at } = JSON.parse(raw) as { id: string; at: number };
    return Date.now() - at < PREFERRED_TTL_MS ? id : null;
  } catch {
    return null;
  }
};

let preferredSource: string | null = readPreferred();
/** Sources that proved unusable this session (e.g. proxy not deployed). */
const deadSources = new Set<string>();

const rememberSource = (id: string) => {
  if (preferredSource === id) return;
  preferredSource = id;
  try {
    localStorage.setItem(PREFERRED_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
};

const orderedSources = (): Source[] => {
  const alive = SOURCES.filter((s) => !deadSources.has(s.id));
  const pool = alive.length ? alive : SOURCES; // never end up with nothing to try
  if (!preferredSource) return pool;
  return [...pool].sort((a, b) => Number(b.id === preferredSource) - Number(a.id === preferredSource));
};

/* ------------------------------------------------------------------ */
/* Low-level fetch                                                     */
/* ------------------------------------------------------------------ */

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new ApiError('network', 'aborted'));
      },
      { once: true },
    );
  });

const fetchJson = async <T>(url: string, timeoutMs: number, outer: AbortSignal): Promise<T> => {
  const ctrl = new AbortController();
  const onOuterAbort = () => ctrl.abort();
  outer.addEventListener('abort', onOuterAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' }, credentials: 'omit' });
  } catch (err) {
    if (outer.aborted) throw new ApiError('network', 'aborted');
    if (ctrl.signal.aborted) throw new ApiError('timeout', `Timed out after ${timeoutMs}ms`);
    throw new ApiError('network', (err as Error)?.message || 'Network error');
  } finally {
    clearTimeout(timer);
    outer.removeEventListener('abort', onOuterAbort);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    // e.g. an SPA fallback page or a 404 HTML page when the proxy isn't deployed
    throw new ApiError('bad-response', `Expected JSON, got "${contentType || 'unknown'}" (${res.status})`, {
      status: res.status,
    });
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('bad-response', 'Malformed JSON', { status: res.status });
  }

  if (!res.ok) {
    const tmdbCode = (body as { status_code?: number } | null)?.status_code;
    // TMDB's own "resource not found" — definitive, no point trying elsewhere.
    if (res.status === 404 && typeof tmdbCode === 'number') {
      throw new ApiError('not-found', 'This title could not be found.', { status: 404, fatal: true });
    }
    throw new ApiError('http', `HTTP ${res.status}`, { status: res.status });
  }

  return body as T;
};

const isRetryable = (err: ApiError) =>
  err.kind === 'network' || (err.kind === 'http' && (err.status === 429 || (err.status ?? 0) >= 500));

const trySource = async <T>(
  source: Source,
  endpoint: string,
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<T> => {
  const MAX_ATTEMPTS = 2;
  let lastErr: ApiError | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchJson<T>(source.build(endpoint, params), source.timeoutMs, signal);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('network', String(e));
      lastErr = err;
      if (signal.aborted || !isRetryable(err) || attempt === MAX_ATTEMPTS - 1) break;
      // Exponential backoff with jitter: ~400ms, ~800ms…
      await sleep(400 * 2 ** attempt + Math.random() * 250, signal).catch(() => undefined);
    }
  }
  // A proxy that returns HTML / 404 / 401 isn't going to recover this session.
  if (
    source.id === 'proxy' &&
    lastErr &&
    (lastErr.kind === 'bad-response' || lastErr.status === 404 || lastErr.status === 401 || lastErr.status === 403)
  ) {
    deadSources.add(source.id);
  }
  throw lastErr ?? new ApiError('network', 'Unknown failure');
};

/** Runs sources in preference order, hedging slow ones. */
const fetchAcrossSources = <T>(endpoint: string, params: Record<string, string>): Promise<T> => {
  const order = orderedSources();
  if (order.length === 0) {
    return Promise.reject(
      new ApiError(
        'config',
        'No TMDB source configured. Set TMDB_API_KEY for the proxy, or VITE_TMDB_API_KEY for direct calls.',
        { fatal: true },
      ),
    );
  }

  return new Promise<T>((resolve, reject) => {
    let next = 0;
    let pending = 0;
    let settled = false;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;
    let lastErr: ApiError | null = null;
    const controllers: AbortController[] = [];

    const finish = () => {
      settled = true;
      clearTimeout(hedgeTimer);
    };

    const launch = (): boolean => {
      if (settled || next >= order.length) return false;
      const source = order[next++];
      const ctrl = new AbortController();
      controllers.push(ctrl);
      pending++;

      trySource<T>(source, endpoint, params, ctrl.signal).then(
        (data) => {
          if (settled) return;
          finish();
          controllers.forEach((c) => c !== ctrl && c.abort());
          rememberSource(source.id);
          resolve(data);
        },
        (err: ApiError) => {
          pending--;
          if (settled) return;
          // Prefer the most meaningful error for the final message.
          if (!lastErr || lastErr.kind === 'bad-response' || err.fatal) lastErr = err;
          if (err.fatal) {
            finish();
            controllers.forEach((c) => c.abort());
            reject(err);
            return;
          }
          if (!launch() && pending === 0) {
            finish();
            reject(lastErr);
          }
        },
      );

      clearTimeout(hedgeTimer);
      hedgeTimer = setTimeout(launch, HEDGE_DELAY_MS);
      return true;
    };

    launch();
  });
};

/* ------------------------------------------------------------------ */
/* Caching                                                             */
/* ------------------------------------------------------------------ */

interface Entry<T = unknown> {
  data: T;
  at: number;
}

const MEMORY_MAX = 250;
const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PERSIST_MAX_ENTRIES = 400;
const CACHE_NAME = 'wl-api-v1';
const LS_PREFIX = 'wl:api:';

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const memoryGet = (key: string): Entry | undefined => {
  const hit = memory.get(key);
  if (hit) {
    // LRU: move to the end
    memory.delete(key);
    memory.set(key, hit);
  }
  return hit;
};

const memorySet = (key: string, entry: Entry) => {
  memory.set(key, entry);
  if (memory.size > MEMORY_MAX) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
};

const hasCacheApi = (() => {
  try {
    return typeof window !== 'undefined' && 'caches' in window && window.isSecureContext;
  } catch {
    return false;
  }
})();

const cacheUrl = (key: string) => `${location.origin}/__wl_api_cache__/${encodeURIComponent(key)}`;

const persistGet = async (key: string): Promise<Entry | null> => {
  try {
    if (hasCacheApi) {
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match(cacheUrl(key));
      if (!res) return null;
      const at = Number(res.headers.get('x-wl-at')) || 0;
      return { data: await res.json(), at };
    }
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry) : null;
  } catch {
    return null;
  }
};

let writesSincePrune = 0;

const persistSet = async (key: string, entry: Entry) => {
  try {
    if (hasCacheApi) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        cacheUrl(key),
        new Response(JSON.stringify(entry.data), {
          headers: { 'content-type': 'application/json', 'x-wl-at': String(entry.at) },
        }),
      );
    } else {
      const json = JSON.stringify(entry);
      if (json.length < 150_000) localStorage.setItem(LS_PREFIX + key, json);
    }
    if (++writesSincePrune >= 25) {
      writesSincePrune = 0;
      void prunePersistent();
    }
  } catch {
    // Quota exceeded or storage blocked — prune and move on; the app still works.
    void prunePersistent();
  }
};

/** Drops expired entries and caps total count. Runs occasionally, off the critical path. */
export const prunePersistent = async () => {
  const now = Date.now();
  try {
    if (hasCacheApi) {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const overflow = Math.max(0, keys.length - PERSIST_MAX_ENTRIES);
      await Promise.all(
        keys.map(async (req, i) => {
          if (i < overflow) return cache.delete(req); // keys() is insertion-ordered: oldest first
          const res = await cache.match(req);
          const at = Number(res?.headers.get('x-wl-at')) || 0;
          if (now - at > PERSIST_MAX_AGE_MS) return cache.delete(req);
          return false;
        }),
      );
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k?.startsWith(LS_PREFIX)) continue;
        try {
          const { at } = JSON.parse(localStorage.getItem(k) || '{}') as Entry;
          if (!at || now - at > PERSIST_MAX_AGE_MS) localStorage.removeItem(k);
        } catch {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {
    /* ignore */
  }
};

/* ------------------------------------------------------------------ */
/* Connection status (drives the small offline / degraded banner)      */
/* ------------------------------------------------------------------ */

export interface NetStatus {
  online: boolean;
  /** Last request had to fall back to saved data. */
  degraded: boolean;
}

let netStatus: NetStatus = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  degraded: false,
};
const netListeners = new Set<() => void>();

const setNet = (patch: Partial<NetStatus>) => {
  const next = { ...netStatus, ...patch };
  if (next.online === netStatus.online && next.degraded === netStatus.degraded) return;
  netStatus = next;
  netListeners.forEach((l) => l());
};

export const getNetStatus = () => netStatus;
export const subscribeNet = (l: () => void) => {
  netListeners.add(l);
  return () => netListeners.delete(l);
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setNet({ online: true }));
  window.addEventListener('offline', () => setNet({ online: false }));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface RequestOptions {
  /** How long a cached copy counts as fresh (no network call at all). */
  ttlMs?: number;
}

const stableKey = (endpoint: string, params: Record<string, string>) =>
  `${endpoint}?${Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')}`;

export const tmdbRequest = <T>(
  endpoint: string,
  params: Record<string, string> = {},
  { ttlMs = 30 * 60 * 1000 }: RequestOptions = {},
): Promise<T> => {
  const key = stableKey(endpoint, params);

  const mem = memoryGet(key);
  if (mem && Date.now() - mem.at < ttlMs) return Promise.resolve(mem.data as T);

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    const saved = mem ?? (await persistGet(key));
    if (saved && Date.now() - saved.at < ttlMs) {
      memorySet(key, saved);
      return saved.data as T;
    }

    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (offline) {
      if (saved) {
        memorySet(key, saved);
        setNet({ online: false, degraded: true });
        return saved.data as T;
      }
      throw new ApiError('offline', "You're offline.");
    }

    try {
      const data = await fetchAcrossSources<T>(endpoint, params);
      const entry = { data, at: Date.now() };
      memorySet(key, entry);
      void persistSet(key, entry);
      setNet({ degraded: false });
      return data;
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('network', String(err));
      if (saved && !apiErr.fatal) {
        // Better old data than no data.
        memorySet(key, saved);
        setNet({ degraded: true });
        return saved.data as T;
      }
      throw apiErr;
    }
  })().finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
};

/** Read whatever is cached for a request without touching the network. */
export const peekCache = <T>(endpoint: string, params: Record<string, string> = {}): T | undefined =>
  memory.get(stableKey(endpoint, params))?.data as T | undefined;

export const friendlyError = (err: unknown): string => {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (err.kind) {
    case 'offline':
      return "You're offline. Reconnect and we'll pick up where you left off.";
    case 'not-found':
      return "We couldn't find this title. It may have been removed.";
    case 'config':
      return 'The movie database is not configured for this deployment.';
    case 'timeout':
      return 'The movie database is taking too long to respond.';
    default:
      return "We couldn't reach the movie database. Check your connection and try again.";
  }
};
