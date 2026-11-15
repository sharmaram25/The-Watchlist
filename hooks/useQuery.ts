import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal data-fetching hook.
 *  - Results are kept in a small session store keyed by `key`, so going back
 *    to a page renders instantly (no skeleton flash) while it revalidates.
 *  - Ignores responses for stale keys (no race conditions when params change).
 *  - Automatically retries when the browser comes back online.
 *  - Pass `key = null` to skip fetching (e.g. until a section scrolls into view).
 */
const store = new Map<string, unknown>();
const STORE_MAX = 150;

const remember = (key: string, data: unknown) => {
  store.delete(key);
  store.set(key, data);
  if (store.size > STORE_MAX) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
};

interface QueryState<T> {
  key: string | null;
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

export interface QueryResult<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  retry: () => void;
}

const initialState = <T,>(key: string | null): QueryState<T> => {
  const cached = key !== null && store.has(key) ? (store.get(key) as T) : undefined;
  return { key, data: cached, error: undefined, loading: key !== null && cached === undefined };
};

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>(() => initialState<T>(key));
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Key changed: derive fresh state during render (avoids a flash of old data).
  let current = state;
  if (state.key !== key) {
    current = initialState<T>(key);
    setState(current);
  }

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;

    if (!store.has(key)) {
      setState((s) => (s.key === key ? { ...s, loading: true, error: undefined } : s));
    }

    fetcherRef.current().then(
      (data) => {
        remember(key, data);
        if (!cancelled) setState({ key, data, error: undefined, loading: false });
      },
      (error) => {
        if (!cancelled) setState((s) => (s.key === key ? { ...s, error, loading: false } : s));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const hasError = current.error !== undefined;
  useEffect(() => {
    if (!hasError) return;
    const onOnline = () => setNonce((n) => n + 1);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [hasError]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: s.data === undefined, error: undefined }));
    setNonce((n) => n + 1);
  }, []);

  return { data: current.data, error: current.error, loading: current.loading, retry };
}
