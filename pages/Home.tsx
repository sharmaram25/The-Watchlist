import React, { useEffect, useState } from 'react';
import { getTrending, getPopularMovies, getTopRated, getPopularTV, searchMulti, getUpcoming, getMoviesByGenre } from '../services/tmdbService';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { TMDB_BACKDROP_BASE_URL } from '../constants';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, Info, ChevronLeft, Sparkles } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ConnectionErrorModal from '../components/ConnectionErrorModal';

const MAX_RAIL_ITEMS = 12;

const RailSkeleton: React.FC<{ title: string; reduceMotion: boolean }> = ({ title, reduceMotion }) => (
  <div className="py-12 pl-8 md:pl-16 relative z-20">
    <h2 className="text-3xl font-bold text-white/80 font-serif tracking-wide mb-8">{title}</h2>
    <div className="flex gap-6 overflow-x-hidden pb-8 pr-8">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className={`w-[200px] h-[300px] rounded-lg bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border border-white/5 ${reduceMotion ? '' : 'animate-pulse'}`}
        />
      ))}
    </div>
  </div>
);

const HorizontalRail: React.FC<{ title: string; movies: Movie[]; categorySlug: string; accent?: boolean; reduceMotion: boolean }> = ({ title, movies, categorySlug, accent = false, reduceMotion }) => (
  <motion.div 
    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={reduceMotion ? { duration: 0.2 } : { duration: 0.6 }}
    viewport={{ once: true, margin: "0px 0px -100px 0px" }}
    className="relative z-20"
    style={{
      contentVisibility: 'auto',
      containIntrinsicSize: '460px',
    }}
  >
    <div className={`py-12 pl-8 md:pl-16 relative ${accent ? 'bg-gradient-to-r from-cyan-500/5 to-transparent backdrop-blur-sm border-l-2 border-cyan-500/30' : ''}`}>
      <Link to={`/category/${categorySlug}`} className="magnetic-target inline-flex items-center gap-3 mb-10 group cursor-pointer">
        <h2 className={`text-3xl font-bold group-hover:text-cyan-400 transition-colors font-serif tracking-wide ${accent ? 'text-white' : 'text-white'}`}>
          {title}
        </h2>
        <motion.div 
          className="p-1 rounded-full border border-white/10 group-hover:border-cyan-500 transition-colors"
          whileHover={reduceMotion ? undefined : { scale: 1.1 }}
        >
          <ChevronRight size={18} className="text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </motion.div>
        {accent && <Sparkles size={16} className="text-cyan-400 opacity-60" />}
      </Link>
      <div className="flex gap-6 overflow-x-auto pb-8 pr-8 hide-scrollbar snap-x perspective-1000">
        {movies.map((movie, idx) => (
          <div key={movie.id} className="snap-start">
            <MovieCard movie={movie} index={idx} />
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const Home: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [scifiMovies, setScifiMovies] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (searchQuery) {
          const results = await searchMulti(searchQuery);
          setSearchResults(results);
        } else {
          const [t, p, tr, tv, up, act, com, sci] = await Promise.all([
            getTrending(),
            getPopularMovies(),
            getTopRated(),
            getPopularTV(),
            getUpcoming(),
            getMoviesByGenre(28),
            getMoviesByGenre(35),
            getMoviesByGenre(878)
          ]);
          setTrending(t);
          setPopular(p);
          setTopRated(tr);
          setTvShows(tv);
          setUpcoming(up);
          setActionMovies(act);
          setComedyMovies(com);
          setScifiMovies(sci);
        }
      } catch (error) {
        console.error("Failed to fetch home data", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (trending.length === 0) return;
    const interval = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % Math.min(trending.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [trending, shouldReduceMotion]);

  const heroMovies = trending.slice(0, 5);
  const heroMovie = heroMovies[currentHeroIndex];

  useEffect(() => {
    setHeroImageLoaded(false);
  }, [heroMovie?.id]);

  const nextHero = () => setCurrentHeroIndex(prev => (prev + 1) % heroMovies.length);
  const prevHero = () => setCurrentHeroIndex(prev => (prev - 1 + heroMovies.length) % heroMovies.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020203] pb-12">
        <div className="h-screen w-full relative overflow-hidden bg-black">
          <div className={`absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#020203] to-transparent" />
          <div className="relative z-10 h-full flex items-center px-8 md:px-16">
            <div className="max-w-3xl w-full space-y-4">
              <div className={`h-6 w-40 rounded-full bg-white/10 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
              <div className={`h-14 w-3/4 rounded bg-white/10 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
              <div className={`h-14 w-1/2 rounded bg-white/10 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
              <div className={`h-5 w-full max-w-2xl rounded bg-white/10 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
              <div className={`h-5 w-2/3 rounded bg-white/10 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
              <div className={`h-12 w-40 rounded-full bg-white/15 mt-6 ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
            </div>
          </div>
        </div>
        <RailSkeleton title="Trending Now" reduceMotion={shouldReduceMotion} />
        <RailSkeleton title="Coming Soon" reduceMotion={shouldReduceMotion} />
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="min-h-screen pt-32 px-8 md:px-16 bg-[#020203] text-white relative">
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-2 font-serif">
            Search Results
          </h1>
          <p className="text-xl text-cyan-400">
            "{searchQuery}"
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
           {searchResults.length > 0 ? (
             searchResults.map((movie, idx) => (
               <MovieCard key={movie.id} movie={movie} index={idx} />
             ))
           ) : (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="col-span-full py-20 text-center"
             >
               <p className="text-gray-500 text-xl">No results found for "<span className="text-cyan-400">{searchQuery}</span>"</p>
             </motion.div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020203] min-h-screen pb-20 selection:bg-cyan-500/30 relative overflow-hidden">
        
      <ConnectionErrorModal 
        isOpen={error} 
        onRetry={() => {
            setError(false);
            setLoading(true);
            window.location.reload(); 
        }} 
      />

      {/* Ambient background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative h-screen w-full overflow-hidden bg-black">
        <AnimatePresence mode="wait">
            {heroMovie && (
                <motion.div 
                    key={heroMovie.id}
                    className="absolute inset-0"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 1, ease: "easeInOut" }}
                >
                    <img 
                        src={`${TMDB_BACKDROP_BASE_URL}${heroMovie.backdrop_path}`} 
                      onLoad={() => setHeroImageLoaded(true)}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                        className="w-full h-full object-cover object-top filter brightness-75"
                        alt="Hero"
                    />
                    <div className={`absolute inset-0 bg-neutral-900 transition-opacity duration-700 ${heroImageLoaded ? 'opacity-0' : 'opacity-100'}`} />
                    
                    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#020203] via-[#020203]/40 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-6xl pt-20">
            <AnimatePresence mode='wait'>
                 {heroMovie && (
                    <motion.div
                        key={heroMovie.id}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -40 }}
                        transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                         <div className="flex items-center gap-4 mb-8">
                            <motion.span 
                              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={shouldReduceMotion ? { duration: 0.2 } : { delay: 0.3 }}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-transparent backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-[0.3em] rounded-full shadow-lg shadow-cyan-500/10"
                            >
                                ✦ Trending #1
                            </motion.span>
                            <span className="text-gray-400 text-xs md:text-sm font-medium tracking-widest uppercase drop-shadow-md">
                                {heroMovie.media_type === 'tv' ? 'Series' : 'Feature Film'}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-serif text-white mb-8 leading-[0.9] tracking-tight drop-shadow-2xl">
                            {heroMovie.title || heroMovie.name}
                        </h1>
                        
                        <p className="text-base md:text-lg text-gray-100 mb-12 line-clamp-3 max-w-3xl leading-relaxed font-light drop-shadow-xl">
                            {heroMovie.overview}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <motion.button 
                            whileHover={shouldReduceMotion ? undefined : { scale: 1.05, boxShadow: "0 0 60px rgba(6, 182, 212, 0.5)" }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                                onClick={() => navigate(`/details/${heroMovie.media_type || 'movie'}/${heroMovie.id}`)}
                                className="magnetic-target px-10 py-4 bg-white hover:bg-cyan-50 text-black text-lg font-bold rounded-full transition-all flex items-center gap-3 shadow-xl"
                            >
                                <Info size={22} />
                                <span>More Info</span>
                            </motion.button>
                        </div>
                    </motion.div>
                 )}
            </AnimatePresence>
        </div>

        <div className="absolute bottom-12 right-12 z-20 flex items-center gap-4">
             <motion.button 
               whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
               whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
               onClick={prevHero} 
               className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500 transition-all text-white backdrop-blur-md shadow-lg"
             >
                 <ChevronLeft size={20} />
             </motion.button>
             <div className="flex gap-2">
                 {heroMovies.map((_, idx) => (
                     <motion.button 
                        key={idx}
                        onClick={() => setCurrentHeroIndex(idx)}
                        className={`rounded-full transition-all duration-300 backdrop-blur-sm shadow-sm ${idx === currentHeroIndex ? 'w-8 h-1.5 bg-cyan-400 shadow-cyan-500/50' : 'w-2 h-1.5 bg-white/30 hover:bg-white/60'}`}
                        whileHover={!shouldReduceMotion && idx !== currentHeroIndex ? { scale: 1.2 } : undefined}
                     />
                 ))}
             </div>
             <motion.button 
               whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
               whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
               onClick={nextHero} 
               className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500 transition-all text-white backdrop-blur-md shadow-lg"
             >
                 <ChevronRight size={20} />
             </motion.button>
        </div>
      </div>

      <div className="relative z-20 space-y-1 pt-16">
        <HorizontalRail title="Trending Now" movies={trending.slice(0, MAX_RAIL_ITEMS)} categorySlug="trending" accent reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Coming Soon" movies={upcoming.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-movies" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Popular Movies" movies={popular.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-movies" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Top Rated TV" movies={tvShows.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-tv" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="High Octane Action" movies={actionMovies.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-movies" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Critically Acclaimed" movies={topRated.slice(0, MAX_RAIL_ITEMS)} categorySlug="top-rated" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Laugh Out Loud" movies={comedyMovies.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-movies" reduceMotion={shouldReduceMotion} />
        <HorizontalRail title="Sci-Fi & Future" movies={scifiMovies.slice(0, MAX_RAIL_ITEMS)} categorySlug="popular-movies" reduceMotion={shouldReduceMotion} />
      </div>
    </div>
  );
};

export default Home;