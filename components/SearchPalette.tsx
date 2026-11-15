import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { Search, X, History, TrendingUp, CornerDownLeft, Loader2 } from 'lucide-react';
import { searchMulti, getTrending } from '../services/tmdbService';
import { friendlyError } from '../services/http';
import { Movie } from '../types';
import TmdbImage from './TmdbImage';
import { useEscape, useScrollLock } from '../hooks/useUi';

const RECENT_KEY = 'wl:searches';

const readRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, 6) : [];
  } catch {
    return [];
  }
};
const saveRecent = (q: string) => {
  try {
    const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

const meta = (m: Movie) => {
  const year = (m.release_date || m.first_air_date || '').slice(0, 4);
  return [m.media_type === 'tv' ? 'Series' : 'Film', year].filter(Boolean).join(' · ');
};

const SearchPalette: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<unknown>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useScrollLock(true);
  useEscape(true, onClose);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    getTrending()
      .then((res) => setTrending(res.slice(0, 6)))
      .catch(() => undefined);
    return () => clearTimeout(t);
  }, []);

  const q = query.trim();

  useEffect(() => {
    setActive(0);
    if (q.length < 2) {
      requestId.current++;
      setResults([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await searchMulti(q);
        if (id !== requestId.current) return;
        setResults(res.slice(0, 8));
        setStatus('done');
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e);
        setStatus('error');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const items = q.length >= 2 ? results : trending;

  const open = (movie: Movie) => {
    if (q.length >= 2) saveRecent(q);
    onClose();
    navigate(`/details/${movie.media_type === 'tv' ? 'tv' : 'movie'}/${movie.id}`);
  };

  const seeAll = () => {
    if (!q) return;
    saveRecent(q);
    onClose();
    navigate(`/?search=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey && q) seeAll();
      else if (items[active] && (q.length < 2 || status === 'done')) open(items[active]);
      else seeAll();
    }
  };

  // Keep the active row in view while arrowing
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const sectionLabel = useMemo(() => {
    if (q.length >= 2) return status === 'done' && results.length ? 'Results' : '';
    return 'Trending today';
  }, [q, status, results.length]);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] bg-black/75 md:backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <m.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex flex-col bg-ink-900 h-full md:h-auto md:max-h-[min(70vh,640px)] md:mt-[12vh] md:mx-auto md:max-w-2xl md:rounded-2xl md:border md:border-white/10 md:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden pt-[var(--safe-top)] md:pt-0"
      >
        <div className="flex items-center gap-3 px-4 sm:px-5 h-16 border-b border-white/[0.07] shrink-0">
          {status === 'loading' ? (
            <Loader2 size={20} className="text-accent animate-spin shrink-0" aria-hidden="true" />
          ) : (
            <Search size={20} className="text-fg-faint shrink-0" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `sr-${active}` : undefined}
            aria-label="Search movies and TV shows"
            placeholder="Search films and series"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 min-w-0 bg-transparent text-fluid-search text-fg placeholder:text-fg-faint outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1.5 text-fg-faint hover:text-fg" aria-label="Clear search">
              <X size={18} aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onClose} className="md:hidden text-sm text-fg-muted pl-1">
            Cancel
          </button>
          <span className="kbd hidden md:inline-flex">esc</span>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {q.length < 2 && recent.length > 0 && (
            <div className="px-4 sm:px-5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="kicker">Recent</p>
                <button
                  type="button"
                  className="text-xs text-fg-faint hover:text-fg"
                  onClick={() => {
                    try {
                      localStorage.removeItem(RECENT_KEY);
                    } catch {
                      /* ignore */
                    }
                    setRecent([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} type="button" className="chip !h-8" onClick={() => setQuery(r)}>
                    <History size={13} aria-hidden="true" /> {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && q.length >= 2 ? (
            <p className="px-5 py-10 text-center text-fg-muted">{friendlyError(error)}</p>
          ) : status === 'done' && results.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display text-2xl text-fg mb-1">Nothing by that name</p>
              <p className="text-sm text-fg-muted">Check the spelling, or try the original title.</p>
            </div>
          ) : (
            <>
              {sectionLabel && (
                <p className="kicker px-4 sm:px-5 pt-5 pb-2 flex items-center gap-1.5">
                  {q.length < 2 && <TrendingUp size={12} aria-hidden="true" />} {sectionLabel}
                </p>
              )}
              <ul ref={listRef} id="search-results" role="listbox" className="pb-2">
                {items.map((movie, idx) => (
                  <li
                    key={`${movie.media_type}-${movie.id}`}
                    id={`sr-${idx}`}
                    data-index={idx}
                    role="option"
                    aria-selected={idx === active}
                    onMouseMove={() => setActive(idx)}
                    onClick={() => open(movie)}
                    className={`flex items-center gap-3.5 mx-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      idx === active ? 'bg-white/[0.07]' : ''
                    }`}
                  >
                    <div className="w-10 h-[60px] rounded-md overflow-hidden bg-ink-700 shrink-0">
                      <TmdbImage path={movie.poster_path} kind="poster" size="w92" sizes="40px" maxWidth={185} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-fg truncate">{movie.title || movie.name}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-faint mt-0.5">{meta(movie)}</p>
                    </div>
                    {movie.vote_average > 0 && (
                      <span className="font-mono text-xs text-fg-muted tabular">{movie.vote_average.toFixed(1)}</span>
                    )}
                    {idx === active && <CornerDownLeft size={14} className="text-fg-faint hidden md:block" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {q.length >= 2 && status === 'done' && results.length > 0 && (
          <button
            type="button"
            onClick={seeAll}
            className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 h-12 border-t border-white/[0.07] text-sm text-fg-muted hover:text-fg hover:bg-white/[0.03] transition-colors pb-[var(--safe-bottom)] md:pb-0"
          >
            <span className="truncate">
              See all results for <span className="text-fg">“{q}”</span>
            </span>
            <span className="kbd hidden md:inline-flex">shift ↵</span>
          </button>
        )}
      </m.div>
    </m.div>
  );
};

export default SearchPalette;
