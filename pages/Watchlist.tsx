import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import MovieGrid from '../components/MovieGrid';
import { Rail } from '../components/Rail';
import { EmptyState } from '../components/StateViews';
import { clearRecent, toMovie, useRecent, useWatchlist, LibraryItem } from '../lib/library';
import { useDocumentTitle } from '../hooks/useUi';

type Sort = 'added' | 'title' | 'rating' | 'year';
type Filter = 'all' | 'movie' | 'tv';

const SORTERS: Record<Sort, (a: LibraryItem, b: LibraryItem) => number> = {
  added: (a, b) => b.at - a.at,
  title: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => b.vote_average - a.vote_average,
  year: (a, b) => (b.release_date || '').localeCompare(a.release_date || ''),
};

const Watchlist: React.FC = () => {
  useDocumentTitle('Your watchlist');
  const list = useWatchlist();
  const recent = useRecent();
  const [sort, setSort] = useState<Sort>('added');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: list.length,
      movie: list.filter((i) => i.media_type === 'movie').length,
      tv: list.filter((i) => i.media_type === 'tv').length,
    }),
    [list],
  );

  const items = useMemo(
    () => list.filter((i) => filter === 'all' || i.media_type === filter).sort(SORTERS[sort]).map(toMovie),
    [list, filter, sort],
  );

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 pb-10">
      <header className="px-gutter mb-10">
        <p className="kicker mb-3">Saved on this device</p>
        <h1 className="font-display text-fluid-title text-fg">Your watchlist</h1>
      </header>

      {list.length === 0 ? (
        <div className="px-gutter">
          <EmptyState
            title="Nothing saved yet"
            action={
              <Link to="/" className="btn btn-lg btn-light">
                Browse what’s trending
              </Link>
            }
          >
            Tap the bookmark on any poster, or “Watchlist” on a title page, and it’ll wait for you here.
          </EmptyState>
        </div>
      ) : (
        <section className="px-gutter" aria-label="Saved titles">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-white/[0.07]">
            <div className="flex gap-2" role="radiogroup" aria-label="Show">
              {(['all', 'movie', 'tv'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={filter === f}
                  className="chip"
                  onClick={() => setFilter(f)}
                  disabled={f !== 'all' && counts[f] === 0}
                >
                  {f === 'all' ? 'All' : f === 'movie' ? 'Films' : 'Series'}
                  <span className="font-mono text-[11px] opacity-60 tabular">{counts[f]}</span>
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !h-9 !w-auto !pr-9 !rounded-full appearance-none text-sm">
                <option value="added">Recently added</option>
                <option value="title">Title A–Z</option>
                <option value="rating">Highest rated</option>
                <option value="year">Newest release</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-faint" aria-hidden="true" />
            </label>
          </div>
          <MovieGrid movies={items} priorityCount={6} />
        </section>
      )}

      {recent.length > 0 && (
        <div className="mt-16 relative">
          <Rail title="Recently viewed" kicker={`${recent.length} title${recent.length === 1 ? '' : 's'}`} movies={recent.map(toMovie)} />
          <div className="px-gutter -mt-2">
            <button type="button" onClick={clearRecent} className="text-sm text-fg-faint hover:text-fg link-underline">
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
