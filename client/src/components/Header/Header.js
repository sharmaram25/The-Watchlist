import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">The WatchList</span>
          </Link>          {/* Search Bar */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search movies & TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <span className="search-icon">🔍</span>
                <span className="search-text">Search</span>
              </button>
            </div>
          </form>          {/* Navigation */}
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/my-ratings" className="nav-link">My Ratings</Link>
            <Link to="/charades" className="nav-link">Charades</Link>
            <Link to="/about" className="nav-link">About</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
