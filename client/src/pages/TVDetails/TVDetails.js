import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard/MovieCard';
import './TVDetails.css';

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

const formatRating = (rating) => {
  if (!rating) return '0.0';
  return parseFloat(rating).toFixed(1);
};

const getProfileUrl = (path, size = 'w185') => {
  if (!path) return '/placeholder-image.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const TVDetails = () => {
  const { id } = useParams();
  const [tvShow, setTVShow] = useState(null);
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

  const loadTVDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tvData, recommendationsData] = await Promise.all([
        fetchTMDBData(`/tv/${id}`),
        fetchTMDBData(`/tv/${id}/recommendations`)
      ]);

      setTVShow(tvData);
      setRecommendations(recommendationsData.results.slice(0, 8));
    } catch (err) {
      setError('Failed to load TV show details. Please try again later.');
      console.error('Error loading TV details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTVDetails();
  }, [loadTVDetails]);

  const handleRate = async (mediaType, mediaId, rating) => {
    try {
      // Store rating in localStorage since we don't have a backend
      const ratings = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      ratings[`${mediaType}_${mediaId}`] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(ratings));
      
      if (mediaId.toString() === id) {
        setTVShow(prev => ({ ...prev, userRating: rating }));
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
      <div className="tv-details-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="tv-details-page">
        <div className="container">
          <div className="error-message">
            <h2>TV Show Not Found</h2>
            <p>{error || 'The requested TV show could not be found.'}</p>
            <button className="btn btn-primary" onClick={loadTVDetails}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const creator = tvShow.created_by?.[0];
  const cast = tvShow.credits?.cast?.slice(0, 8) || [];
  const trailer = tvShow.videos?.results?.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  );

  return (
    <div className="tv-details-page">
      {/* Hero Section with Backdrop */}
      <div 
        className="tv-hero"        style={{ 
          backgroundImage: `url(${getBackdropUrl(tvShow.backdrop_path)})` 
        }}
      >
        <div className="tv-hero-overlay">
          <div className="container">
            <div className="tv-hero-content">
              <div className="tv-poster">                <img
                  src={getImageUrl(tvShow.poster_path, 'w500')}
                  alt={tvShow.name}
                  className="poster-image"
                />
              </div>
              
              <div className="tv-info">
                <h1 className="tv-title">{tvShow.name}</h1>
                <div className="tv-meta">
                  <span className="tv-year">{formatYear(tvShow.first_air_date)}</span>
                  <span className="tv-seasons">{tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? 's' : ''}</span>
                  <span className="tv-rating">
                    ⭐ {formatRating(tvShow.vote_average)}/10
                  </span>
                </div>
                
                <div className="tv-genres">
                  {tvShow.genres?.map(genre => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="tv-overview">{tvShow.overview}</p>

                <div className="tv-actions">
                  <div className="user-rating">
                    <span>Your Rating:</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star-btn ${(tvShow.userRating || 0) >= star * 2 ? 'active' : ''}`}
                          onClick={() => handleRate('tv', tvShow.id, star * 2)}
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
        {/* TV Show Details */}
        <div className="tv-details-content">
          {/* Additional Info */}
          <div className="tv-additional-info">
            <div className="info-grid">
              <div className="info-item">
                <h3>Creator</h3>
                <p>{creator ? creator.name : 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Episodes</h3>
                <p>{tvShow.number_of_episodes || 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Status</h3>
                <p>{tvShow.status || 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Network</h3>
                <p>{tvShow.networks?.[0]?.name || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Last Episode */}
          {tvShow.last_episode_to_air && (
            <section className="episode-section">
              <h2 className="heading-secondary">Latest Episode</h2>
              <div className="episode-card">
                <div className="episode-info">
                  <h3>{tvShow.last_episode_to_air.name}</h3>
                  <p className="episode-meta">
                    Season {tvShow.last_episode_to_air.season_number}, Episode {tvShow.last_episode_to_air.episode_number}
                    {tvShow.last_episode_to_air.air_date && (
                      <span> • {formatDate(tvShow.last_episode_to_air.air_date)}</span>
                    )}
                  </p>
                  {tvShow.last_episode_to_air.overview && (
                    <p className="episode-overview">{tvShow.last_episode_to_air.overview}</p>
                  )}
                </div>
              </div>
            </section>
          )}

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

export default TVDetails;
