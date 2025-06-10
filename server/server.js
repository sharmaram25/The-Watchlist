const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory storage for user ratings (replace with database in production)
const userRatings = new Map();

// Helper function to make TMDB API requests
const tmdbRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB API Error:', error.message);
    throw new Error('Failed to fetch data from TMDB');
  }
};

// Routes

// Get trending movies and TV shows
app.get('/api/trending', async (req, res) => {
  try {
    const { timeWindow = 'day', mediaType = 'all' } = req.query;
    const data = await tmdbRequest(`/trending/${mediaType}/${timeWindow}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search movies and TV shows
app.get('/api/search', async (req, res) => {
  try {
    const { query, type = 'multi', page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const endpoint = type === 'multi' ? '/search/multi' : `/search/${type}`;
    const data = await tmdbRequest(endpoint, { query, page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movie details
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [details, credits, videos, similar] = await Promise.all([
      tmdbRequest(`/movie/${id}`, { append_to_response: 'credits,videos' }),
      tmdbRequest(`/movie/${id}/credits`),
      tmdbRequest(`/movie/${id}/videos`),
      tmdbRequest(`/movie/${id}/similar`)
    ]);
    
    res.json({
      ...details,
      credits,
      videos,
      similar,
      userRating: userRatings.get(`movie-${id}`) || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TV show details
app.get('/api/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [details, credits, videos, similar] = await Promise.all([
      tmdbRequest(`/tv/${id}`, { append_to_response: 'credits,videos' }),
      tmdbRequest(`/tv/${id}/credits`),
      tmdbRequest(`/tv/${id}/videos`),
      tmdbRequest(`/tv/${id}/similar`)
    ]);
    
    res.json({
      ...details,
      credits,
      videos,
      similar,
      userRating: userRatings.get(`tv-${id}`) || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations
app.get('/api/recommendations/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { page = 1 } = req.query;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    const data = await tmdbRequest(`/${type}/${id}/recommendations`, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular movies/TV shows
app.get('/api/popular/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    const data = await tmdbRequest(`/${type}/popular`, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top rated movies/TV shows
app.get('/api/top-rated/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    const data = await tmdbRequest(`/${type}/top_rated`, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rate a movie or TV show
app.post('/api/rate', (req, res) => {
  try {
    const { mediaType, mediaId, rating } = req.body;
    
    if (!mediaType || !mediaId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    
    const key = `${mediaType}-${mediaId}`;
    userRatings.set(key, rating);
    
    res.json({ success: true, message: 'Rating saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user ratings
app.get('/api/ratings', (req, res) => {
  try {
    const ratings = Array.from(userRatings.entries()).map(([key, rating]) => {
      const [mediaType, mediaId] = key.split('-');
      return { mediaType, mediaId, rating };
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (!TMDB_API_KEY) {
    console.warn('⚠️  Warning: TMDB_API_KEY not found in environment variables');
  }
});
