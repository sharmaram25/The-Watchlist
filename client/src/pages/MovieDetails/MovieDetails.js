import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard/MovieCard';
import './MovieDetails.css';

// Utility functions
const getImageUrl = (path, size = 'w500') => {
  if (!path) return '/placeholder-image.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const getBackdropUrl = (path, size = 'w1280') => {
  if (!path) return '/placeholder-image.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatYear = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).getFullYear();
};

const formatRuntime = (minutes) => {
  if (!minutes) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatRating = (rating) => {
  if (!rating) return '0.0';
  return parseFloat(rating).toFixed(1);
};

const getProfileUrl = (path, size = 'w185') => {
  if (!path) return '/placeholder-image.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTMDBData = async (endpoint) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY || '7fe10e86a3ee4dcc660a9bc8dc301b87';
    const response = await fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=en-US`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    
    return response.json();
  };

  const loadMovieDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [movieData, recommendationsData] = await Promise.all([
        fetchTMDBData(`/movie/${id}`),
        fetchTMDBData(`/movie/${id}/recommendations`)
      ]);

      setMovie(movieData);
      setRecommendations(recommendationsData.results.slice(0, 8));
    } catch (err) {
      setError('Failed to load movie details. Please try again later.');
      console.error('Error loading movie details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMovieDetails();
  }, [loadMovieDetails]);

  const handleRate = async (mediaType, mediaId, rating) => {
    try {
      // Store rating in localStorage since we don't have a backend
      const ratings = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      ratings[`${mediaType}_${mediaId}`] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(ratings));
      
      if (mediaId.toString() === id) {
        setMovie(prev => ({ ...prev, userRating: rating }));
      } else {
        setRecommendations(prev =>
          prev.map(item =>
            item.id === mediaId ? { ...item, userRating: rating } : item
          )
        );
      }    } catch (err) {
      console.error('Error rating content:', err);
    }
  };

  if (loading) {
    return (
      <div className="movie-details-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-page">
        <div className="container">
          <div className="error-message">
            <h2>Movie Not Found</h2>
            <p>{error || 'The requested movie could not be found.'}</p>
            <button className="btn btn-primary" onClick={loadMovieDetails}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const director = movie.credits?.crew?.find(person => person.job === 'Director');
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const trailer = movie.videos?.results?.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  );

  return (
    <div className="movie-details-page">
      {/* Hero Section with Backdrop */}
      <div 
        className="movie-hero"        style={{ 
          backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})` 
        }}
      >
        <div className="movie-hero-overlay">
          <div className="container">
            <div className="movie-hero-content">
              <div className="movie-poster">                <img
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="poster-image"
                />
              </div>
              
              <div className="movie-info">
                <h1 className="movie-title">{movie.title}</h1>
                <div className="movie-meta">                  <span className="movie-year">{formatYear(movie.release_date)}</span>
                  <span className="movie-runtime">{formatRuntime(movie.runtime)}</span>
                  <span className="movie-rating">
                    ⭐ {formatRating(movie.vote_average)}/10
                  </span>
                </div>
                
                <div className="movie-genres">
                  {movie.genres?.map(genre => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="movie-overview">{movie.overview}</p>

                <div className="movie-actions">
                  <div className="user-rating">
                    <span>Your Rating:</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star-btn ${(movie.userRating || 0) >= star * 2 ? 'active' : ''}`}
                          onClick={() => handleRate('movie', movie.id, star * 2)}
                          title={`Rate ${star * 2}/10`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {trailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      🎬 Watch Trailer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Movie Details */}
        <div className="movie-details-content">
          {/* Additional Info */}
          <div className="movie-additional-info">
            <div className="info-grid">
              <div className="info-item">
                <h3>Director</h3>
                <p>{director ? director.name : 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Budget</h3>
                <p>{movie.budget ? `$${movie.budget.toLocaleString()}` : 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Revenue</h3>
                <p>{movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Language</h3>
                <p>{movie.original_language?.toUpperCase() || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <section className="cast-section">
              <h2 className="heading-secondary">Cast</h2>
              <div className="cast-grid">
                {cast.map(actor => (
                  <div key={actor.id} className="cast-card">
                    <img
                      src={getProfileUrl(actor.profile_path)}
                      alt={actor.name}
                      className="cast-image"
                    />
                    <div className="cast-info">
                      <h4 className="cast-name">{actor.name}</h4>
                      <p className="cast-character">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section className="recommendations-section">
              <h2 className="heading-secondary">You Might Also Like</h2>
              <div className="grid grid-4">
                {recommendations.map(item => (
                  <MovieCard key={item.id} item={item} onRate={handleRate} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
