import React, { memo, useState } from 'react';
import { Movie } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, PlayCircle } from 'lucide-react';

interface Props {
  movie: Movie;
  index?: number;
}

const MovieCard: React.FC<Props> = ({ movie, index = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);

  const type = movie.media_type === 'tv' ? 'tv' : 'movie';

  return (
    <Link to={`/details/${type}/${movie.id}`}>
      <div
        className="magnetic-target relative w-[200px] h-[300px] rounded-lg flex-shrink-0 cursor-none group z-10"
        style={{
          animationDelay: `${index * 25}ms`,
        }}
      >
        <div
          className={`w-full h-full rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shadow-lg will-change-transform transition-all ${shouldReduceMotion ? 'duration-150' : 'duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_35px_rgba(0,0,0,0.55)] group-hover:border-cyan-400/60'}`}
        >
          {!imageLoaded && (
            <div
              className={`absolute inset-0 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 ${shouldReduceMotion ? '' : 'animate-pulse'}`}
            />
          )}

          <img
            src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%23404040" width="200" height="300"/%3E%3C/svg%3E'}
            alt={movie.title || movie.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width="200"
            height="300"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all ${shouldReduceMotion ? 'duration-200' : 'duration-500 group-hover:scale-[1.04]'} ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 pointer-events-none transition-opacity ${shouldReduceMotion ? 'opacity-90 duration-150' : 'opacity-70 group-hover:opacity-95 duration-300'}`} />

          <div className={`absolute bottom-0 left-0 w-full p-4 z-20 transition-all ${shouldReduceMotion ? 'duration-150 opacity-100 translate-y-0' : 'duration-300 opacity-85 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-lg">{movie.title || movie.name}</h3>
            <div className={`flex items-center gap-2 mt-2.5 text-cyan-300 transition-transform ${shouldReduceMotion ? '' : 'group-hover:translate-y-0 translate-y-0.5 duration-300'}`}>
              <Star size={13} fill="currentColor" className="text-yellow-400" />
              <span className="text-xs font-bold tracking-wider">{movie.vote_average.toFixed(1)}</span>
            </div>
          </div>

          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all ${shouldReduceMotion ? 'opacity-100 scale-100 duration-150' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 duration-300'}`}>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/30 shadow-2xl">
              <PlayCircle size={36} className="text-white drop-shadow-lg" />
            </div>
          </div>

          <div className={`absolute -inset-3 bg-gradient-to-r from-cyan-500/35 to-blue-500/20 rounded-xl blur-xl -z-10 transition-opacity ${shouldReduceMotion ? 'opacity-60 duration-150' : 'opacity-0 group-hover:opacity-100 duration-500'}`} />
        </div>
      </div>
    </Link>
  );
};

export default memo(MovieCard);