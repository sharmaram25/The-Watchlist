import React from 'react';
import { Link } from 'react-router-dom';
import { imageService, utils } from '../../services/api';
import './MovieCard.css';

const MovieCard = ({ item, onRate }) => {
  const isMovie = item.media_type === 'movie' || item.title;
  const title = isMovie ? item.title : item.name;
  const releaseDate = isMovie ? item.release_date : item.first_air_date;
  const linkPath = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;

  const handleRating = (rating) => {
    if (onRate) {
      onRate(isMovie ? 'movie' : 'tv', item.id, rating);
    }
  };

  return (
    <div className="movie-card-container">
      <div className="movie-card-frame">
        {/* Poster Section */}
        <Link to={linkPath} className="poster-section">
          <div className="poster-container">
            <img
              src={imageService.getImageUrl(item.poster_path)}
              alt={title}
              className="poster-image"
              loading="lazy"
            />
            <div className="poster-gradient-overlay"></div>
            
            {/* Rating Badge */}
            <div className="rating-badge">
              <div className="rating-badge-inner">
                <span className="rating-star-icon">✦</span>
                <span className="rating-score">{utils.formatRating(item.vote_average)}</span>
              </div>
            </div>

            {/* Play Button Overlay */}
            <div className="play-overlay">
              <div className="play-button">
                <div className="play-icon">▶</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Info Section */}
        <div className="info-section">
          <div className="title-area">
            <Link to={linkPath} className="title-link">
              <h3 className="movie-title">{title}</h3>
            </Link>
            <div className="movie-year">{utils.formatYear(releaseDate)}</div>
          </div>

          {item.overview && (
            <p className="movie-description">
              {utils.truncateText(item.overview, 80)}
            </p>
          )}

          {/* Interactive Rating */}
          <div className="interactive-rating">
            <div className="rating-label">Your Rating:</div>
            <div className="star-rating-container">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`rating-star ${item.userRating >= star * 2 ? 'active' : ''}`}
                  onClick={() => handleRating(star * 2)}
                  title={`Rate ${star * 2}/10`}
                >
                  <span className="star-inner">★</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
