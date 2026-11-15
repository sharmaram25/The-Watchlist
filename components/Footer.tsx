import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const YEAR = new Date().getFullYear();

const LINKS = [
  { to: '/recommender', label: 'Discover' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/charades', label: 'Charades' },
  { to: '/about', label: 'Creator' },
];

const Footer: React.FC = () => (
  <footer className="relative z-10 border-t border-white/[0.06] bg-ink-950 mt-8">
    <div className="px-gutter pt-12 pb-10 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="max-w-sm">
        <Link to="/" className="inline-block rounded-md" aria-label="The Watchlist — home">
          <Logo />
        </Link>
        <p className="mt-4 text-sm text-fg-muted leading-relaxed">
          A late-night companion for picking what to watch — trending titles, moods, and a party game.
        </p>
      </div>

      <nav aria-label="Footer">
        <p className="kicker mb-4">Explore</p>
        <ul className="space-y-2.5">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-sm text-fg-muted hover:text-fg transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <p className="kicker mb-4">Elsewhere</p>
        <ul className="space-y-2.5 text-sm">
          <li>
            <a href="https://www.instagram.com/ramsharma.25/" target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg transition-colors">
              Instagram ↗
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/ram-sharma-20rs02/" target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg transition-colors">
              LinkedIn ↗
            </a>
          </li>
          <li>
            <a href="https://portfolio-ram-sharma.netlify.app/" target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg transition-colors">
              Portfolio ↗
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="px-gutter py-5 border-t border-white/[0.06] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-fg-faint">
      <p>© {YEAR} Ram Sharma</p>
      <p>
        Film data &amp; imagery from{' '}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="link-underline text-fg-muted">
          TMDB
        </a>
        . Not endorsed or certified by TMDB.
      </p>
    </div>
  </footer>
);

export default Footer;
