import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard/MovieCard';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('multi');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query, searchType, 1);
    }
  }, [query, searchType]);

  const fetchTMDBSearch = async (searchQuery, type, page) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY || '7fe10e86a3ee4dcc660a9bc8dc301b87';
    const endpoint = type === 'multi' ? 'multi' : type === 'movie' ? 'movie' : 'tv';
    const response = await fetch(
      `https://api.themoviedb.org/3/search/${endpoint}?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(searchQuery)}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    return response.json();
  };

  const performSearch = async (searchQuery, type, page) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchTMDBSearch(searchQuery, type, page);
      
      if (page === 1) {
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      
      setCurrentPage(page);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      performSearch(query, searchType, currentPage + 1);
    }
  };

  const handleTypeChange = (newType) => {
    setSearchType(newType);
    setCurrentPage(1);
  };
  const handleRate = async (mediaType, mediaId, rating) => {
    try {
      // Store rating in localStorage since we don't have a backend
      const ratings = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      ratings[`${mediaType}_${mediaId}`] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(ratings));
      
      setResults(prev =>
        prev.map(item =>
          item.id === mediaId ? { ...item, userRating: rating } : item
        )
      );
    } catch (err) {
      console.error('Error rating content:', err);
    }
  };

  if (!query) {
    return (
      <div className="search-page">
        <div className="container">
          <div className="search-empty">
            <h2>🔍 Search for Movies & TV Shows</h2>
            <p>Use the search bar above to discover your next favorite movie or TV show!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="container">
        {/* Search Header */}
        <div className="search-header">
          <h1 className="search-title">Search Results</h1>
          <p className="search-query">
            Showing results for: <span className="text-gold">"{query}"</span>
          </p>
          {totalResults > 0 && (
            <p className="search-count">
              Found {totalResults.toLocaleString()} results
            </p>
          )}
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="filter-group">
            <label>Filter by:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${searchType === 'multi' ? 'active' : ''}`}
                onClick={() => handleTypeChange('multi')}
              >
                All
              </button>
              <button
                className={`filter-btn ${searchType === 'movie' ? 'active' : ''}`}
                onClick={() => handleTypeChange('movie')}
              >
                Movies
              </button>
              <button
                className={`filter-btn ${searchType === 'tv' ? 'active' : ''}`}
                onClick={() => handleTypeChange('tv')}
              >
                TV Shows
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {loading && currentPage === 1 ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <h3>Search Failed</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => performSearch(query, searchType, 1)}
            >
              Try Again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="no-results">
            <h3>No Results Found</h3>
            <p>Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <>
            <div className="search-results">
              <div className="grid grid-5">
                {results.map(item => (
                  <MovieCard key={`${item.id}-${item.media_type || searchType}`} item={item} onRate={handleRate} />
                ))}
              </div>
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="load-more-container">
                <button
                  className="btn btn-secondary load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
                <p className="page-info">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
