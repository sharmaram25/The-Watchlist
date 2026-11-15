/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_USE_TMDB_PROXY?: string;
  readonly VITE_TMDB_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
