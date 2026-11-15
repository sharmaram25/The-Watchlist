import React from 'react';
import { m } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscape, useScrollLock } from '../hooks/useUi';

interface Props {
  videoKey: string;
  title: string;
  onClose: () => void;
}

/** Plays a YouTube trailer in place — no leaving the app. */
const TrailerModal: React.FC<Props> = ({ videoKey, title, onClose }) => {
  useScrollLock(true);
  useEscape(true, onClose);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-3 sm:p-8"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="kicker truncate">
            Trailer <span className="text-fg-faint">·</span> <span className="text-fg normal-case tracking-normal font-sans text-sm">{title}</span>
          </p>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close trailer" autoFocus>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </m.div>
    </m.div>
  );
};

export default TrailerModal;
