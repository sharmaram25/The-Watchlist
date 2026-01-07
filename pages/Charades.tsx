import React, { useState, useEffect } from 'react';
import { getRandomTitle } from '../services/tmdbService';
import { Movie } from '../types';
import { LANGUAGES, GENRES_LIST, TMDB_BACKDROP_BASE_URL, TMDB_IMAGE_BASE_URL } from '../constants';
import { Timer, Shuffle, Settings, Play, Star, Calendar, Film, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Charades: React.FC = () => {
  const [wordCount, setWordCount] = useState(3);
  const [customWordCount, setCustomWordCount] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState(60);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
        interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
        setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
      if (!timerActive) {
          setTimeLeft(roundDuration);
      }
  }, [roundDuration]);

  const handleGenerate = async () => {
    setLoading(true);
    setMovie(null);
    setTimerActive(false);
    setTimeLeft(roundDuration);
    
    const targetCount = customWordCount ? parseInt(customWordCount) : wordCount;

    let found = null;
    for (let i = 0; i < 5; i++) {
        const randomPage = Math.floor(Math.random() * 50) + 1;
        found = await getRandomTitle(language, targetCount, genreId, randomPage);
        if (found) break;
    }

    setTimeout(() => {
        setMovie(found);
        setLoading(false);
    }, 600);
  };
  const toggleTimer = () => {
      if (!timerActive && timeLeft === 0) setTimeLeft(roundDuration);
      setTimerActive(!timerActive);
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center bg-[#020203] relative overflow-hidden">

      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-20">

          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-6 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                      <Settings size={14} /> Configuration
                  </div>
                  
                  <div className="mb-6">
                      <label className="block text-xs text-gray-500 font-bold uppercase mb-2">Genre</label>
                      <select 
                          value={genreId || ''} 
                          onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-cyan-500 transition-colors"
                      >
                          <option value="">Any Genre</option>
                          {GENRES_LIST.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                      </select>
                  </div>

                  <div className="mb-6">
                        <label className="block text-xs text-gray-500 font-bold uppercase mb-2">Word Count</label>
                        <div className="grid grid-cols-5 gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(num => (
                            <button
                                key={num}
                                onClick={() => { setWordCount(num); setCustomWordCount(''); }}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                wordCount === num && !customWordCount ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {num}
                            </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="number" 
                                placeholder="Custom Count..." 
                                value={customWordCount}
                                onChange={(e) => setCustomWordCount(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                  </div>

                  <div className="mb-6">
                        <label className="block text-xs text-gray-500 font-bold uppercase mb-2">Language</label>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-cyan-500 transition-colors"
                        >
                            {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.name}</option>
                            ))}
                        </select>
                  </div>

                  <div>
                      <div className="flex justify-between mb-2">
                         <label className="text-xs text-gray-500 font-bold uppercase">Round Time</label>
                         <span className="text-xs text-cyan-400 font-mono font-bold">{roundDuration}s</span>
                      </div>
                      <div className="relative h-10 flex items-center bg-black/50 rounded-xl px-2 border border-white/10">
                        <input 
                            type="range" 
                            min="30" 
                            max="180" 
                            step="10" 
                            value={roundDuration}
                            onChange={(e) => setRoundDuration(Number(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                  </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="magnetic-target w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl bg-white text-black hover:bg-cyan-400 hover:scale-[1.02]"
              >
                 <Shuffle size={20} className={loading ? 'animate-spin' : ''} />
                 {loading ? 'Drawing...' : 'Draw New Card'}
              </button>
          </div>

          <div className="lg:col-span-2 flex flex-col items-center">
            
             <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center p-8">
                 <AnimatePresence mode="wait">
                    {loading ? (
                         <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                         >
                             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                             <p className="text-cyan-500 font-mono text-sm uppercase tracking-widest">Shuffling Deck...</p>
                         </motion.div>
                    ) : movie ? (
                        <motion.div
                            key="movie"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-full h-full flex gap-6"
                        >
                             <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="hidden md:block w-1/3 h-full flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10"
                             >
                                 <img 
                                    src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : ''} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy"
                                    alt={movie.title} 
                                 />
                             </motion.div>

                             <div className="flex-1 flex flex-col justify-center text-left">
                                 <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                 >
                                    <h2 className="text-3xl md:text-5xl font-black font-serif text-white mb-4 leading-tight">
                                        {movie.title}
                                    </h2>
                                 </motion.div>

                                 <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap gap-3 mb-6"
                                 >
                                     <span className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300">
                                        <Calendar size={12} /> {movie.release_date?.split('-')[0]}
                                     </span>
                                     <span className="flex items-center gap-1 px-3 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {GENRES_LIST.find(g => g.id === genreId)?.name || 'Random Genre'}
                                     </span>
                                 </motion.div>
                                 
                                 <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-3 italic border-l-2 border-cyan-500 pl-4"
                                 >
                                     "{movie.overview}"
                                 </motion.p>
                             </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center opacity-30"
                        >
                             <Film size={64} className="mx-auto mb-4" />
                             <p className="text-xl font-serif">Tap "Draw New Card" to begin</p>
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>
             <div className="mt-8 w-full bg-white/5 rounded-2xl p-6 border border-white/10 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${timeLeft < 10 && timerActive ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                         <Timer size={24} />
                     </div>
                     <div>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Round Timer</p>
                         <p className={`text-3xl font-mono font-bold transition-colors duration-300 ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                             00:{timeLeft.toString().padStart(2, '0')}
                         </p>
                     </div>
                 </div>
                 
                 <button 
                    onClick={toggleTimer}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${timerActive ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-cyan-400'}`}
                 >
                     {timerActive ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Play size={20} className="ml-1" />}
                 </button>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Charades;