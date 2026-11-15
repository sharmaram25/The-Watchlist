import React from 'react';
import { Bookmark, Check, Plus } from 'lucide-react';
import { Movie } from '../types';
import { MediaType, toggleSaved, useIsSaved } from '../lib/library';

interface Props {
  movie: Movie;
  type: MediaType;
  variant?: 'button' | 'icon';
  className?: string;
}

/** Add to / remove from the on-device Watchlist. */
const SaveButton: React.FC<Props> = ({ movie, type, variant = 'button', className = '' }) => {
  const saved = useIsSaved(movie.id, type);
  const title = movie.title || movie.name || 'this title';

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(movie, type);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
        title={saved ? 'In your watchlist' : 'Add to watchlist'}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-[background-color,color,opacity,transform] duration-200 active:scale-90 ${
          saved
            ? 'bg-accent text-accent-ink'
            : 'bg-ink/75 text-fg border border-white/15 hover:bg-ink hover:border-white/30'
        } ${className}`}
      >
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={`btn btn-lg btn-secondary ${saved ? '!border-accent/50 !text-accent' : ''} ${className}`}
    >
      {saved ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
      {saved ? 'In watchlist' : 'Watchlist'}
    </button>
  );
};

export default SaveButton;
