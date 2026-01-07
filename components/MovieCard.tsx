import React, { useRef, useState } from 'react';
import { Movie } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, PlayCircle } from 'lucide-react';

interface Props {
  movie: Movie;
  index?: number;
}

const MovieCard: React.FC<Props> = ({ movie, index = 0 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXVal = ((y - centerY) / centerY) * -8;
    const rotateYVal = ((x - centerX) / centerX) * 8;

    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const type = movie.media_type === 'tv' ? 'tv' : 'movie';

  return (
    <Link to={`/details/${type}/${movie.id}`}>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        className="magnetic-target relative w-[200px] h-[300px] rounded-lg flex-shrink-0 cursor-none perspective-1000 group z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1000,
        }}
      >
        <motion.div
          className="w-full h-full rounded-lg overflow-hidden bg-neutral-900 border border-white/5 group-hover:border-cyan-500/50 transition-colors duration-500"
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            transformStyle: 'preserve-3d',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <img
            src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://picsum.photos/200/300'}
            alt={movie.title || movie.name}
            loading="lazy"
            width="200"
            height="300"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          <div className="absolute bottom-0 left-0 w-full p-4 translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-z-20">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">{movie.title || movie.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-cyan-400">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-bold tracking-wider">{movie.vote_average.toFixed(1)}</span>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none transform translate-z-30">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20">
                <PlayCircle size={32} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
          </div>

          <div 
             className="absolute -inset-4 bg-cyan-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 mix-blend-screen"
          />
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;