import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CATEGORIES, CategoryDef } from '../services/tmdbService';
import { Movie } from '../types';
import MovieGrid, { GridSkeleton } from '../components/MovieGrid';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useInView } from '../hooks/useInView';
import { useDocumentTitle } from '../hooks/useUi';

const MAX_PAGES = 15;

interface Feed {
  items: Movie[];
  page: number;
  totalPages: number;
}

/** Remembers loaded pages per category so "back" restores the full list instantly. */
const sessionFeeds = new Map<string, Feed>();

const keyOf = (m: Movie) => `${m.media_type}-${m.id}`;

const merge = (existing: Movie[], incoming: Movie[]) => {
  const seen = new Set(existing.map(keyOf));
  return existing.concat(incoming.filter((m) => !seen.has(keyOf(m))));
};

const CategoryFeed: React.FC<{ slug: string; def: CategoryDef }> = ({ slug, def }) => {
  const [feed, setFeed] = useState<Feed | null>(() => sessionFeeds.get(slug) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const busy = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const nearEnd = useInView(sentinelRef, { rootMargin: '900px 0px' });

  const load = useCallback(
    async (page: number) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      setError(undefined);
      try {
        const res = await def.fetchPage(page);
        setFeed((prev) => {
          const next: Feed = {
            items: page === 1 || !prev ? res.results : merge(prev.items, res.results),
            page: res.page,
            totalPages: res.totalPages,
          };
          sessionFeeds.set(slug, next);
          return next;
        });
      } catch (e) {
        setError(e);
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [def, slug],
  );

  useEffect(() => {
    if (!feed) void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMore = !!feed && feed.page < Math.min(feed.totalPages, MAX_PAGES);

  // Infinite scroll: fetch the next page as the end of the grid approaches.
  useEffect(() => {
    if (nearEnd && hasMore && !loading && !error && feed) void load(feed.page + 1);
  }, [nearEnd, hasMore, loading, error, feed, load]);

  if (!feed) {
    return error ? <ErrorState error={error} onRetry={() => load(1)} /> : <GridSkeleton count={18} />;
  }

  if (feed.items.length === 0) return <EmptyState title="Nothing here right now">Check back soon.</EmptyState>;

  return (
    <>
      <MovieGrid movies={feed.items} priorityCount={6} />
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <div className="flex justify-center py-12">
        {error ? (
          <ErrorState error={error} onRetry={() => load(feed.page + 1)} compact className="w-full max-w-xl" />
        ) : loading ? (
          <Loader2 size={24} className="text-accent animate-spin" aria-label="Loading more" />
        ) : hasMore ? (
          <button type="button" onClick={() => load(feed.page + 1)} className="btn btn-secondary">
            Show more
          </button>
        ) : (
          <p className="kicker">That’s a wrap</p>
        )}
      </div>
    </>
  );
};

const Category: React.FC = () => {
  const { category = '' } = useParams<{ category: string }>();
  const def = CATEGORIES[category];
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle(def?.title ?? 'Not found');

  const goBack = (e: React.MouseEvent) => {
    // Return to where the user came from (keeps their scroll position on Home)
    if (location.key !== 'default') {
      e.preventDefault();
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 px-gutter pb-8">
      <header className="mb-10 md:mb-14">
        <Link to="/" onClick={goBack} className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-5 group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back
        </Link>
        <p className="kicker mb-3">Collection</p>
        <h1 className="font-display text-fluid-title text-fg">{def?.title ?? 'Unknown collection'}</h1>
      </header>

      {def ? (
        <CategoryFeed key={category} slug={category} def={def} />
      ) : (
        <EmptyState title="No such collection">It may have been renamed.</EmptyState>
      )}
    </div>
  );
};

export default Category;
