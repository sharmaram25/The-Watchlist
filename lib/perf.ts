/**
 * Device capability detection.
 *
 * The app keeps one visual design for every device, but on low-powered
 * hardware it quietly drops the most expensive effects (backdrop blur,
 * parallax, the custom cursor, long staggered animations).
 *
 * Signals used:
 *  - CPU cores / device memory / Save-Data / slow connection (at startup)
 *  - A short frame-rate watchdog after load (catches weak GPUs that the
 *    static hints miss)
 *  - Manual override: `?perf=lite` / `?perf=full` (persisted), `?perf=auto` clears it
 */
import { useSyncExternalStore } from 'react';

export interface PerfState {
  /** Low-power mode: drop expensive visual effects. */
  lite: boolean;
  /** User asked the OS to reduce motion. */
  reducedMotion: boolean;
  /** Mouse/trackpad that can hover (desktop-class input). */
  finePointer: boolean;
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

const OVERRIDE_KEY = 'wl:perf';
const isBrowser = typeof window !== 'undefined';

const safeMatch = (query: string): boolean => {
  try {
    return isBrowser && window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

const readOverride = (): 'lite' | 'full' | null => {
  if (!isBrowser) return null;
  try {
    const param = new URLSearchParams(window.location.search).get('perf');
    if (param === 'auto') localStorage.removeItem(OVERRIDE_KEY);
    else if (param === 'lite' || param === 'full') localStorage.setItem(OVERRIDE_KEY, param);
    const stored = localStorage.getItem(OVERRIDE_KEY);
    return stored === 'lite' || stored === 'full' ? stored : null;
  } catch {
    return null;
  }
};

const detectLowPower = (): boolean => {
  if (!isBrowser) return false;
  const nav = navigator as NavigatorWithHints;
  const cores = nav.hardwareConcurrency || 8;
  // deviceMemory is Chromium-only; assume capable when unknown (Safari/Firefox).
  const memory = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData === true;
  const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType || '');
  return saveData || slowNet || memory <= 2 || cores <= 2 || (cores <= 4 && memory <= 4);
};

const override = readOverride();

let state: PerfState = {
  lite: override ? override === 'lite' : detectLowPower(),
  reducedMotion: safeMatch('(prefers-reduced-motion: reduce)'),
  finePointer: safeMatch('(hover: hover) and (pointer: fine)'),
};

const listeners = new Set<() => void>();

const applyClasses = () => {
  if (!isBrowser) return;
  const root = document.documentElement;
  root.classList.toggle('lite', state.lite);
  root.classList.toggle('reduce-motion', state.reducedMotion);
};

const setState = (patch: Partial<PerfState>) => {
  const next = { ...state, ...patch };
  if (
    next.lite === state.lite &&
    next.reducedMotion === state.reducedMotion &&
    next.finePointer === state.finePointer
  ) {
    return;
  }
  state = next;
  applyClasses();
  listeners.forEach((l) => l());
};

export const getPerf = (): PerfState => state;

export const subscribePerf = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePerf = (): PerfState => useSyncExternalStore(subscribePerf, getPerf, getPerf);

/** True when heavy/decorative motion should be skipped. */
export const useCalmMotion = (): boolean => {
  const { lite, reducedMotion } = usePerf();
  return lite || reducedMotion;
};

/**
 * Samples frame times for a couple of seconds once the page is idle.
 * If the device can't hold ~35fps, switch to low-power mode.
 */
const startFrameWatchdog = () => {
  if (!isBrowser || override || state.lite || typeof requestAnimationFrame !== 'function') return;

  const SAMPLE_FRAMES = 90;
  const SLOW_FRAME_MS = 28; // ~35fps

  const run = () => {
    if (document.visibilityState !== 'visible') return;
    const deltas: number[] = [];
    let last = performance.now();
    const tick = (now: number) => {
      deltas.push(now - last);
      last = now;
      if (document.visibilityState !== 'visible') return; // abandon; rAF throttled
      if (deltas.length < SAMPLE_FRAMES) {
        requestAnimationFrame(tick);
        return;
      }
      deltas.sort((a, b) => a - b);
      const median = deltas[Math.floor(deltas.length / 2)];
      if (median > SLOW_FRAME_MS) setState({ lite: true });
    };
    requestAnimationFrame(tick);
  };

  const schedule = () => window.setTimeout(run, 2500);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
};

/** Call once at startup, before React renders. */
export const initPerf = () => {
  if (!isBrowser) return;
  applyClasses();

  const watch = (query: string, key: 'reducedMotion' | 'finePointer') => {
    try {
      const mql = window.matchMedia(query);
      mql.addEventListener?.('change', (e) => setState({ [key]: e.matches } as Partial<PerfState>));
    } catch {
      /* old browsers: ignore */
    }
  };
  watch('(prefers-reduced-motion: reduce)', 'reducedMotion');
  watch('(hover: hover) and (pointer: fine)', 'finePointer');

  startFrameWatchdog();
};

/** House easing curve — a long, soft "cinematic" ease-out. */
export const EASE_CINEMA = [0.22, 1, 0.36, 1] as const;
