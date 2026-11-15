import React from 'react';

/** Bookmark-shaped mark with a play notch — "a list of things to watch". */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path
      d="M6.5 2.5h11a1.5 1.5 0 0 1 1.5 1.5v16.6a.75.75 0 0 1-1.2.6L12 16.9l-5.8 4.3a.75.75 0 0 1-1.2-.6V4a1.5 1.5 0 0 1 1.5-1.5Z"
      fill="currentColor"
    />
    <path d="M10.4 7.2v5.6l4.6-2.8-4.6-2.8Z" fill="#0B0B0C" />
  </svg>
);

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className="text-accent shrink-0" />
    <span className="font-display text-[1.6rem] leading-none tracking-[-0.01em] text-fg whitespace-nowrap translate-y-[1px]">
      <span className="italic text-fg-muted">The</span> Watchlist
    </span>
  </span>
);

export default Logo;
