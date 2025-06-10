import React, { useState, useEffect } from 'react';
import MovieCard from '../../components/MovieCard/MovieCard';
import './MyRatings.css';

const MyRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [ratedContent, setRatedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, movie, tv

  useEffect(() => {
    loadUserRatings();
  }, []);

  const fetchTMDBData = async (endpoint) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY || '7fe10e86a3ee4dcc660a9bc8dc301b87';
    const response = await fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=en-US`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    
    return response.json();
  };

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get ratings from localStorage
      const ratingsFromStorage = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      const ratingsArray = Object.entries(ratingsFromStorage).map(([key, rating]) => {
        const [mediaType, mediaId] = key.split('_');
        return { mediaType, mediaId: parseInt(mediaId), rating };
      });

      setRatings(ratingsArray);

      if (ratingsArray.length === 0) {
        setRatedContent([]);
        setLoading(false);
        return;
      }

      // Fetch details for each rated item
      const contentPromises = ratingsArray.map(async (rating) => {
        try {
          const endpoint = rating.mediaType === 'movie' 
            ? `/movie/${rating.mediaId}`
            : `/tv/${rating.mediaId}`;
          
          const details = await fetchTMDBData(endpoint);
          
          return {
            ...details,
            userRating: rating.rating,
            media_type: rating.mediaType
          };
        } catch (err) {
          console.error(`Failed to fetch details for ${rating.mediaType} ${rating.mediaId}:`, err);
          return null;
        }
      });

      const content = await Promise.all(contentPromises);
      setRatedContent(content.filter(item => item !== null));
    } catch (err) {
      setError('Failed to load your ratings. Please try again later.');
      console.error('Error loading user ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (mediaType, mediaId, rating) => {
    try {
      // Store rating in localStorage
      const ratings = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      ratings[`${mediaType}_${mediaId}`] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(ratings));
      
      // Update local state
      setRatedContent(prev =>
        prev.map(item =>
          item.id === mediaId && item.media_type === mediaType
            ? { ...item, userRating: rating }
            : item
        )
      );      setRatings(prev =>
        prev.map(rating =>
          rating.mediaId === mediaId && rating.mediaType === mediaType
            ? { ...rating, rating }
            : rating
        )
      );
    } catch (err) {
      console.error('Error updating rating:', err);
    }
  };

  const filteredContent = ratedContent.filter(item => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return (total / ratings.length).toFixed(1);
  };

  const getRatingCounts = () => {
    const counts = { movie: 0, tv: 0 };
    ratings.forEach(rating => {
      counts[rating.mediaType]++;
    });
    return counts;
  };

  const ratingCounts = getRatingCounts();

  if (loading) {
    return (
      <div className="my-ratings-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-ratings-page">
        <div className="container">
          <div className="error-message">
            <h2>Failed to Load Ratings</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadUserRatings}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-ratings-page">
      <div className="container">
        {/* Page Header */}
        <div className="ratings-header">
          <h1 className="heading-primary">My Ratings</h1>
          <p className="ratings-subtitle">
            Your personal collection of rated movies and TV shows
          </p>
        </div>

        {ratings.length === 0 ? (
          <div className="empty-ratings">
            <div className="empty-content">
              <span className="empty-icon">⭐</span>
              <h2>No Ratings Yet</h2>
              <p>Start rating movies and TV shows to see them here!</p>
              <p>Your ratings help us provide better recommendations.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="ratings-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{ratings.length}</div>
                  <div className="stat-label">Total Ratings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{getAverageRating()}</div>
                  <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{ratingCounts.movie}</div>
                  <div className="stat-label">Movies Rated</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{ratingCounts.tv}</div>
                  <div className="stat-label">TV Shows Rated</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="ratings-filters">
              <div className="filter-group">
                <label>Show:</label>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({ratings.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'movie' ? 'active' : ''}`}
                    onClick={() => setFilter('movie')}
                  >
                    Movies ({ratingCounts.movie})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'tv' ? 'active' : ''}`}
                    onClick={() => setFilter('tv')}
                  >
                    TV Shows ({ratingCounts.tv})
                  </button>
                </div>
              </div>
            </div>

            {/* Rated Content Grid */}
            <div className="rated-content">
              {filteredContent.length === 0 ? (
                <div className="no-results">
                  <p>No {filter === 'all' ? '' : filter === 'movie' ? 'movies' : 'TV shows'} found in your ratings.</p>
                </div>
              ) : (
                <div className="grid grid-5">
                  {filteredContent.map(item => (
                    <MovieCard 
                      key={`${item.id}-${item.media_type}`} 
                      item={item} 
                      onRate={handleRate} 
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyRatings;
