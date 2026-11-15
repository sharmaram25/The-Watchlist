import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { m } from 'framer-motion';
import { Movie } from '../types';
import MovieCard from './MovieCard';
import { ErrorState } from './StateViews';
import { useInView } from '../hooks/useInView';
import { useQuery } from '../hooks/useQuery';
import { useCalmMotion } from '../lib/perf';

const ITEM_CLASS = 'snap-start shrink-0 w-[clamp(128px,36vw,188px)] 3xl:w-[212px]';
const RAIL_SIZES = '(max-width: 520px) 38vw, (max-width: 1919px) 190px, 212px';
const MAX_ITEMS = 16;

interface HeaderProps {
  title: string;
  kicker?: React.ReactNode;
  categorySlug?: string;
  seeAllTo?: string;
  controls?: React.ReactNode;
}

export const SectionHeader: React.FC<HeaderProps> = ({ title, kicker, categorySlug, seeAllTo, controls }) => {
  const to = seeAllTo ?? (categorySlug ? `/category/${categorySlug}` : undefined);
  return (
    <div className="flex items-end justify-between gap-4 pr-gutter mb-4 md:mb-6">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="font-display text-fluid-section text-fg truncate">{title}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0 pb-0.5">
        {controls}
        {to && (
          <Link
            to={to}
            className="group/see inline-flex items-center gap-1.5 h-9 pl-2 text-sm text-fg-muted hover:text-fg transition-colors"
          >
            See all
            <ArrowRight size={15} className="transition-transform duration-200 group-hover/see:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
};

/** Prev/next state for a horizontal scroller. */
const useScroller = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return { ref, edges, scrollBy };
};

const ScrollControls: React.FC<{ edges: { start: boolean; end: boolean }; onScroll: (d: 1 | -1) => void }> = ({
  edges,
  onScroll,
}) =>
  edges.start && edges.end ? null : (
    <div className="hidden [@media(hover:hover)]:flex items-center gap-1.5">
      <button type="button" className="btn-icon !w-9 !h-9" aria-label="Scroll left" onClick={() => onScroll(-1)} disabled={edges.start}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" className="btn-icon !w-9 !h-9" aria-label="Scroll right" onClick={() => onScroll(1)} disabled={edges.end}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );

const TRACK = 'flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto overscroll-x-contain pt-1 pb-4 pr-gutter hide-scrollbar snap-x snap-mandatory';

export const RailSkeleton: React.FC<{ title: string; kicker?: React.ReactNode }> = ({ title, kicker }) => (
  <section className="py-6 md:py-9 pl-gutter" aria-hidden="true">
    <SectionHeader title={title} kicker={kicker} />
    <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-hidden pt-1 pb-4 pr-gutter">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className={ITEM_CLASS}>
          <div className="aspect-[2/3] rounded-lg skeleton" />
          <div className="mt-3 h-3 w-3/4 rounded bg-ink-700" />
          <div className="mt-2 h-2.5 w-1/2 rounded bg-ink-700/70" />
        </div>
      ))}
    </div>
  </section>
);

interface RailProps {
  title: string;
  movies: Movie[];
  kicker?: React.ReactNode;
  categorySlug?: string;
  seeAllTo?: string;
  priority?: boolean;
}

export const Rail: React.FC<RailProps> = ({ title, movies, kicker, categorySlug, seeAllTo, priority = false }) => {
  const calm = useCalmMotion();
  const { ref, edges, scrollBy } = useScroller();

  return (
    <m.section
      initial={calm ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      className="relative py-6 md:py-9 pl-gutter"
      aria-label={title}
    >
      <SectionHeader
        title={title}
        kicker={kicker}
        categorySlug={categorySlug}
        seeAllTo={seeAllTo}
        controls={<ScrollControls edges={edges} onScroll={scrollBy} />}
      />
      <div ref={ref} role="list" aria-label={title} className={TRACK}>
        {movies.slice(0, MAX_ITEMS).map((movie, idx) => (
          <div key={`${movie.media_type}-${movie.id}`} role="listitem" className={ITEM_CLASS}>
            <MovieCard movie={movie} index={idx} priority={priority && idx < 5} sizes={RAIL_SIZES} />
          </div>
        ))}
      </div>
    </m.section>
  );
};

interface LazyRailProps extends Omit<RailProps, 'movies'> {
  queryKey: string;
  fetcher: () => Promise<Movie[]>;
}

/** Fetches only when near the viewport; fails in isolation with an inline retry. */
export const LazyRail: React.FC<LazyRailProps> = ({ queryKey, fetcher, ...rail }) => {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: '700px 0px', once: true });
  const { data, error, loading, retry } = useQuery(near ? queryKey : null, fetcher);

  let content: React.ReactNode;
  if (data && data.length > 0) content = <Rail {...rail} movies={data} />;
  else if (error && !loading)
    content = (
      <section className="py-6 md:py-9 pl-gutter">
        <SectionHeader title={rail.title} kicker={rail.kicker} />
        <div className="pr-gutter">
          <ErrorState error={error} onRetry={retry} compact />
        </div>
      </section>
    );
  else if (data && data.length === 0) content = null;
  else content = <RailSkeleton title={rail.title} kicker={rail.kicker} />;

  return (
    <div ref={ref} className="cv-auto">
      {content}
    </div>
  );
};

export default Rail;
