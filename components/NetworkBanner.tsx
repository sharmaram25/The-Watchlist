import React, { useSyncExternalStore } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { getNetStatus, subscribeNet } from '../services/http';

/** Quiet status pill while offline or serving saved data. */
const NetworkBanner: React.FC = () => {
  const { online, degraded } = useSyncExternalStore(subscribeNet, getNetStatus, getNetStatus);
  const show = !online || degraded;

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 z-[70] flex justify-center px-4 pointer-events-none top-[calc(var(--nav-h)+var(--safe-top)+0.5rem)] md:top-auto md:bottom-[calc(1.25rem+var(--safe-bottom))]"
    >
      <AnimatePresence>
        {show && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-ink-800/95 px-4 py-2 text-xs sm:text-[13px] text-fg-muted shadow-2xl"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-accent' : 'bg-fg-faint'}`} aria-hidden="true" />
            {online ? 'Weak connection — showing saved results' : 'Offline — showing saved results'}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkBanner;
