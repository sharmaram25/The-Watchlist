import React, { Suspense, lazy, useEffect, useLayoutEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigationType, Link } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkBanner from './components/NetworkBanner';
import { Spinner } from './components/StateViews';
import Home from './pages/Home';
import { usePerf } from './lib/perf';

// Route-level code splitting: only the landing page ships in the main bundle.
const loadRecommender = () => import('./pages/Recommender');
const loadCharades = () => import('./pages/Charades');
const loadAbout = () => import('./pages/About');
const loadDetails = () => import('./pages/Details');
const loadCategory = () => import('./pages/Category');
const loadWatchlist = () => import('./pages/Watchlist');

const Recommender = lazy(loadRecommender);
const Charades = lazy(loadCharades);
const About = lazy(loadAbout);
const Details = lazy(loadDetails);
const Category = lazy(loadCategory);
const Watchlist = lazy(loadWatchlist);

const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

/** Warm up the other route chunks once the browser is idle so navigation is instant. */
const usePrefetchRoutes = () => {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const run = () => {
      [loadDetails, loadCategory, loadRecommender, loadWatchlist, loadCharades, loadAbout].forEach((load) => load().catch(() => undefined));
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 4000 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 2500);
    return () => clearTimeout(t);
  }, []);
};

/**
 * Scroll to top on new navigations; restore the previous position on
 * back/forward (content usually renders instantly from the query cache).
 */
const ScrollManager: React.FC = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    const key = location.key;
    const map = positions.current;
    let frame = 0;
    let cancelled = false;

    if (navType === 'POP' && map.has(key)) {
      const target = map.get(key)!;
      const started = performance.now();
      const attempt = () => {
        if (cancelled) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll >= target - 2 || performance.now() - started > 1500) {
          window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
        } else {
          frame = requestAnimationFrame(attempt);
        }
      };
      attempt();
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      map.set(key, window.scrollY);
      if (map.size > 50) map.delete(map.keys().next().value as string);
    };
  }, [location.key, navType]);

  return null;
};

const PageFallback: React.FC = () => (
  <div className="min-h-[100svh] flex items-center justify-center">
    <Spinner label="Loading page" />
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-[80svh] flex flex-col items-center justify-center text-center px-gutter pt-safe-nav pb-16">
    <p className="kicker mb-4">404 · Scene missing</p>
    <h1 className="font-display text-fluid-title text-fg mb-5 text-balance">Cut. Wrong set.</h1>
    <p className="text-fg-muted max-w-md mb-10">This page doesn’t exist — but plenty of great films do.</p>
    <Link to="/" className="btn btn-lg btn-light">
      Back to the lobby
    </Link>
  </div>
);

const Shell: React.FC = () => {
  const location = useLocation();
  const { lite } = usePerf();
  usePrefetchRoutes();

  return (
    // Low-power devices keep fades but skip transform/layout animation.
    <MotionConfig reducedMotion={lite ? 'always' : 'user'}>
      <div className="min-h-screen min-h-[100dvh] flex flex-col pb-[calc(var(--tabbar-h)+var(--safe-bottom))] md:pb-0">
        <CustomCursor />
        <Navbar />
        <ScrollManager />
        <main id="main" className="flex-grow">
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recommender" element={<Recommender />} />
                <Route path="/charades" element={<Charades />} />
                <Route path="/about" element={<About />} />
                <Route path="/details/:type/:id" element={<Details />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
        <NetworkBanner />
      </div>
    </MotionConfig>
  );
};

const App: React.FC = () => (
  <Router>
    <LazyMotion features={loadMotionFeatures}>
      <Shell />
    </LazyMotion>
  </Router>
);

export default App;
