import React, { useEffect, useState } from 'react';
import { getTrending, getPopularMovies, getTopRated, getPopularTV, searchMulti, getUpcoming, getMoviesByGenre } from '../services/tmdbService';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { TMDB_BACKDROP_BASE_URL } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info, ChevronLeft } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

const HorizontalRail: React.FC<{ title: string; movies: Movie[]; categorySlug: string }> = ({ title, movies, categorySlug }) => (
  <div className="py-8 pl-8 md:pl-16 relative z-20">
    <Link to={`/category/${categorySlug}`} className="magnetic-target inline-flex items-center gap-3 mb-8 group cursor-pointer">
      <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors font-serif tracking-wide">{title}</h2>
      <div className="p-1 rounded-full border border-white/10 group-hover:border-cyan-500 transition-colors">
        <ChevronRight size={16} className="text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
    <div className="flex gap-6 overflow-x-auto pb-8 pr-8 hide-scrollbar snap-x perspective-1000">
      {movies.map((movie, idx) => (
        <div key={movie.id} className="snap-start">
          <MovieCard movie={movie} index={idx} />
        </div>
      ))}
    </div>
  </div>
);

const Home: React.FC = () => {
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
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % Math.min(trending.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [trending]);

  const heroMovies = trending.slice(0, 5);
  const heroMovie = heroMovies[currentHeroIndex];

  const nextHero = () => setCurrentHeroIndex(prev => (prev + 1) % heroMovies.length);
  const prevHero = () => setCurrentHeroIndex(prev => (prev - 1 + heroMovies.length) % heroMovies.length);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#020203]"><div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (searchQuery) {
    return (
      <div className="min-h-screen pt-32 px-8 md:px-16 bg-[#020203] text-white">
        <h1 className="text-4xl font-bold mb-8 font-serif">Search: <span className="text-cyan-400">"{searchQuery}"</span></h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
           {searchResults.length > 0 ? (
             searchResults.map((movie, idx) => (
               <MovieCard key={movie.id} movie={movie} index={idx} />
             ))
           ) : (
             <p className="text-gray-400 text-xl">No results found.</p>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020203] min-h-screen pb-20 selection:bg-cyan-500/30">
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <AnimatePresence mode="wait">
            {heroMovie && (
                <motion.div 
                    key={heroMovie.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                >
                    <img 
                        src={`${TMDB_BACKDROP_BASE_URL}${heroMovie.backdrop_path}`} 
                        className="w-full h-full object-cover object-top filter brightness-90"
                        alt="Hero"
                    />
                    
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#020203] via-[#020203]/60 to-transparent" />

                    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-6xl pt-20">
            <AnimatePresence mode='wait'>
                 {heroMovie && (
                    <motion.div
                        key={heroMovie.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                         <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                                Trending #1
                            </span>
                            <span className="text-gray-300 text-sm font-medium tracking-wider uppercase drop-shadow-md">
                                {heroMovie.media_type === 'tv' ? 'Series' : 'Feature Film'}
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold font-serif text-white mb-6 leading-[0.95] tracking-tight drop-shadow-2xl">
                            {heroMovie.title || heroMovie.name}
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-200 mb-10 line-clamp-3 max-w-2xl leading-relaxed font-light drop-shadow-lg mix-blend-screen">
                            {heroMovie.overview}
                        </p>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate(`/details/${heroMovie.media_type || 'movie'}/${heroMovie.id}`)}
                                className="magnetic-target px-10 py-4 bg-white hover:bg-cyan-50 text-black rounded-full font-bold transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                            >
                                <Info size={20} />
                                <span>More Info</span>
                            </button>
                        </div>
                    </motion.div>
                 )}
            </AnimatePresence>
        </div>

        <div className="absolute bottom-12 right-12 z-20 flex items-center gap-4">
             <button onClick={prevHero} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500 transition-all text-white backdrop-blur-sm">
                 <ChevronLeft size={20} />
             </button>
             <div className="flex gap-2">
                 {heroMovies.map((_, idx) => (
                     <button 
                        key={idx}
                        onClick={() => setCurrentHeroIndex(idx)}
                        className={`h-1 rounded-full transition-all duration-300 backdrop-blur-sm shadow-sm ${idx === currentHeroIndex ? 'w-8 bg-cyan-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                     />
                 ))}
             </div>
             <button onClick={nextHero} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500 transition-all text-white backdrop-blur-sm">
                 <ChevronRight size={20} />
             </button>
        </div>
      </div>

      <div className="relative z-20 space-y-8 pt-10">
        <HorizontalRail title="Trending Now" movies={trending.slice(0, 10)} categorySlug="trending" />
        <HorizontalRail title="Coming Soon" movies={upcoming} categorySlug="popular-movies" />
        <HorizontalRail title="Popular Movies" movies={popular} categorySlug="popular-movies" />
        <HorizontalRail title="Top Rated TV" movies={tvShows} categorySlug="popular-tv" />
        <HorizontalRail title="High Octane Action" movies={actionMovies} categorySlug="popular-movies" />
        <HorizontalRail title="Critically Acclaimed" movies={topRated} categorySlug="top-rated" />
        <HorizontalRail title="Laugh Out Loud" movies={comedyMovies} categorySlug="popular-movies" />
        <HorizontalRail title="Sci-Fi & Future" movies={scifiMovies} categorySlug="popular-movies" />
      </div>
    </div>
  );
};

export default Home;