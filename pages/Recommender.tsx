import React, { useState, useEffect } from 'react';
import { discoverContent } from '../services/tmdbService';
import { MOOD_MAPPINGS, LANGUAGES, GENRES_LIST } from '../constants';
import { MoodType, Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { Filter, Search, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Recommender: React.FC = () => {
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [minRating, setMinRating] = useState(0);
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    handleDiscover();
  }, []);

  const toggleMood = (mood: MoodType) => {
    if (selectedMoods.includes(mood)) {
        setSelectedMoods(selectedMoods.filter(m => m !== mood));
    } else {
        setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const toggleGenre = (id: number) => {
      if (selectedGenres.includes(id)) {
          setSelectedGenres(selectedGenres.filter(g => g !== id));
      } else {
          setSelectedGenres([...selectedGenres, id]);
      }
  };

  const handleDiscover = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Combine genres from selected moods
      const moodGenres = selectedMoods.reduce<number[]>((acc, mood) => {
          return [...acc, ...MOOD_MAPPINGS[mood].genres];
      }, []);

      // Combine mood genres with explicitly selected genres
      const combinedGenres = [...moodGenres, ...selectedGenres];

      // Remove duplicates
      const uniqueGenres = Array.from(new Set(combinedGenres));

      const movies = await discoverContent(
        uniqueGenres,
        selectedLanguage,
        selectedYear ? Number(selectedYear) : undefined,
        sortBy,
        minRating
      );
      setResults(movies);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 md:px-16 bg-[#020203] relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-900/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium tracking-wider uppercase mb-6"
            >
                <Compass size={16} /> Discovery Engine
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white"
            >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Vibe</span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-lg max-w-2xl mx-auto font-light"
            >
            Mix and match moods and genres to curate your perfect stream.
            </motion.p>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-20 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
            <div className="space-y-4 lg:col-span-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                  1. Moods (Vibe Based)
              </label>
              <div className="flex flex-wrap gap-3">
                {Object.values(MoodType).map((mood) => {
                   const isSelected = selectedMoods.includes(mood);
                   return (
                    <button
                        key={mood}
                        onClick={() => toggleMood(mood)}
                        className={`magnetic-target px-4 py-3 text-sm font-medium rounded-xl border transition-all duration-300 relative overflow-hidden ${
                        isSelected
                            ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {mood}
                        {isSelected && <span className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full" />}
                    </button>
                   );
                })}
              </div>
            </div>

            <div className="space-y-4 lg:col-span-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                  2. Genres (Specific)
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES_LIST.map((genre) => {
                   const isSelected = selectedGenres.includes(genre.id);
                   return (
                    <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.id)}
                        className={`magnetic-target px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-300 ${
                        isSelected
                            ? 'bg-white text-black border-white' 
                            : 'bg-black/30 border-white/5 text-gray-500 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {genre.name}
                    </button>
                   );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">3. Era (Optional)</label>
              <div className="relative group/input">
                 <input
                    type="number"
                    placeholder="e.g. 2023"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600 focus:bg-black/80"
                 />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">4. Language</label>
              <div className="relative group/select">
                <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer transition-all"
                >
                    {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-neutral-900">{l.name}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">5. Sort By</label>
              <div className="relative group/select">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer transition-all"
                >
                    <option value="popularity.desc" className="bg-neutral-900">Most Popular</option>
                    <option value="vote_average.desc" className="bg-neutral-900">Top Rated</option>
                    <option value="primary_release_date.desc" className="bg-neutral-900">Newest</option>
                    <option value="revenue.desc" className="bg-neutral-900">Highest Revenue</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">6. Min Rating: {minRating}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1" 
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center border-t border-white/5 pt-8">
            <div className="text-gray-500 text-sm">
                {selectedMoods.length + selectedGenres.length > 0 
                    ? `${selectedMoods.length + selectedGenres.length} filters selected` 
                    : 'Showing popular content'}
            </div>
            <button
                onClick={handleDiscover}
                disabled={loading}
                className="magnetic-target px-12 py-4 bg-white text-black font-bold rounded-full hover:bg-cyan-400 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Search size={20} />
                )}
                {loading ? 'Analyzing...' : 'Refresh Discovery'}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-20">
          <AnimatePresence mode="popLayout">
            {results.map((movie, idx) => (
                <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <MovieCard movie={movie} index={idx} />
                </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Filter size={64} className="mb-4 text-cyan-500" />
            <p className="text-2xl font-serif text-gray-500">No results match your exact criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommender;