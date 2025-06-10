import React, { useState } from 'react';
import './Charades.css';

const Charades = () => {
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState(2);  const [language, setLanguage] = useState('all');

  const languages = [
    { code: 'all', name: '🌍 All Languages' },
    { code: 'en', name: '🇺🇸 English' },
    { code: 'hi', name: '🇮🇳 Hindi' },
    { code: 'es', name: '🇪🇸 Spanish' },
    { code: 'fr', name: '🇫🇷 French' },
    { code: 'de', name: '🇩🇪 German' },
    { code: 'ja', name: '🇯🇵 Japanese' },
    { code: 'ko', name: '🇰🇷 Korean' },
    { code: 'zh', name: '🇨🇳 Chinese' },
    { code: 'ta', name: '🇮🇳 Tamil' },
    { code: 'te', name: '🇮🇳 Telugu' },
    { code: 'bn', name: '🇮🇳 Bengali' },
    { code: 'ml', name: '🇮🇳 Malayalam' },
    { code: 'kn', name: '🇮🇳 Kannada' },
    { code: 'gu', name: '🇮🇳 Gujarati' },
    { code: 'pa', name: '🇮🇳 Punjabi' },
    { code: 'mr', name: '🇮🇳 Marathi' }
  ];
  const getRandomLanguage = () => {
    const availableLangs = ['en', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ta', 'te', 'bn', 'ml', 'kn', 'gu', 'pa', 'mr'];
    return availableLangs[Math.floor(Math.random() * availableLangs.length)];
  };

  const countWords = (title) => {
    if (!title) return 0;
    return title.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  const fetchMovie = async () => {
    setIsLoading(true);
    setMovie(null); // Clear previous movie
      try {
      const apiKey = process.env.REACT_APP_TMDB_API_KEY || '7fe10e86a3ee4dcc660a9bc8dc301b87';
      const selectedLang = language === 'all' ? getRandomLanguage() : language;
        
      // Try multiple attempts to find a movie with the right word count
      for (let attempt = 0; attempt < 5; attempt++) {
        const page = Math.floor(Math.random() * 20) + 1;
        const lang = language === 'all' ? getRandomLanguage() : language;
          const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${lang}&page=${page}`;
        
        const response = await fetch(url);
          if (!response.ok) {
          continue;
        }
        
        const data = await response.json();
        
        if (data?.results?.length) {
          // Handle 8+ words case
          const targetWords = words === 8 ? 8 : words;
          let filtered;
          
          if (words === 8) {
            // For 8+ words, find movies with 8 or more words
            filtered = data.results.filter(m => countWords(m.title) >= 8);
          } else {
            // For other cases, find exact match
            filtered = data.results.filter(m => countWords(m.title) === targetWords);          }
          
          if (filtered.length > 0) {
            const randomMovie = filtered[Math.floor(Math.random() * filtered.length)];
            setMovie(randomMovie);
            setIsLoading(false);
            return;
          }
        }
      }      
      // If no movie found after all attempts
      alert(`Sorry, couldn't find any ${words === 8 ? '8+' : words}-word movies in ${language === 'all' ? 'any language' : selectedLang}. Try different settings!`);
      
    } catch (error) {
      alert('Failed to fetch movies. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => setMovie(null);

  return (
    <div className="charades">      {/* Header */}
      <header className="charades-header">
        <h1>🎭 Movie Charades</h1>
        <p>Get random movies for your charades game!</p>
      </header>

      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <label>Words in Title</label>
          <div className="word-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                className={`word-btn ${words === num ? 'active' : ''}`}
                onClick={() => setWords(num)}
              >
                {num}{num === 8 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Language</label>
          <select 
            className="language-select"
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="generate-btn"
          onClick={fetchMovie}
          disabled={isLoading}
        >
          {isLoading ? '🎲 Rolling...' : '🎲 Get Movie'}
        </button>
      </div>

      {/* Result */}
      {movie && (
        <div className="movie-result">
          <div className="movie-card">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={movie.title}
                className="movie-poster"
              />
            )}
            <div className="movie-info">
              <h2>{movie.title}</h2>
              <p className="year">{movie.release_date?.split('-')[0]}</p>
              <p className="word-count">{countWords(movie.title)} words{words === 8 && countWords(movie.title) >= 8 ? ' (8+)' : ''}</p>
              <div className="actions">
                <button onClick={fetchMovie} className="new-btn">
                  🎲 New Movie
                </button>
                <button onClick={reset} className="clear-btn">
                  ✨ Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Empty State */}
      {!movie && !isLoading && (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>Ready to Play?</h3>
          <p>Choose your settings and click "Get Movie" to start!</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="empty-state">
          <div className="empty-icon">🎲</div>
          <h3>Finding the perfect movie...</h3>
          <p>Rolling the dice for you!</p>
        </div>
      )}
    </div>
  );
};

export default Charades;
