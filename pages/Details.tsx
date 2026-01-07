import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDetails } from '../services/tmdbService';
import { MovieDetails } from '../types';
import { TMDB_BACKDROP_BASE_URL, TMDB_IMAGE_BASE_URL } from '../constants';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Play, Star, Clock, Calendar, ArrowLeft, Users, Download, X, Maximize2, ExternalLink } from 'lucide-react';
import MovieCard from '../components/MovieCard';

const Details: React.FC = () => {
  const { id, type } = useParams<{ id: string; type: 'movie' | 'tv' }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'similar'>('overview');
  const [isPosterExpanded, setIsPosterExpanded] = useState(false);
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ target: scrollRef });
  
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  useEffect(() => {
    if (id && type) {
            setMovie(null);
      getDetails(Number(id), type).then(setMovie);
      window.scrollTo(0, 0);
    }
  }, [id, type]);

  if (!movie) return (
    <div className="bg-[#020203] min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
    </div>
  );

  const director = movie.credits?.crew.find(c => c.job === 'Director')?.name;
  const trailer = movie.videos?.results.find(v => v.type === 'Trailer' || v.type === 'Teaser');

  const handleDownload = async () => {
      if (!movie.poster_path) return;
      const imageUrl = `${TMDB_BACKDROP_BASE_URL}${movie.poster_path}`;
      
      try {
          const response = await fetch(imageUrl, {
              method: 'GET',
              mode: 'cors',
              credentials: 'omit'
          });
          
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${movie.title || 'poster'}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } catch (error) {
          console.warn("Direct download blocked by CORS, opening in new tab:", error);
          window.open(imageUrl, '_blank');
      }
  };

  return (
    <div className="bg-[#020203] min-h-screen text-white relative overflow-hidden font-sans selection:bg-cyan-500/30" ref={scrollRef}>

      <Link to="/" className="magnetic-target fixed top-24 left-8 z-50 p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-white transition-all group">
        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </Link>

      <div className="relative h-screen w-full">
        <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0"
        >
            {movie.backdrop_path ? (
                <img 
                    src={`${TMDB_BACKDROP_BASE_URL}${movie.backdrop_path}`} 
                    className="w-full h-full object-cover"
                    alt="backdrop"
                />
            ) : (
                 <div className="w-full h-full bg-neutral-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020203] via-[#020203]/40 to-transparent" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-24 pb-24 z-10">
             <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-4xl"
             >
                <div className="flex flex-wrap gap-3 mb-6">
                    {movie.status === 'Released' && <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_10px_rgba(6,182,212,0.2)]">Now Showing</span>}
                    {movie.genres.map(g => (
                        <span key={g.id} className="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] text-gray-300">
                            {g.name}
                        </span>
                    ))}
                </div>

                <h1 className="text-5xl md:text-8xl font-serif font-bold mb-6 leading-[0.9] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60">
                    {movie.title || movie.name}
                </h1>

                <div className="flex items-center gap-6 text-lg text-gray-300 mb-8 font-light">
                    <span className="flex items-center gap-2 text-cyan-400">
                        <Star fill="currentColor" size={16} /> <span className="font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <Calendar size={18}/> {new Date(movie.release_date || movie.first_air_date || '').getFullYear()}
                    </span>
                    {movie.runtime && (
                        <span className="flex items-center gap-2">
                            <Clock size={18}/> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-4">
                     {trailer && (
                         <a 
                           href={`https://www.youtube.com/watch?v=${trailer.key}`}
                           target="_blank"
                           rel="noreferrer"
                           className="magnetic-target bg-white text-black hover:bg-cyan-400 px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                         >
                             <Play fill="currentColor" size={20} /> <span className="tracking-wide">Watch Trailer</span>
                         </a>
                     )}
                </div>
             </motion.div>
        </div>
      </div>

      <div className="relative z-20 bg-[#020203] -mt-10 rounded-t-[3rem] border-t border-white/5 pt-12 min-h-screen px-6 md:px-24 shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        
        <div className="flex gap-8 border-b border-white/5 pb-4 mb-12 overflow-x-auto hide-scrollbar">
            {['Overview', 'Cast', 'Similar'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                    className={`magnetic-target text-lg font-medium tracking-widest uppercase pb-4 transition-all relative whitespace-nowrap ${
                        activeTab === tab.toLowerCase() ? 'text-cyan-400' : 'text-gray-600 hover:text-white'
                    }`}
                >
                    {activeTab === tab.toLowerCase() && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    )}
                </button>
            ))}
        </div>

        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[500px]"
        >
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-12">
                         <div>
                             <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6">Synopsis</h3>
                             <p className="text-xl md:text-2xl leading-relaxed text-gray-300 font-light">{movie.overview}</p>
                         </div>
                         
                         {movie.tagline && (
                            <div className="border-l-2 border-cyan-500/50 pl-8 py-2">
                                <p className="text-2xl font-serif italic text-gray-500">"{movie.tagline}"</p>
                            </div>
                         )}

                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
                            {director && (
                                <div>
                                    <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Director</h4>
                                    <p className="text-lg text-white">{director}</p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Status</h4>
                                <p className="text-lg text-white">{movie.status}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Popularity</h4>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-cyan-400" />
                                    <p className="text-lg text-white">{Math.round(movie.popularity)}</p>
                                </div>
                            </div>
                            {movie.production_companies?.[0] && (
                                <div>
                                    <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Studio</h4>
                                    <p className="text-lg text-white truncate">{movie.production_companies[0].name}</p>
                                </div>
                            )}
                         </div>
                    </div>
                    
                    <div className="hidden lg:block">
                        <div 
                            className="sticky top-32 perspective-1000 group cursor-pointer magnetic-target"
                            onClick={() => setIsPosterExpanded(true)}
                        >
                             <div className="relative">
                                <img 
                                    src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                                    className="w-full rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transform rotate-y-12 group-hover:rotate-y-0 transition-transform duration-700 ease-out"
                                    alt="poster"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-30 mix-blend-overlay pointer-events-none rounded-sm group-hover:opacity-0 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                     <Maximize2 size={48} className="text-white drop-shadow-lg" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'cast' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {movie.credits?.cast.slice(0, 15).map((person, idx) => (
                        <motion.div 
                            key={person.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all group cursor-pointer"
                        >
                            <div className="aspect-[2/3] rounded-lg overflow-hidden mb-4 bg-neutral-900 relative">
                                {person.profile_path ? (
                                    <img src={`${TMDB_IMAGE_BASE_URL}${person.profile_path}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={person.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs uppercase tracking-widest">No Image</div>
                                )}
                            </div>
                            <h4 className="font-bold text-white truncate">{person.name}</h4>
                            <p className="text-xs text-cyan-500/80 truncate uppercase tracking-wider mt-1">{person.character}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {activeTab === 'similar' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {movie.similar?.results.slice(0, 10).map((m, idx) => (
                        <MovieCard key={m.id} movie={m} index={idx} />
                    ))}
                    {(!movie.similar?.results || movie.similar.results.length === 0) && (
                        <p className="col-span-full text-center text-gray-600 text-lg py-20 italic">No similar archives found.</p>
                    )}
                </div>
            )}
        </motion.div>
      </div>

      <AnimatePresence>
        {isPosterExpanded && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
                onClick={() => setIsPosterExpanded(false)}
            >
                <div className="relative max-h-full max-w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setIsPosterExpanded(false)}
                        className="magnetic-target absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={32} />
                    </button>
                    
                    <img 
                        src={`${TMDB_BACKDROP_BASE_URL}${movie.poster_path}`} 
                        className="max-h-[80vh] w-auto rounded-lg shadow-2xl border border-white/10"
                        alt="Expanded Poster"
                    />

                    <div className="mt-8 flex gap-4">
                        <button 
                            onClick={handleDownload}
                            className="magnetic-target flex items-center gap-3 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                        >
                            <Download size={20} />
                            Save Poster
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Details;