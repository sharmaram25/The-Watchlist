import React, { useEffect, useRef } from 'react';
import { usePerf } from '../lib/perf';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="option"]';
const TEXT_INPUT = 'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea';

/**
 * A precise dot with a soft trailing ring that opens up over interactive
 * elements. Mouse devices only; disabled in low-power / reduced-motion mode.
 * The animation loop sleeps once the ring has caught up.
 */
const CursorLayer: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let frame = 0;
    let visible = false;

    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = Math.abs(x - rx) > 0.2 || Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };

    const setVisible = (v: boolean) => {
      if (visible === v) return;
      visible = v;
      root.style.setProperty('--cursor-o', v ? '1' : '0');
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        rx = x;
        ry = y;
        setVisible(true);
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const text = !!t?.closest?.(TEXT_INPUT);
      ring.dataset.state = text ? 'text' : t?.closest?.(INTERACTIVE) ? 'hover' : '';
    };

    const onDown = () => (ring.dataset.down = '1');
    const onUp = () => delete ring.dataset.down;
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      root.classList.remove('has-custom-cursor');
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return (
    <>
      <style>{`
        .wl-dot, .wl-ring { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 100;
          opacity: var(--cursor-o, 0); transition: opacity .2s ease; will-change: transform; }
        .wl-dot > span { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #F2EFE9; mix-blend-mode: difference; }
        .wl-ring > span { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%;
          border: 1px solid rgba(242,239,233,.35); transition: transform .3s cubic-bezier(.22,1,.36,1), border-color .3s, background-color .3s, border-radius .3s, width .3s, height .3s, margin .3s; }
        .wl-ring[data-state="hover"] > span { transform: scale(1.5); border-color: rgba(242,181,76,.8); background: rgba(242,181,76,.06); }
        .wl-ring[data-state="text"] > span { width: 2px; height: 24px; margin: -12px 0 0 -1px; border-radius: 1px; border-color: rgba(242,181,76,.9); }
        .wl-ring[data-down] > span { transform: scale(.85); }
      `}</style>
      <div ref={ringRef} className="wl-ring" aria-hidden="true"><span /></div>
      <div ref={dotRef} className="wl-dot" aria-hidden="true"><span /></div>
    </>
  );
};

const CustomCursor: React.FC = () => {
  const { finePointer, lite, reducedMotion } = usePerf();
  if (!finePointer || lite || reducedMotion) return null;
  return <CursorLayer />;
};

export default CustomCursor;
