import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { m, useScroll, useTransform, AnimatePresence, MotionValue } from 'framer-motion';
import { Play, ArrowLeft, Download, X, Maximize2, ExternalLink, User } from 'lucide-react';
import { getDetails, pickTrailer } from '../services/tmdbService';
import { MovieDetails, CrewMember, Review } from '../types';
import TmdbImage from '../components/TmdbImage';
import SaveButton from '../components/SaveButton';
import TrailerModal from '../components/TrailerModal';
import { Rail } from '../components/Rail';
import { ErrorState, EmptyState, Spinner } from '../components/StateViews';
import { useQuery } from '../hooks/useQuery';
import { useDocumentTitle, useEscape, useScrollLock } from '../hooks/useUi';
import { useCalmMotion, usePerf, EASE_CINEMA } from '../lib/perf';
import { tmdbUrl } from '../lib/images';
import { pushRecent } from '../lib/library';

/* ---------------- helpers ---------------- */

const formatMoney = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${Math.round(n / 1e6)}M`);
const formatVotes = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
const formatRuntime = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);
const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const languageName = (code?: string) => {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
};

const KEY_JOBS: { label: string; jobs: string[] }[] = [
  { label: 'Directed by', jobs: ['Director'] },
  { label: 'Written by', jobs: ['Screenplay', 'Writer', 'Story', 'Novel'] },
  { label: 'Music by', jobs: ['Original Music Composer', 'Music'] },
  { label: 'Cinematography', jobs: ['Director of Photography'] },
];

const keyPeople = (crew: CrewMember[]) =>
  KEY_JOBS.map(({ label, jobs }) => ({
    label,
    names: [...new Set(crew.filter((c) => jobs.includes(c.job)).map((c) => c.name))].slice(0, 3),
  })).filter((g) => g.names.length > 0);

/* ---------------- hero backdrop ---------------- */

const Backdrop: React.FC<{ movie: MovieDetails; y?: MotionValue<number>; scale?: MotionValue<number> }> = ({ movie, y, scale }) => {
  const { lite } = usePerf();
  return (
    <m.div style={y ? { y, scale } : undefined} className="absolute inset-0 will-change-transform">
      <TmdbImage
        path={movie.backdrop_path}
        kind="backdrop"
        sizes="100vw"
        maxWidth={lite ? 1280 : Infinity}
        loading="eager"
        fetchPriority="high"
        alt=""
        className="w-full h-full object-cover object-[center_25%]"
        fallback={<div className="w-full h-full bg-ink-800" />}
      />
    </m.div>
  );
};

const ParallaxBackdrop: React.FC<{ movie: MovieDetails }> = ({ movie }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 140]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.06]);
  return <Backdrop movie={movie} y={y} scale={scale} />;
};

/* ---------------- poster modal ---------------- */

const PosterModal: React.FC<{ movie: MovieDetails; onClose: () => void }> = ({ movie, onClose }) => {
  useScrollLock(true);
  useEscape(true, onClose);
  const [saving, setSaving] = useState(false);
  const title = movie.title || movie.name || 'poster';

  const download = async () => {
    if (!movie.poster_path) return;
    const url = tmdbUrl(movie.poster_path, 'original')!;
    const name = title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'poster';
    setSaving(true);
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blobUrl = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank', 'noopener');
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} poster`}
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center gap-5 p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]"
      onClick={onClose}
    >
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={download} disabled={saving} className="btn btn-light">
          <Download size={17} aria-hidden="true" /> {saving ? 'Saving…' : 'Save poster'}
        </button>
        <button type="button" onClick={onClose} className="btn-icon" aria-label="Close" autoFocus>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <TmdbImage
          path={movie.poster_path}
          kind="poster"
          size="w780"
          sizes="(max-width: 640px) 90vw, 560px"
          loading="eager"
          alt={`${title} poster`}
          className="max-h-[calc(100svh-8rem)] w-auto rounded-lg ring-1 ring-white/10"
        />
      </div>
    </m.div>
  );
};

/* ---------------- review ---------------- */

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const [open, setOpen] = useState(false);
  const long = review.content.length > 420;
  return (
    <article className="border-t border-white/[0.07] pt-6">
      <header className="flex items-center justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-fg font-medium truncate">{review.author}</p>
          {!!review.rating && <p className="font-mono text-[11px] text-fg-faint mt-0.5 tabular">{review.rating} / 10</p>}
        </div>
        {review.url && (
          <a href={review.url} target="_blank" rel="noreferrer" className="text-fg-faint hover:text-fg p-1" aria-label={`Read ${review.author}'s review on TMDB`}>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
      </header>
      <p className={`text-fg-muted leading-relaxed whitespace-pre-line ${open ? '' : 'line-clamp-5'}`}>{review.content}</p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-sm text-fg link-underline">
          {open ? 'Show less' : 'Read full review'}
        </button>
      )}
    </article>
  );
};

/* ---------------- view ---------------- */

const DetailsView: React.FC<{ movie: MovieDetails; type: 'movie' | 'tv' }> = ({ movie, type }) => {
  const calm = useCalmMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const [posterOpen, setPosterOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const closePoster = useCallback(() => setPosterOpen(false), []);

  const title = movie.title || movie.name || 'Untitled';
  useDocumentTitle(title);

  useEffect(() => {
    pushRecent(movie, type);
  }, [movie, type]);

  const trailer = pickTrailer(movie.videos?.results);
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const cast = movie.credits?.cast ?? [];
  const people = useMemo(() => keyPeople(movie.credits?.crew ?? []), [movie.credits?.crew]);
  const reviews = movie.reviews?.results ?? [];
  const similar = movie.similar?.results ?? [];
  const keywords = (movie.keywords?.results || movie.keywords?.keywords || []).slice(0, 14);
  const runtime = movie.runtime || movie.episode_run_time?.[0];
  const creators = (movie as MovieDetails & { created_by?: { name: string }[] }).created_by?.map((c) => c.name) ?? [];

  const rating = useMemo(() => {
    if (type === 'movie') {
      const pick = (c: string) =>
        movie.release_dates?.results?.find((r) => r.iso_3166_1 === c)?.release_dates.find((d) => d.certification)?.certification;
      return pick('US') || pick('GB') || pick('IN');
    }
    const pick = (c: string) => movie.content_ratings?.results?.find((r) => r.iso_3166_1 === c)?.rating;
    return pick('US') || pick('GB') || pick('IN');
  }, [movie, type]);

  const slate = [type === 'tv' ? 'Series' : 'Film', year, rating, runtime ? (type === 'tv' ? `${runtime}m / ep` : formatRuntime(runtime)) : undefined].filter(Boolean);

  const facts: { label: string; value?: React.ReactNode }[] = [
    { label: 'Status', value: movie.status },
    { label: type === 'tv' ? 'First aired' : 'Released', value: formatDate(movie.release_date || movie.first_air_date) },
    ...(type === 'tv'
      ? [
          { label: 'Seasons', value: movie.number_of_seasons },
          { label: 'Episodes', value: movie.number_of_episodes },
        ]
      : []),
    { label: 'Language', value: languageName(movie.original_language) },
    ...(type === 'movie'
      ? [
          { label: 'Budget', value: movie.budget ? formatMoney(movie.budget) : undefined },
          { label: 'Box office', value: movie.revenue ? formatMoney(movie.revenue) : undefined },
        ]
      : []),
    {
      label: 'Studios',
      value: movie.production_companies?.length ? movie.production_companies.slice(0, 3).map((c) => c.name).join(', ') : undefined,
    },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  const goBack = (e: React.MouseEvent) => {
    if (location.key !== 'default') {
      e.preventDefault();
      navigate(-1);
    }
  };

  const enter = (delay = 0) =>
    calm
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: EASE_CINEMA } };

  return (
    <div className="relative">
      {/* ---------- Hero ---------- */}
      <section className="relative min-h-[78svh] md:min-h-[86svh] flex items-end overflow-hidden grain">
        <div className="absolute inset-0">{calm ? <Backdrop movie={movie} /> : <ParallaxBackdrop movie={movie} />}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />

        <Link
          to="/"
          onClick={goBack}
          aria-label="Go back"
          className="btn-icon !bg-ink/60 lite:!bg-ink/90 backdrop-blur-md absolute z-20 left-gutter top-[calc(var(--nav-h)+var(--safe-top)+0.75rem)]"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>

        <div className="relative z-10 w-full px-gutter pt-[calc(var(--nav-h)+5rem)] pb-10 md:pb-16 grid md:grid-cols-[auto_minmax(0,1fr)] gap-8 lg:gap-12 items-end">
          {movie.poster_path && (
            <m.button
              type="button"
              {...enter(0)}
              onClick={() => setPosterOpen(true)}
              aria-label="View poster"
              className="hidden md:block group relative w-48 lg:w-60 3xl:w-72 aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
            >
              <TmdbImage path={movie.poster_path} kind="poster" size="w500" sizes="(min-width: 1920px) 288px, 240px" loading="eager" alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={26} aria-hidden="true" />
              </span>
            </m.button>
          )}

          <m.div {...enter(0.08)} className="min-w-0 max-w-4xl">
            <p className="kicker flex flex-wrap gap-x-2.5 gap-y-1 mb-4">
              {slate.map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span className={i === 0 ? 'text-accent' : ''}>{s}</span>
                </React.Fragment>
              ))}
            </p>
            <h1 className="font-display text-fluid-display text-fg text-balance pb-[0.06em]">{title}</h1>
            {movie.tagline && <p className="font-display italic text-xl md:text-2xl text-fg-muted mt-3 text-balance">{movie.tagline}</p>}

            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
              {movie.vote_average > 0 && (
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl leading-none text-fg tabular">{movie.vote_average.toFixed(1)}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg-faint leading-tight">
                    / 10
                    {!!movie.vote_count && (
                      <>
                        <br />
                        {formatVotes(movie.vote_count)} votes
                      </>
                    )}
                  </span>
                </div>
              )}
              {movie.genres?.length > 0 && <p className="text-sm text-fg-muted pb-1">{movie.genres.map((g) => g.name).join(' / ')}</p>}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {trailer && (
                <button type="button" className="btn btn-lg btn-primary" onClick={() => setTrailerOpen(true)}>
                  <Play size={17} fill="currentColor" aria-hidden="true" /> Play trailer
                </button>
              )}
              <SaveButton movie={movie} type={type} />
              {movie.poster_path && (
                <button type="button" onClick={() => setPosterOpen(true)} className="md:hidden btn btn-lg btn-ghost">
                  <Maximize2 size={16} aria-hidden="true" /> Poster
                </button>
              )}
            </div>
          </m.div>
        </div>
      </section>

      {/* ---------- Body ---------- */}
      <div className="px-gutter pt-10 md:pt-16 pb-6 grid gap-14 lg:gap-20 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="synopsis">
            <h2 id="synopsis" className="kicker mb-4">Synopsis</h2>
            <p className="text-lg md:text-[1.35rem] leading-relaxed text-fg/90 max-w-3xl text-pretty">
              {movie.overview || 'No synopsis has been written for this title yet.'}
            </p>

            {(people.length > 0 || creators.length > 0) && (
              <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 max-w-3xl">
                {creators.length > 0 && (
                  <div>
                    <dt className="kicker mb-1.5">Created by</dt>
                    <dd className="text-fg text-[15px] leading-snug">{creators.slice(0, 3).join(', ')}</dd>
                  </div>
                )}
                {people.map((p) => (
                  <div key={p.label}>
                    <dt className="kicker mb-1.5">{p.label}</dt>
                    <dd className="text-fg text-[15px] leading-snug">{p.names.join(', ')}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {cast.length > 0 && (
            <section aria-labelledby="cast">
              <h2 id="cast" className="font-display text-fluid-section text-fg mb-5">Cast</h2>
              <ul className="flex gap-4 overflow-x-auto hide-scrollbar snap-x -mx-gutter px-gutter lg:mx-0 lg:px-0 pb-2">
                {cast.slice(0, 16).map((p, i) => (
                  <li key={`${p.id}-${i}`} className="snap-start shrink-0 w-[112px] sm:w-[128px]">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ink-700 ring-1 ring-inset ring-white/[0.06]">
                      <TmdbImage
                        path={p.profile_path}
                        kind="profile"
                        sizes="128px"
                        alt=""
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-fg-faint">
                            <User size={28} aria-hidden="true" />
                          </div>
                        }
                      />
                    </div>
                    <p className="mt-2.5 text-[14px] text-fg leading-snug line-clamp-2">{p.name}</p>
                    {p.character && <p className="text-[12px] text-fg-faint leading-snug line-clamp-2 mt-0.5">{p.character}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reviews.length > 0 && (
            <section aria-labelledby="reviews" className="max-w-3xl">
              <h2 id="reviews" className="font-display text-fluid-section text-fg mb-2">
                Reviews <span className="font-mono text-sm text-fg-faint align-middle">{reviews.length}</span>
              </h2>
              <div className="space-y-6">
                {reviews.slice(0, 3).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] self-start space-y-10">
          {facts.length > 0 && (
            <section aria-labelledby="facts">
              <h2 id="facts" className="kicker mb-4">Details</h2>
              <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-6 py-3 text-[14px]">
                    <dt className="text-fg-faint shrink-0">{f.label}</dt>
                    <dd className="text-fg text-right">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {keywords.length > 0 && (
            <section aria-labelledby="keywords">
              <h2 id="keywords" className="kicker mb-4">Themes</h2>
              <ul className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <li key={k.id} className="text-[13px] text-fg-muted border border-white/10 rounded-full px-3 py-1">
                    {k.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <div className="mt-6">
          <Rail title="More like this" movies={similar} />
        </div>
      )}

      <AnimatePresence>
        {posterOpen && <PosterModal movie={movie} onClose={closePoster} />}
        {trailerOpen && trailer && <TrailerModal videoKey={trailer.key} title={title} onClose={() => setTrailerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

/* ---------------- route ---------------- */

const Details: React.FC = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const numericId = Number(id);
  const validType = type === 'movie' || type === 'tv' ? type : null;
  const valid = !!validType && Number.isInteger(numericId) && numericId > 0;

  const { data, error, loading, retry } = useQuery(valid ? `details:${validType}:${numericId}` : null, () =>
    getDetails(numericId, validType as 'movie' | 'tv'),
  );

  if (!valid) {
    return (
      <div className="min-h-screen pt-safe-nav px-gutter">
        <EmptyState title="That isn’t a title">The link looks broken.</EmptyState>
      </div>
    );
  }

  if (data) return <DetailsView key={`${validType}-${numericId}`} movie={data} type={validType!} />;

  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-gutter pt-safe-nav">
        <ErrorState error={error} onRetry={retry} title="Couldn’t load this title" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner label="Loading title" />
    </div>
  );
};

export default Details;
