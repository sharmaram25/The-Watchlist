import React from 'react';
import { Movie } from '../types';
import MovieCard from './MovieCard';

/**
 * Auto-fitting poster grid: 2 columns on phones up to 8+ on large monitors,
 * without hard-coded breakpoints.
 */
export const GRID_CLASS =
  'grid [--card-min:clamp(136px,40vw,180px)] 3xl:[--card-min:200px] grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] gap-x-3 gap-y-7 sm:gap-x-5 md:gap-y-9';

export const GRID_SIZES = '(max-width: 480px) 45vw, (max-width: 1024px) 30vw, 220px';

interface Props {
  movies: Movie[];
  className?: string;
  priorityCount?: number;
}

const MovieGrid: React.FC<Props> = ({ movies, className = '', priorityCount = 4 }) => (
  <div className={`${GRID_CLASS} ${className}`}>
    {movies.map((movie, idx) => (
      <div key={`${movie.media_type}-${movie.id}`}>
        <MovieCard movie={movie} index={idx} priority={idx < priorityCount} sizes={GRID_SIZES} />
      </div>
    ))}
  </div>
);

export const GridSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 12, className = '' }) => (
  <div className={`${GRID_CLASS} ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <div className="aspect-[2/3] rounded-lg skeleton" />
        <div className="mt-3 h-3 w-3/4 rounded bg-ink-700" />
        <div className="mt-2 h-2.5 w-1/2 rounded bg-ink-700/70" />
      </div>
    ))}
  </div>
);

export default MovieGrid;
