import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, Home, Compass, Bookmark, Drama, User } from 'lucide-react';
import Logo from './Logo';
import SearchPalette from './SearchPalette';
import { useWatchlist } from '../lib/library';

const LINKS = [
  { name: 'Home', path: '/', icon: Home, end: true },
  { name: 'Discover', path: '/recommender', icon: Compass },
  { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
  { name: 'Charades', path: '/charades', icon: Drama },
  { name: 'Creator', path: '/about', icon: User },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const saved = useWatchlist().length;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => setSearchOpen(false), [location.pathname, location.search]);

  // "/" or Ctrl/Cmd+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openSearch = () => setSearchOpen(true);

  return (
    <>
      {/* Top bar */}
      <header
        className={`fixed top-0 inset-x-0 z-40 pt-[var(--safe-top)] transition-[background-color,border-color] duration-300 border-b ${
          scrolled
            ? 'bg-ink/85 lite:bg-ink/95 backdrop-blur-md border-white/[0.06]'
            : 'bg-gradient-to-b from-black/60 to-transparent border-transparent'
        }`}
      >
        <nav aria-label="Main" className="h-[var(--nav-h)] px-gutter flex items-center gap-6">
          <Link to="/" aria-label="The Watchlist — home" className="shrink-0 rounded-md">
            <Logo />
          </Link>

          <ul className="hidden md:flex items-center gap-1 lg:gap-2 ml-2 lg:ml-6">
            {LINKS.map((l) => (
              <li key={l.path}>
                <NavLink
                  to={l.path}
                  end={l.end}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[14px] transition-colors ${
                      isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.name}
                      {l.path === '/watchlist' && saved > 0 && (
                        <span className="font-mono text-[10px] tabular min-w-[1.25rem] h-5 px-1 rounded-full bg-white/10 text-fg-muted inline-flex items-center justify-center">
                          {saved}
                        </span>
                      )}
                      {isActive && <span className="absolute left-3 right-3 -bottom-[3px] h-[2px] rounded-full bg-accent" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search"
              aria-haspopup="dialog"
              className="hidden lg:flex items-center gap-2.5 h-10 w-56 xl:w-64 pl-3.5 pr-2 rounded-full border border-white/10 bg-white/[0.04] text-fg-faint hover:border-white/20 hover:text-fg-muted transition-colors"
            >
              <Search size={16} aria-hidden="true" />
              <span className="text-sm">Search titles…</span>
              <span className="ml-auto kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>
            </button>
            <button type="button" onClick={openSearch} aria-label="Search" className="lg:hidden btn-icon !bg-transparent !border-transparent">
              <Search size={21} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* Bottom tab bar — phones */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-950/95 lite:bg-ink-950 backdrop-blur-md border-t border-white/[0.07] pb-[var(--safe-bottom)]"
      >
        <ul className="h-tabbar grid grid-cols-5">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.path}>
                <NavLink
                  to={l.path}
                  end={l.end}
                  className={({ isActive }) =>
                    `h-full flex flex-col items-center justify-center gap-1 text-[10.5px] tracking-wide transition-colors ${
                      isActive ? 'text-accent' : 'text-fg-faint active:text-fg'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <Icon size={21} strokeWidth={isActive ? 2.2 : 1.7} aria-hidden="true" fill={isActive && l.path === '/watchlist' ? 'currentColor' : 'none'} />
                        {l.path === '/watchlist' && saved > 0 && !isActive && (
                          <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                        )}
                      </span>
                      {l.name}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence>{searchOpen && <SearchPalette onClose={closeSearch} />}</AnimatePresence>
    </>
  );
};

export default Navbar;
