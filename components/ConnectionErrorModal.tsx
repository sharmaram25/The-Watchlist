import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCw } from 'lucide-react';
import { useScrollLock } from '../hooks/useUi';

interface Props {
  isOpen: boolean;
  onRetry: () => void;
  retrying?: boolean;
  offline?: boolean;
}

/** Last resort: every route failed AND nothing is cached. */
const ConnectionErrorModal: React.FC<Props> = ({ isOpen, onRetry, retrying = false, offline = false }) => {
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="conn-title">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80" />
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-md bg-ink-800 border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-8"
          >
            <p className="kicker mb-3">{offline ? 'No network' : 'Signal lost'}</p>
            <h2 id="conn-title" className="font-display text-4xl text-fg mb-4">
              {offline ? 'You’re offline' : 'Can’t reach the archive'}
            </h2>
            <p className="text-fg-muted leading-relaxed mb-3">
              {offline
                ? 'Reconnect to Wi-Fi or mobile data — we’ll reload automatically as soon as you’re back.'
                : 'We tried every route to our film database (TMDB) and none answered. Some networks restrict access to it.'}
            </p>
            {!offline && (
              <p className="text-sm text-fg-faint leading-relaxed mb-7">
                If it keeps happening, switch networks or turn on a DNS service such as Cloudflare WARP, then retry.
              </p>
            )}
            <button type="button" onClick={onRetry} disabled={retrying} className="btn btn-lg btn-primary w-full">
              {retrying ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <RotateCw size={17} aria-hidden="true" />}
              {retrying ? 'Reconnecting…' : 'Try again'}
            </button>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionErrorModal;
