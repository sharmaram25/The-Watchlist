import React, { useState, useEffect } from 'react';
import MovieCard from '../../components/MovieCard/MovieCard';
import './Home.css';

const Home = () => {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTVShows, setPopularTVShows] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const fetchTMDBData = async (endpoint) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY || '7fe10e86a3ee4dcc660a9bc8dc301b87';
    const response = await fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=en-US&page=1`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    
    return response.json();
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        trendingData,
        popularMoviesData,
        popularTVData,
        topRatedData
      ] = await Promise.all([
        fetchTMDBData('/trending/all/day'),
        fetchTMDBData('/movie/popular'),
        fetchTMDBData('/tv/popular'),
        fetchTMDBData('/movie/top_rated')
      ]);

      setTrending(trendingData.results.slice(0, 10));
      setPopularMovies(popularMoviesData.results.slice(0, 10));
      setPopularTVShows(popularTVData.results.slice(0, 10));
      setTopRatedMovies(topRatedData.results.slice(0, 10));
    } catch (err) {
      setError('Failed to load content. Please try again later.');
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleRate = async (mediaType, mediaId, rating) => {
    try {
      // Store rating in localStorage since we don't have a backend
      const ratings = JSON.parse(localStorage.getItem('movieRatings') || '{}');
      ratings[`${mediaType}_${mediaId}`] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(ratings));
      
      // Update the rating in the local state
      const updateRating = (items) =>
        items.map(item =>
          item.id === mediaId ? { ...item, userRating: rating } : item
        );

      setTrending(updateRating);
      setPopularMovies(updateRating);
      setPopularTVShows(updateRating);
      setTopRatedMovies(updateRating);
    } catch (err) {
      console.error('Error rating content:', err);
    }
  };

  if (loading) {
    return (
      <div className="home-page">
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
      <div className="home-page">
        <div className="container">
          <div className="error-message">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadHomeData}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="container">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="heading-primary">Discover Your Next Favorite</h1>
          <p className="hero-subtitle">
            Explore trending movies and TV shows, rate your favorites, and get personalized recommendations
          </p>
        </section>

        {/* Trending Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="heading-secondary">🔥 Trending Now</h2>
            <p className="section-subtitle">What's hot in entertainment today</p>
          </div>
          <div className="grid grid-5">
            {trending.map(item => (
              <MovieCard key={item.id} item={item} onRate={handleRate} />
            ))}
          </div>
        </section>

        {/* Popular Movies Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="heading-secondary">🎬 Popular Movies</h2>
            <p className="section-subtitle">The most popular movies right now</p>
          </div>
          <div className="grid grid-5">
            {popularMovies.map(item => (
              <MovieCard key={item.id} item={item} onRate={handleRate} />
            ))}
          </div>
        </section>

        {/* Popular TV Shows Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="heading-secondary">📺 Popular TV Shows</h2>
            <p className="section-subtitle">Binge-worthy series everyone's watching</p>
          </div>
          <div className="grid grid-5">
            {popularTVShows.map(item => (
              <MovieCard key={item.id} item={item} onRate={handleRate} />
            ))}
          </div>
        </section>

        {/* Top Rated Movies Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="heading-secondary">⭐ Top Rated Movies</h2>
            <p className="section-subtitle">Critically acclaimed masterpieces</p>
          </div>
          <div className="grid grid-5">
            {topRatedMovies.map(item => (
              <MovieCard key={item.id} item={item} onRate={handleRate} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
