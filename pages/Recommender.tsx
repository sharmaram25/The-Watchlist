import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { Check, ChevronDown, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { discoverContent, Paged } from '../services/tmdbService';
import { MOOD_MAPPINGS, LANGUAGES, GENRES_LIST, MOOD_BLURBS } from '../constants';
import { MoodType, Movie } from '../types';
import MovieGrid, { GridSkeleton } from '../components/MovieGrid';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useDocumentTitle } from '../hooks/useUi';
import { useCalmMotion } from '../lib/perf';

const DECADES = [
  { key: '2020s', from: 2020, to: 2029 },
  { key: '2010s', from: 2010, to: 2019 },
  { key: '2000s', from: 2000, to: 2009 },
  { key: '1990s', from: 1990, to: 1999 },
  { key: '1980s', from: 1980, to: 1989 },
  { key: 'Classics', from: 1900, to: 1979 },
];

const RATINGS = [
  { value: 0, label: 'Any' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
];

const SORTS = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'revenue.desc', label: 'Box office' },
];

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const MOODS = Object.values(MoodType);

const Recommender: React.FC = () => {
  useDocumentTitle('Discover');
  const calm = useCalmMotion();
  const [params] = useSearchParams();

  const initialMood = params.get('mood') as MoodType | null;
  const [moods, setMoods] = useState<MoodType[]>(initialMood && MOODS.includes(initialMood) ? [initialMood] : []);
  const [genres, setGenres] = useState<number[]>([]);
  const [decade, setDecade] = useState<string | null>(null);
  const [language, setLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [feed, setFeed] = useState<(Paged<Movie> & { items: Movie[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const requestId = useRef(0);

  const options = useMemo(() => {
    const d = DECADES.find((x) => x.key === decade);
    const moodGenres = moods.flatMap((mood) => MOOD_MAPPINGS[mood].genres);
    return {
      genres: Array.from(new Set([...moodGenres, ...genres])),
      language,
      fromYear: d?.from,
      toYear: d?.to,
      sortBy,
      minRating,
    };
  }, [moods, genres, decade, language, sortBy, minRating]);

  const run = async (page: number) => {
    const id = ++requestId.current;
    page === 1 ? setLoading(true) : setLoadingMore(true);
    setError(undefined);
    try {
      const res = await discoverContent({ ...options, page });
      if (id !== requestId.current) return;
      setFeed((prev) => {
        if (page === 1 || !prev) return { ...res, items: res.results };
        const seen = new Set(prev.items.map((x) => x.id));
        return { ...res, items: prev.items.concat(res.results.filter((x) => !seen.has(x.id))) };
      });
    } catch (e) {
      if (id === requestId.current) setError(e);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // Live results: refetch shortly after any filter change
  useEffect(() => {
    const t = setTimeout(() => void run(1), 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const refineCount = genres.length + (decade ? 1 : 0) + (language !== 'all' ? 1 : 0) + (minRating ? 1 : 0);
  const anyFilter = moods.length + refineCount > 0 || sortBy !== 'popularity.desc';

  const clearAll = () => {
    setMoods([]);
    setGenres([]);
    setDecade(null);
    setLanguage('all');
    setSortBy('popularity.desc');
    setMinRating(0);
  };

  const summary = [
    ...moods,
    ...genres.map((g) => GENRES_LIST.find((x) => x.id === g)?.name),
    decade,
    language !== 'all' ? LANGUAGES.find((l) => l.code === language)?.name : null,
    minRating ? `${minRating}+ rated` : null,
  ].filter(Boolean) as string[];

  const hasMore = !!feed && feed.page < Math.min(feed.totalPages, 25);

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 px-gutter pb-16">
      <m.header
        initial={calm ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mb-10 md:mb-14"
      >
        <p className="kicker mb-3">Discover</p>
        <h1 className="font-display text-fluid-title text-fg text-balance">What are you in the mood for?</h1>
        <p className="mt-4 text-fg-muted text-[17px] leading-relaxed max-w-xl text-pretty">
          Pick a feeling or two, narrow it down if you like — the list updates as you go.
        </p>
      </m.header>

      {/* Moods */}
      <fieldset className="mb-8">
        <legend className="sr-only">Moods</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {MOODS.map((mood) => {
            const on = moods.includes(mood);
            return (
              <button
                key={mood}
                type="button"
                aria-pressed={on}
                onClick={() => setMoods((prev) => toggle(prev, mood))}
                className={`relative text-left rounded-xl border px-4 py-4 sm:px-5 sm:py-5 transition-[background-color,border-color] duration-200 ${
                  on ? 'border-accent/70 bg-accent/[0.08]' : 'border-white/[0.08] bg-ink-800 hover:border-white/20 hover:bg-ink-700'
                }`}
              >
                <span className="block font-display text-[1.45rem] sm:text-[1.7rem] leading-none text-fg pr-6">{mood}</span>
                <span className="block mt-2 text-[12.5px] sm:text-[13px] text-fg-faint leading-snug">{MOOD_BLURBS[mood]}</span>
                <span
                  className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-[opacity,transform] duration-200 bg-accent text-accent-ink ${
                    on ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                  aria-hidden="true"
                >
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Refine */}
      <div className="border-y border-white/[0.07] py-5 mb-10">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className="md:hidden w-full flex items-center justify-between text-fg"
        >
          <span className="flex items-center gap-2 text-[15px]">
            <SlidersHorizontal size={17} aria-hidden="true" /> Refine
            {refineCount > 0 && <span className="font-mono text-[11px] text-accent">{refineCount}</span>}
          </span>
          <ChevronDown size={18} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        <div className={`${filtersOpen ? 'grid' : 'hidden'} md:grid gap-6 mt-5 md:mt-0`}>
          <div className="grid md:grid-cols-[7rem_minmax(0,1fr)] gap-3 md:items-start">
            <p className="kicker md:pt-2.5">Genres</p>
            <div className="flex flex-wrap gap-2">
              {GENRES_LIST.map((g) => (
                <button key={g.id} type="button" className="chip" aria-pressed={genres.includes(g.id)} onClick={() => setGenres((p) => toggle(p, g.id))}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-[7rem_minmax(0,1fr)] gap-3 md:items-center">
            <p className="kicker">Era</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Era">
              <button type="button" role="radio" aria-checked={decade === null} className="chip" onClick={() => setDecade(null)}>
                Any time
              </button>
              {DECADES.map((d) => (
                <button key={d.key} type="button" role="radio" aria-checked={decade === d.key} className="chip" onClick={() => setDecade(d.key)}>
                  {d.key}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-[7rem_minmax(0,1fr)] gap-3 md:items-center">
            <p className="kicker">Rating</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex gap-2" role="radiogroup" aria-label="Minimum rating">
                {RATINGS.map((r) => (
                  <button key={r.value} type="button" role="radio" aria-checked={minRating === r.value} className="chip font-mono !text-[13px]" onClick={() => setMinRating(r.value)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="relative">
                  <span className="sr-only">Language</span>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="field !h-9 !w-auto !pr-9 !rounded-full appearance-none text-sm">
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.code === 'all' ? 'Any language' : l.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-faint" aria-hidden="true" />
                </label>
                <label className="relative">
                  <span className="sr-only">Sort by</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="field !h-9 !w-auto !pr-9 !rounded-full appearance-none text-sm">
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-faint" aria-hidden="true" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-6">
          <p className="text-fg">
            {feed && !error ? (
              <>
                <span className="font-display text-3xl tabular">{feed.totalResults.toLocaleString()}</span>{' '}
                <span className="text-fg-muted">titles</span>
                {summary.length > 0 && <span className="text-fg-faint text-sm"> · {summary.join(', ')}</span>}
              </>
            ) : (
              <span className="text-fg-muted">Finding titles…</span>
            )}
          </p>
          {anyFilter && (
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
              <X size={14} aria-hidden="true" /> Clear all
            </button>
          )}
        </div>

        {loading && !feed ? (
          <GridSkeleton count={12} />
        ) : error && !feed ? (
          <ErrorState error={error} onRetry={() => run(1)} />
        ) : feed && feed.items.length === 0 ? (
          <EmptyState
            title="No exact match"
            action={
              <button type="button" onClick={clearAll} className="btn btn-secondary">
                Reset filters
              </button>
            }
          >
            That combination is a bit too specific. Try removing a genre or widening the era.
          </EmptyState>
        ) : feed ? (
          <>
            <div className={`transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
              <MovieGrid movies={feed.items} />
            </div>
            {error ? (
              <ErrorState error={error} onRetry={() => run(feed.page + 1)} compact className="mt-10 max-w-xl mx-auto" />
            ) : hasMore ? (
              <div className="flex justify-center mt-12">
                <button type="button" onClick={() => run(feed.page + 1)} disabled={loadingMore} className="btn btn-secondary">
                  {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {loadingMore ? 'Loading' : 'Show more'}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Recommender;
