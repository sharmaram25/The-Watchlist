import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import TmdbImage from './TmdbImage';
import SaveButton from './SaveButton';
import { useIsSaved } from '../lib/library';

interface Props {
  movie: Movie;
  index?: number;
  /** Load the poster eagerly (first few above-the-fold cards). */
  priority?: boolean;
  /** `sizes` hint for the poster. */
  sizes?: string;
  /** Hide the caption (e.g. dense layouts). */
  bare?: boolean;
}

const DEFAULT_SIZES = '(max-width: 480px) 40vw, (max-width: 1024px) 190px, 210px';

/**
 * Poster card. The art is left clean (posters already carry their own title
 * treatment); title and slate-style metadata sit underneath.
 * Fluid width, fixed 2:3 ratio — works in rails and grids alike.
 */
const MovieCard: React.FC<Props> = ({ movie, priority = false, sizes = DEFAULT_SIZES, bare = false }) => {
  const type = movie.media_type === 'tv' ? 'tv' : 'movie';
  const title = movie.title || movie.name || 'Untitled';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = typeof movie.vote_average === 'number' && movie.vote_average > 0 ? movie.vote_average : 0;
  const [loaded, setLoaded] = useState(false);
  const saved = useIsSaved(movie.id, type);

  return (
    <div className="group relative">
      <Link
        to={`/details/${type}/${movie.id}`}
        className="block rounded-lg outline-offset-4"
        aria-label={`${title}${year ? `, ${year}` : ''}${type === 'tv' ? ', series' : ''}${rating ? `, rated ${rating.toFixed(1)}` : ''}`}
      >
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg bg-ink-700 transition-[transform,box-shadow] duration-500 ease-cinema group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.9)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          {!loaded && movie.poster_path && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
          <TmdbImage
            path={movie.poster_path}
            kind="poster"
            sizes={sizes}
            alt=""
            onLoaded={() => setLoaded(true)}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            width={342}
            height={513}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.03] motion-reduce:transition-none"
            fallback={
              <div className="absolute inset-0 flex items-end p-3 bg-ink-700">
                <span className="font-display text-xl leading-tight text-fg-muted line-clamp-4">{title}</span>
              </div>
            }
          />
          {/* hairline frame */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.07] pointer-events-none" />
        </div>

        {!bare && (
          <div className="mt-2.5 px-0.5">
            <p className="text-[14px] font-medium leading-snug text-fg line-clamp-1 transition-colors group-hover:text-accent">
              {title}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-fg-faint tabular flex items-center gap-1.5">
              {year && <span>{year}</span>}
              {year && <span aria-hidden="true">·</span>}
              <span>{type === 'tv' ? 'Series' : 'Film'}</span>
              {rating > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-fg-muted">{rating.toFixed(1)}</span>
                </>
              )}
            </p>
          </div>
        )}
      </Link>

      <SaveButton
        movie={movie}
        type={type}
        variant="icon"
        className={`absolute top-2 right-2 z-10 transition-[opacity,transform] duration-300 group-hover:-translate-y-1 ${
          saved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      />
    </div>
  );
};

export default memo(
  MovieCard,
  (a, b) => a.movie.id === b.movie.id && a.priority === b.priority && a.sizes === b.sizes && a.bare === b.bare,
);
