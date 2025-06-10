import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// API service functions
export const apiService = {
  // Get trending content
  getTrending: async (timeWindow = 'day', mediaType = 'all') => {
    try {
      const response = await api.get('/trending', {
        params: { timeWindow, mediaType }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch trending content');
    }
  },

  // Search for movies and TV shows
  search: async (query, type = 'multi', page = 1) => {
    try {
      const response = await api.get('/search', {
        params: { query, type, page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Search failed');
    }
  },

  // Get movie details
  getMovieDetails: async (id) => {
    try {
      const response = await api.get(`/movie/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch movie details');
    }
  },

  // Get TV show details
  getTVDetails: async (id) => {
    try {
      const response = await api.get(`/tv/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch TV show details');
    }
  },

  // Get recommendations
  getRecommendations: async (type, id, page = 1) => {
    try {
      const response = await api.get(`/recommendations/${type}/${id}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch recommendations');
    }
  },

  // Get popular content
  getPopular: async (type, page = 1) => {
    try {
      const response = await api.get(`/popular/${type}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch popular content');
    }
  },

  // Get top rated content
  getTopRated: async (type, page = 1) => {
    try {
      const response = await api.get(`/top-rated/${type}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch top rated content');
    }
  },

  // Rate content
  rateContent: async (mediaType, mediaId, rating) => {
    try {
      const response = await api.post('/rate', {
        mediaType,
        mediaId,
        rating
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to save rating');
    }
  },
  // Get user ratings
  getUserRatings: async () => {
    try {
      const response = await api.get('/ratings');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user ratings');
    }
  },

  // Get movies for charades (with language support)
  getCharadesMovies: async (page = 1, language = 'en') => {
    try {
      const response = await api.get('/popular/movie', {
        params: { page, language }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch movies for charades');
    }
  }
};

// Helper functions
export const imageService = {
  // Get full image URL from TMDB
  getImageUrl: (path, size = 'w500') => {
    if (!path) return '/placeholder-image.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  // Get profile URL
  getProfileUrl: (path, size = 'w185') => {
    if (!path) return '/placeholder-profile.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  // Get backdrop URL
  getBackdropUrl: (path, size = 'w1280') => {
    if (!path) return '/placeholder-backdrop.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
};

// Utility functions
export const utils = {
  // Format date
  formatDate: (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Format year
  formatYear: (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).getFullYear();
  },

  // Format runtime
  formatRuntime: (minutes) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },

  // Format rating
  formatRating: (rating) => {
    if (!rating) return '0.0';
    return parseFloat(rating).toFixed(1);
  },

  // Get genre names
  getGenreNames: (genres) => {
    if (!genres || !Array.isArray(genres)) return '';
    return genres.map(genre => genre.name).join(', ');
  },
  // Truncate text
  truncateText: (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
};

// Legacy function for backward compatibility and charades
export const searchMovies = async (query = '', page = 1, language = 'en') => {
  try {
    if (query.trim()) {
      return await apiService.search(query, 'movie', page);
    } else {
      // If no query, get popular movies instead
      return await apiService.getCharadesMovies(page, language);
    }
  } catch (error) {
    throw new Error('Failed to search movies');
  }
};

export default apiService;
