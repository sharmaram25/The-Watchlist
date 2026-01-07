import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const trailer = trailerRef.current;
    
    if (!cursor || !trailer) return;

    let cursorX = 0;
    let cursorY = 0;
    let trailerX = 0;
    let trailerY = 0;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      
      // Immediate update for the main reticle
      cursor.style.transform = `translate(${cursorX - 12}px, ${cursorY - 12}px)`;

      // Interactive states
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.closest('.magnetic-target') !== null;

      if (isInteractive) {
        cursor.classList.add('is-hovering');
        trailer.classList.add('is-hovering');
      } else {
        cursor.classList.remove('is-hovering');
        trailer.classList.remove('is-hovering');
      }
    };

    const onMouseDown = () => {
        cursor.classList.add('is-clicking');
    };
    
    const onMouseUp = () => {
        cursor.classList.remove('is-clicking');
    };

    // Smooth trailer animation loop
    const animateTrailer = () => {
      const dx = cursorX - trailerX;
      const dy = cursorY - trailerY;
      
      trailerX += dx * 0.15; // Soft lag factor
      trailerY += dy * 0.15;
      
      if (trailer) {
          trailer.style.transform = `translate(${trailerX - 100}px, ${trailerY - 100}px)`;
      }
      
      requestAnimationFrame(animateTrailer);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    const animationId = requestAnimationFrame(animateTrailer);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <style>{`
        .cursor-reticle { pointer-events: none; z-index: 100; fixed; top: 0; left: 0; mix-blend-mode: exclusion; transition: transform 0.05s linear; }
        .cursor-reticle circle { transition: all 0.3s ease; }
        .cursor-reticle.is-hovering circle.outer { r: 11; opacity: 1; }
        .cursor-reticle.is-hovering line { opacity: 1; }
        .cursor-reticle.is-clicking { transform: scale(0.8); }
        
        .cursor-trailer { pointer-events: none; z-index: 99; fixed; top: 0; left: 0; will-change: transform; }
        .cursor-trailer-bg { width: 200px; height: 200px; background: rgba(6,182,212,0.15); border-radius: 50%; filter: blur(60px); transition: all 0.3s ease; }
        .cursor-trailer.is-hovering .cursor-trailer-bg { background: rgba(6,182,212,0.3); transform: scale(1.5); }
      `}</style>

      <div ref={cursorRef} className="fixed top-0 left-0 pointer-events-none z-[100]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="overflow-visible">
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" className="outer opacity-60 transition-all duration-300" />
            <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="1" className="opacity-0 transition-opacity duration-300" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1" className="opacity-0 transition-opacity duration-300" />
            <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
      </div>

      <div ref={trailerRef} className="cursor-trailer fixed top-0 left-0 pointer-events-none z-[99]">
        <div className="cursor-trailer-bg" />
      </div>
    </>
  );
};

export default CustomCursor;