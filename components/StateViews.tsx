import React from 'react';
import { RotateCw } from 'lucide-react';
import { ApiError, friendlyError } from '../services/http';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
  className?: string;
}

/** Recoverable error with a retry — calm, not alarming. */
export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, title, compact = false, className = '' }) => {
  const offline = error instanceof ApiError && error.kind === 'offline';
  const canRetry = !(error instanceof ApiError && (error.kind === 'not-found' || error.kind === 'config'));

  if (compact) {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/[0.07] bg-ink-800 px-4 py-3.5 text-sm text-fg-muted ${className}`}
      >
        <span className="flex-1 min-w-[12rem]">{friendlyError(error)}</span>
        {onRetry && canRetry && (
          <button type="button" onClick={onRetry} className="btn btn-secondary !h-9 !px-4 !text-sm">
            <RotateCw size={14} aria-hidden="true" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 ${className}`}>
      <p className="kicker mb-4">{offline ? 'Offline' : 'Signal lost'}</p>
      <h2 className="font-display text-4xl sm:text-5xl text-fg mb-4 text-balance">
        {title || (offline ? 'You’re offline' : 'The projector stalled')}
      </h2>
      <p className="text-fg-muted max-w-md leading-relaxed text-pretty">{friendlyError(error)}</p>
      {onRetry && canRetry && (
        <button type="button" onClick={onRetry} className="btn btn-lg btn-light mt-8">
          <RotateCw size={17} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, children, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4 ${className}`}>
    {title && <h2 className="font-display text-3xl sm:text-4xl text-fg mb-3 text-balance">{title}</h2>}
    {children && <p className="text-fg-muted max-w-md leading-relaxed text-pretty">{children}</p>}
    {action && <div className="mt-8">{action}</div>}
  </div>
);

export const Spinner: React.FC<{ className?: string; label?: string }> = ({ className = '', label = 'Loading' }) => (
  <div role="status" className={`flex items-center justify-center ${className}`}>
    <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
    <span className="sr-only">{label}</span>
  </div>
);
