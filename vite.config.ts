import path from 'path';
import { pathToFileURL } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Runs the Netlify TMDB function inside the Vite dev/preview server, so local
 * development behaves exactly like production (key stays server-side) without
 * needing netlify-cli. Uses TMDB_API_KEY / TMDB_READ_TOKEN from .env.local.
 * If no server key is configured, requests fall through and the client
 * automatically uses VITE_TMDB_API_KEY directly instead.
 */
function tmdbProxy(env: Record<string, string>): Plugin {
  const functionUrl = pathToFileURL(path.resolve(__dirname, 'netlify/functions/tmdb.mjs')).href;

  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/.netlify/functions/tmdb')) return next();
    if (!env.TMDB_API_KEY && !env.TMDB_READ_TOKEN) return next();
    try {
      if (env.TMDB_API_KEY) process.env.TMDB_API_KEY = env.TMDB_API_KEY;
      if (env.TMDB_READ_TOKEN) process.env.TMDB_READ_TOKEN = env.TMDB_READ_TOKEN;
      const { default: handler } = await import(/* @vite-ignore */ functionUrl);
      const response: Response = await handler(new Request(`http://localhost${req.url}`, { method: req.method }));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Local TMDB proxy failed', detail: String(err) }));
    }
  };

  return {
    name: 'tmdb-local-proxy',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  // '' prefix: also load non-VITE_ vars (server-only, never exposed to the client bundle)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port: 4173,
    },
    plugins: [react(), tmdbProxy(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      cssMinify: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          // React rarely changes between deploys — keep it in its own long-cached chunk.
          manualChunks(id) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/.test(id)) {
              return 'react';
            }
          },
        },
      },
    },
    esbuild: {
      legalComments: 'none',
    },
  };
});
