import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, TrendingUp, Film, Tv } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMulti, getTrending } from '../services/tmdbService';
import { Movie } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';

// Bespoke Icons
const Icons = {
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Discover: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  Charades: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20"></path>
      <path d="M12 2v20"></path>
      <path d="M7 7l10 10"></path>
      <path d="M7 17l10-10"></path>
    </svg>
  ),
  Creator: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
};

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [trendingPreview, setTrendingPreview] = useState<Movie[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && trendingPreview.length === 0) {
        getTrending().then(res => setTrendingPreview(res.slice(0, 4)));
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        try {
          const results = await searchMulti(searchQuery);
          setSearchResults(results.slice(0, 8)); // Limit results for overlay
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { name: 'Discover', path: '/recommender', icon: <Icons.Discover /> },
    { name: 'Charades', path: '/charades', icon: <Icons.Charades /> },
    { name: 'Creator', path: '/about', icon: <Icons.Creator /> },
  ];

  const handleResultClick = (id: number, type: string) => {
    setIsSearchOpen(false);
    navigate(`/details/${type}/${id}`);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-40 transition-all duration-700 ${
          isScrolled 
            ? 'bg-[#030305]/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border-b border-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-3 group relative z-50 magnetic-target">
            <div className="relative text-cyan-400 group-hover:text-white transition-colors duration-500">
               <Icons.Logo />
               <div className="absolute inset-0 bg-cyan-400/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-serif font-bold tracking-wide text-white leading-none group-hover:tracking-wider transition-all duration-300 uppercase">
                The Watchlist
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`magnetic-target relative px-3 py-2 flex items-center justify-center gap-2 transition-all group ${
                  location.pathname === link.path ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {link.icon}
                </span>
                
                <span className="hidden md:block text-sm font-medium tracking-wide relative z-10">
                    {link.name}
                </span>

                <motion.div 
                  className={`absolute inset-0 rounded-lg -z-0 transition-opacity duration-300 ${
                    location.pathname === link.path ? 'bg-cyan-500/10 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </Link>
            ))}

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="magnetic-target p-3 text-white hover:text-cyan-400 transition-colors relative group"
            >
              <Search size={22} />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-[#050505]/95 backdrop-blur-3xl flex flex-col px-6 md:px-24 overflow-y-auto"
          >
             <div className="flex justify-between items-center py-8 border-b border-white/5">
                <div className="flex items-center gap-2 text-cyan-500">
                    <Icons.Logo />
                    <span className="font-serif font-bold text-xl text-white">The Watchlist</span>
                </div>
                <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="p-4 bg-white/5 rounded-full hover:bg-white/10 hover:text-cyan-400 transition-colors"
                >
                    <X size={24} />
                </button>
             </div>

            <div className="w-full max-w-5xl mx-auto pt-20 mb-16 relative">
               <motion.div 
                 initial={{ scaleX: 0 }} 
                 animate={{ scaleX: 1 }} 
                 transition={{ delay: 0.2 }}
                 className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" 
               />
              <motion.input
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                autoFocus
                type="text"
                placeholder="Search movies, tv shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-5xl md:text-7xl font-serif text-white py-8 placeholder:text-gray-700 focus:outline-none text-center selection:bg-cyan-500/30"
              />
            </div>

            <div className="w-full max-w-7xl mx-auto pb-20">
              {searchResults.length > 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {searchResults.map((movie, idx) => (
                    <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleResultClick(movie.id, movie.media_type || 'movie')}
                        className="group cursor-pointer"
                    >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative shadow-2xl">
                             {movie.poster_path ? (
                                <img 
                                    src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="" 
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-gray-700">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <span className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View</span>
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors font-serif leading-tight">
                             {movie.title || movie.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                             {movie.media_type === 'tv' ? <Tv size={12}/> : <Film size={12}/>}
                             <span>{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
                        </div>
                    </motion.div>
                    ))}
                </motion.div>
              ) : searchQuery.length < 3 ? (
                  <div className="max-w-2xl mx-auto">
                      <div className="flex items-center justify-center gap-2 mb-8 text-cyan-500 text-xs font-bold uppercase tracking-[0.2em]">
                          <TrendingUp size={14} /> Trending Now
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {trendingPreview.map((movie, idx) => (
                               <motion.div 
                                    key={movie.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => handleResultClick(movie.id, movie.media_type || 'movie')}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all group"
                               >
                                   <div className="w-12 h-16 bg-neutral-800 rounded overflow-hidden flex-shrink-0">
                                       <img src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} className="w-full h-full object-cover" alt=""/>
                                   </div>
                                   <div>
                                        <h4 className="text-gray-300 group-hover:text-white font-medium">{movie.title || movie.name}</h4>
                                        <span className="text-xs text-gray-600 uppercase tracking-wider">{movie.media_type?.toUpperCase()}</span>
                                   </div>
                                   <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-500" size={16} />
                               </motion.div>
                           ))}
                      </div>
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Film size={48} className="mb-4 text-gray-600" />
                    <p className="text-xl font-serif text-gray-500">We couldn't find anything matching that.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;