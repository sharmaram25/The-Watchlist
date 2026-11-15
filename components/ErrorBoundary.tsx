import React from 'react';
import { RotateCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Changing this value resets the boundary (e.g. on route change). */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

const CHUNK_RELOAD_KEY = 'wl:chunk-reload';

const isChunkError = (error: Error) =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error?.message || '',
  );

/**
 * Keeps a crash in one page from blanking the whole app.
 * After a new deploy, old lazy chunks can 404 — in that case reload once to
 * pick up the fresh build.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
          window.location.reload();
          return;
        }
      } catch {
        /* storage blocked */
      }
    }
    console.error('[The Watchlist] UI error:', error);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-gutter pt-safe-nav pb-16">
        <p className="kicker mb-4">Reel jam</p>
        <h1 className="font-display text-5xl sm:text-6xl text-fg mb-4">This scene didn’t load</h1>
        <p className="text-fg-muted max-w-md mb-8">Something broke while rendering this page. A reload usually fixes it.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-lg btn-light">
          <RotateCw size={17} aria-hidden="true" /> Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
