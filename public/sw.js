/* The Watchlist — service worker
 *
 * - App shell (index.html): network-first with a short timeout, falls back to
 *   the cached copy so the app still opens offline or on a dead connection.
 * - Hashed build assets (/assets/*): cache-first (they never change).
 * - TMDB images + fonts: cache-first with a size cap, so revisits are instant.
 * - API calls are NOT handled here; the app has its own data cache with
 *   stale-on-error fallback (services/http.ts).
 */
const VERSION = 'v1';
const SHELL_CACHE = `wl-shell-${VERSION}`;
const ASSET_CACHE = `wl-assets-${VERSION}`;
const IMAGE_CACHE = `wl-img-${VERSION}`;
const FONT_CACHE = `wl-fonts-${VERSION}`;
const OWN_CACHES = [SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE, FONT_CACHE];
const IMAGE_MAX_ENTRIES = 350;
const ASSET_MAX_ENTRIES = 120;
const NAV_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', '/favicon.svg', '/manifest.webmanifest']))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Only remove our own outdated SW caches — never the app's API cache (wl-api-*).
            .filter((k) => /^wl-(shell|assets|img|fonts)-/.test(k) && !OWN_CACHES.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const putCounts = new Map();

const trim = async (cacheName, max) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - max;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
};

const store = async (cacheName, request, response, max) => {
  // Never cache opaque or failed responses (opaque ones also bloat storage quota).
  if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    if (max) {
      const n = (putCounts.get(cacheName) || 0) + 1;
      putCounts.set(cacheName, n);
      if (n % 25 === 0) await trim(cacheName, max);
    }
  } catch {
    /* quota exceeded — ignore */
  }
};

const cacheFirst = async (event, cacheName, max) => {
  const cached = await caches.match(event.request, { cacheName });
  if (cached) return cached;
  const response = await fetch(event.request);
  event.waitUntil(store(cacheName, event.request, response.clone(), max));
  return response;
};

const staleWhileRevalidate = async (event, cacheName) => {
  const cached = await caches.match(event.request, { cacheName });
  const network = fetch(event.request)
    .then((response) => {
      event.waitUntil(store(cacheName, event.request, response.clone()));
      return response;
    })
    .catch(() => cached);
  return cached || network;
};

const networkFirstShell = async (event) => {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(event.request).then((response) => {
    if (response && response.ok) {
      event.waitUntil(cache.put('/', response.clone()).catch(() => undefined));
    }
    return response;
  });

  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS, null));
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
    // Network is slow — serve the cached shell if we have one, else keep waiting.
    return (await cache.match('/')) || (await network);
  } catch {
    const cached = await cache.match('/');
    if (cached) return cached;
    throw new Error('offline and no cached shell');
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(networkFirstShell(event));
    return;
  }

  if (sameOrigin) {
    if (url.pathname.startsWith('/.netlify/functions/') || url.pathname.startsWith('/__wl_api_cache__/')) return;
    if (url.pathname.startsWith('/.netlify/images')) {
      event.respondWith(cacheFirst(event, IMAGE_CACHE, IMAGE_MAX_ENTRIES));
      return;
    }
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(cacheFirst(event, ASSET_CACHE, ASSET_MAX_ENTRIES));
      return;
    }
    if (/\.(svg|png|jpe?g|webp|webmanifest)$/.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
    }
    return;
  }

  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(cacheFirst(event, IMAGE_CACHE, IMAGE_MAX_ENTRIES).catch(() => fetch(request)));
    return;
  }

  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event, FONT_CACHE).catch(() => fetch(request)));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(event, FONT_CACHE));
  }
});
