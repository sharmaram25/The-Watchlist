import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getTrending,
  getPopularMovies,
  getTopRated,
  getUpcoming,
  getMoviesByGenre,
  getTopRatedTVPage,
  getVideos,
  pickTrailer,
  searchMulti,
  ApiError,
} from '../services/tmdbService';
import { Movie, MoodType } from '../types';
import { Rail, LazyRail, RailSkeleton } from '../components/Rail';
import MovieGrid, { GridSkeleton } from '../components/MovieGrid';
import TmdbImage from '../components/TmdbImage';
import SaveButton from '../components/SaveButton';
import TrailerModal from '../components/TrailerModal';
import ConnectionErrorModal from '../components/ConnectionErrorModal';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useQuery } from '../hooks/useQuery';
import { useInView } from '../hooks/useInView';
import { useDocumentTitle } from '../hooks/useUi';
import { useCalmMotion, usePerf } from '../lib/perf';
import { tmdbSrcSet } from '../lib/images';
import { genreNames, MOOD_BLURBS } from '../constants';
import { toMovie, useRecent, useWatchlist } from '../lib/library';

const HERO_COUNT = 5;
const HERO_INTERVAL_S = 9;

const getTopRatedTV = async () => (await getTopRatedTVPage()).results;
const getAction = () => getMoviesByGenre(28);
const getComedy = () => getMoviesByGenre(35);
const getSciFi = () => getMoviesByGenre(878);

const yearOf = (m: Movie) => (m.release_date || m.first_air_date || '').slice(0, 4);
const pad = (n: number) => String(n).padStart(2, '0');

const usePageVisible = () => {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
};

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HeroSkeleton: React.FC = () => (
  <div className="relative h-[88svh] min-h-[540px] w-full overflow-hidden bg-ink-800" aria-hidden="true">
    <div className="absolute inset-0 skeleton !bg-ink-800" />
    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink to-transparent" />
    <div className="absolute inset-x-0 bottom-0 px-gutter pb-28 md:pb-36 max-w-4xl space-y-4">
      <div className="h-3 w-48 rounded bg-white/10" />
      <div className="h-16 md:h-24 w-3/4 rounded bg-white/10" />
      <div className="h-4 w-full max-w-xl rounded bg-white/[0.07]" />
      <div className="h-4 w-2/3 max-w-md rounded bg-white/[0.07]" />
      <div className="flex gap-3 pt-3">
        <div className="h-12 w-40 rounded-full bg-white/10" />
        <div className="h-12 w-36 rounded-full bg-white/[0.07]" />
      </div>
    </div>
  </div>
);

const Hero: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  const calm = useCalmMotion();
  const { reducedMotion, lite } = usePerf();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);
  const pageVisible = usePageVisible();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = movies.length;
  const hero = movies[index % count];
  const type = hero?.media_type === 'tv' ? 'tv' : 'movie';
  const backdropMax = lite ? 1280 : Infinity;
  const autoplay = !reducedMotion && count > 1;
  const playing = autoplay && inView && pageVisible && !hovering && !trailerOpen;

  const go = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + count) % count), [count]);

  const videos = useQuery(hero ? `videos:${type}:${hero.id}` : null, () => getVideos(hero.id, type));
  const trailer = pickTrailer(videos.data);

  // Preload the next backdrop so the crossfade never reveals a blank frame.
  useEffect(() => {
    const next = movies[(index + 1) % count];
    if (!next?.backdrop_path) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.sizes = '100vw';
    img.srcset = tmdbSrcSet(next.backdrop_path, 'backdrop', backdropMax) || '';
  }, [index, movies, count, backdropMax]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  if (!hero) return null;
  const title = hero.title || hero.name || '';
  const genres = genreNames(hero.genre_ids, 2);
  const year = yearOf(hero);

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Trending today"
      className="relative h-[88svh] min-h-[540px] max-h-[1080px] w-full overflow-hidden bg-ink-800 grain"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Backdrops crossfade over each other */}
      <AnimatePresence initial={false}>
        <m.div
          key={hero.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: calm ? 0.4 : 1.1, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0"
            style={calm ? undefined : { animation: `kenburns ${HERO_INTERVAL_S + 2}s cubic-bezier(0.22,1,0.36,1) both` }}
          >
            <TmdbImage
              path={hero.backdrop_path || hero.poster_path}
              kind={hero.backdrop_path ? 'backdrop' : 'poster'}
              sizes="100vw"
              maxWidth={backdropMax}
              loading="eager"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
            />
          </div>
        </m.div>
      </AnimatePresence>

      {/* Legibility: bottom fade into the page + a soft left vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/30 to-transparent pointer-events-none md:w-3/4" />

      {/* Title card */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-gutter pb-24 sm:pb-28 md:pb-36">
        <AnimatePresence mode="wait">
          <m.div
            key={hero.id}
            initial={calm ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={calm ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: calm ? 0.25 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <p className="kicker flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-4 md:mb-5">
              <span className="text-accent">Trending today</span>
              <span aria-hidden="true">·</span>
              <span>{type === 'tv' ? 'Series' : 'Film'}</span>
              {year && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{year}</span>
                </>
              )}
              {hero.vote_average > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-fg">{hero.vote_average.toFixed(1)} / 10</span>
                </>
              )}
            </p>

            <h1 className="font-display text-fluid-hero text-fg text-balance line-clamp-3 pb-[0.06em] [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">
              <Link to={`/details/${type}/${hero.id}`} className="hover:text-white transition-colors rounded-md">
                {title}
              </Link>
            </h1>

            {genres.length > 0 && <p className="mt-3 text-sm text-fg-muted">{genres.join(' / ')}</p>}

            <p className="mt-4 md:mt-5 text-[15px] md:text-[17px] leading-relaxed text-fg/80 max-w-xl line-clamp-2 md:line-clamp-3 text-pretty">
              {hero.overview}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {trailer ? (
                <button type="button" className="btn btn-lg btn-primary" onClick={() => setTrailerOpen(true)}>
                  <Play size={17} fill="currentColor" aria-hidden="true" /> Play trailer
                </button>
              ) : (
                <Link to={`/details/${type}/${hero.id}`} className="btn btn-lg btn-primary">
                  View details
                </Link>
              )}
              <SaveButton movie={hero} type={type} />
              {trailer && (
                <Link to={`/details/${type}/${hero.id}`} className="hidden sm:inline-flex btn btn-lg btn-ghost group/d">
                  Details <ArrowRight size={16} className="transition-transform group-hover/d:translate-x-0.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Chapter strip: progress shows exactly when the next slide arrives */}
      {count > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 z-20 px-gutter pb-5 md:pb-8"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="flex items-end gap-4">
            <div role="tablist" aria-label="Choose highlight" className="flex-1 grid grid-flow-col auto-cols-fr gap-2 md:gap-4">
              {movies.map((m, idx) => {
                const active = idx === index;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`${idx + 1} of ${count}: ${m.title || m.name}`}
                    onClick={() => setIndex(idx)}
                    className="group/ch text-left pt-3 pb-1 min-w-0"
                  >
                    <span className="block h-[2px] w-full rounded-full bg-white/20 overflow-hidden">
                      <span
                        key={active ? `on-${index}` : 'off'}
                        className="block h-full w-full origin-left bg-fg"
                        onAnimationEnd={active ? () => go(1) : undefined}
                        style={
                          active && autoplay
                            ? {
                                animation: `progress ${HERO_INTERVAL_S}s linear forwards`,
                                animationPlayState: playing ? 'running' : 'paused',
                              }
                            : { transform: `scaleX(${active || idx < index ? 1 : 0})`, opacity: active ? 1 : 0.45 }
                        }
                      />
                    </span>
                    <span
                      className={`hidden md:flex items-baseline gap-2 mt-2.5 text-[13px] transition-colors ${
                        active ? 'text-fg' : 'text-fg-faint group-hover/ch:text-fg-muted'
                      }`}
                    >
                      <span className="font-mono text-[11px] tabular">{pad(idx + 1)}</span>
                      <span className="truncate">{m.title || m.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="hidden md:flex gap-2 pb-0.5">
              <button type="button" onClick={() => go(-1)} aria-label="Previous highlight" className="btn-icon !w-10 !h-10 !bg-ink/40">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next highlight" className="btn-icon !w-10 !h-10 !bg-ink/40">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {trailerOpen && trailer && <TrailerModal videoKey={trailer.key} title={title} onClose={() => setTrailerOpen(false)} />}
      </AnimatePresence>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Mood strip — a shortcut into Discover                               */
/* ------------------------------------------------------------------ */

const MOOD_SHORTCUTS: MoodType[] = [
  MoodType.LIGHTHEARTED,
  MoodType.INTENSE,
  MoodType.EMOTIONAL,
  MoodType.DARK,
  MoodType.ADVENTUROUS,
  MoodType.FAMILY,
];

const MoodStrip: React.FC = () => (
  <section className="px-gutter py-8 md:py-12" aria-labelledby="mood-strip-title">
    <div className="rounded-2xl border border-white/[0.07] bg-ink-800 p-6 sm:p-8 md:p-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-center">
      <div>
        <p className="kicker mb-3">Can’t decide?</p>
        <h2 id="mood-strip-title" className="font-display text-fluid-section text-fg text-balance">
          Start with how you feel tonight.
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {MOOD_SHORTCUTS.map((mood) => (
          <Link
            key={mood}
            to={`/recommender?mood=${encodeURIComponent(mood)}`}
            className="group/mood rounded-xl border border-white/[0.07] bg-ink-900 px-4 py-3.5 hover:border-accent/50 hover:bg-ink-700 transition-colors"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-display text-xl text-fg">{mood}</span>
              <ArrowRight size={15} className="text-fg-faint group-hover/mood:text-accent group-hover/mood:translate-x-0.5 transition-[color,transform]" aria-hidden="true" />
            </span>
            <span className="block text-xs text-fg-faint mt-1 truncate">{MOOD_BLURBS[mood]}</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Search results (/?search=…)                                         */
/* ------------------------------------------------------------------ */

const SearchResults: React.FC<{ query: string }> = ({ query }) => {
  const calm = useCalmMotion();
  useDocumentTitle(`Search: ${query}`);
  const { data, error, loading, retry } = useQuery(`search:${query}`, () => searchMulti(query));

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 px-gutter pb-20">
      <m.header
        initial={calm ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 md:mb-14"
      >
        <p className="kicker mb-3">
          Search{data ? ` · ${data.length} result${data.length === 1 ? '' : 's'}` : ''}
        </p>
        <h1 className="font-display text-fluid-title text-fg break-words">“{query}”</h1>
      </m.header>

      {loading && !data ? (
        <GridSkeleton count={12} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={retry} />
      ) : data && data.length > 0 ? (
        <MovieGrid movies={data} />
      ) : (
        <EmptyState title="Nothing by that name">Check the spelling, or try the original-language title.</EmptyState>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

const Discover: React.FC = () => {
  useDocumentTitle(null);
  const trending = useQuery('home:trending', getTrending);
  const [retrying, setRetrying] = useState(false);
  const watchlist = useWatchlist();
  const recent = useRecent();

  useEffect(() => {
    if (!trending.loading) setRetrying(false);
  }, [trending.loading]);

  const heroMovies = (trending.data ?? []).filter((m) => m.backdrop_path).slice(0, HERO_COUNT);
  const fatal = (!!trending.error || retrying) && !trending.data;
  const offline =
    (trending.error instanceof ApiError && trending.error.kind === 'offline') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false);

  return (
    <div className="min-h-screen pb-10 relative">
      <ConnectionErrorModal
        isOpen={fatal}
        offline={offline}
        retrying={retrying}
        onRetry={() => {
          setRetrying(true);
          trending.retry();
        }}
      />

      {heroMovies.length > 0 ? <Hero movies={heroMovies} /> : <HeroSkeleton />}

      <div className="relative z-10 -mt-2 md:mt-2">
        {watchlist.length > 0 && (
          <Rail
            title="Your watchlist"
            kicker={`${watchlist.length} saved`}
            movies={watchlist.map(toMovie)}
            seeAllTo="/watchlist"
          />
        )}

        {trending.data ? (
          <Rail title="Trending now" kicker="Updated daily" movies={trending.data} categorySlug="trending" priority />
        ) : (
          <RailSkeleton title="Trending now" kicker="Updated daily" />
        )}

        {recent.length > 1 && (
          <Rail title="Recently viewed" kicker="Pick up the thread" movies={recent.map(toMovie)} seeAllTo="/watchlist" />
        )}

        <LazyRail queryKey="home:upcoming" fetcher={getUpcoming} title="Coming soon" kicker="In cinemas" categorySlug="upcoming" />

        <MoodStrip />

        <LazyRail queryKey="home:popular" fetcher={getPopularMovies} title="Popular films" categorySlug="popular-movies" />
        <LazyRail queryKey="home:top-tv" fetcher={getTopRatedTV} title="Top-rated series" kicker="All-time" categorySlug="top-rated-tv" />
        <LazyRail queryKey="home:action" fetcher={getAction} title="High-octane action" categorySlug="action" />
        <LazyRail queryKey="home:top-rated" fetcher={getTopRated} title="Critically acclaimed" kicker="All-time" categorySlug="top-rated" />
        <LazyRail queryKey="home:comedy" fetcher={getComedy} title="Laugh out loud" categorySlug="comedy" />
        <LazyRail queryKey="home:scifi" fetcher={getSciFi} title="Sci-fi & the future" categorySlug="sci-fi" />
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim();
  return searchQuery ? <SearchResults query={searchQuery} /> : <Discover />;
};

export default Home;
