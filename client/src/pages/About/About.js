import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="page-title">About The WatchList</h1>
              <p className="hero-description">
                A modern, feature-rich movie and TV show recommendation app built with passion 
                for cinema enthusiasts. Discover trending content, rate your favorites, and 
                get personalized recommendations powered by TMDB API.
              </p>
            </div>
            <div className="hero-visual">
              <div className="cinema-icon">🎬</div>
            </div>
          </div>
        </section>        {/* Developer Section */}
        <section className="developer-section">
          <div className="container">
            <div className="developer-card">
              <div className="creator-showcase">
                <div className="creator-visual">
                  <div className="film-frame">
                    <div className="film-strip">
                      <div className="film-perforations">
                        <div className="perforation"></div>
                        <div className="perforation"></div>
                        <div className="perforation"></div>
                        <div className="perforation"></div>
                        <div className="perforation"></div>
                        <div className="perforation"></div>
                      </div>
                    </div>
                    <div className="creator-photo">
                      <span className="creator-initial">RS</span>
                    </div>
                    <div className="creator-badge">🎬</div>
                  </div>
                </div>

                <div className="developer-info">
                  <h1 className="developer-name">Ram Sharma</h1>
                  <p className="developer-title">Full Stack Developer & Creator</p>
                  <p className="developer-bio">
                    Passionate developer with expertise in React, Node.js, and modern web 
                    technologies. Built The WatchList to combine love for movies with cutting-edge 
                    development practices. Always exploring new technologies and creating meaningful 
                    digital experiences.
                  </p>                  <div className="social-links">
                    <a 
                      href="https://github.com/sharmaram25" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link github"
                    >
                      <span className="social-icon">📁</span>
                      <span className="social-text">GitHub</span>
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/ram-sharma-20rs02" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link linkedin"
                    >
                      <span className="social-icon">💼</span>
                      <span className="social-text">LinkedIn</span>
                    </a>
                    <a 
                      href="https://www.instagram.com/ramsharma.25" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link instagram"
                    >
                      <span className="social-icon instagram-icon">📸</span>
                      <span className="social-text">Instagram</span>
                    </a>
                    <a 
                      href="mailto:sharmaram2504@gmail.com" 
                      className="social-link email"
                    >
                      <span className="social-icon">📧</span>
                      <span className="social-text">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="tech-stack">
          <h2 className="section-title">Built With</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">⚛️</div>
              <h3>React</h3>
              <p>Modern UI with hooks and functional components</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🟢</div>
              <h3>Node.js</h3>
              <p>Robust backend API with Express.js</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🎭</div>
              <h3>TMDB API</h3>
              <p>Comprehensive movie and TV show database</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🎨</div>
              <h3>CSS3</h3>
              <p>Custom cinematic design with animations</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-showcase">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔥</div>
              <h3>Trending Content</h3>
              <p>Stay updated with the latest trending movies and TV shows</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Search</h3>
              <p>Find any movie or TV show with powerful search functionality</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Personal Ratings</h3>
              <p>Rate content and track your viewing preferences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Perfect experience across all devices and screen sizes</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Explore?</h2>
            <p>Start discovering your next favorite movie or TV show</p>
            <a href="/" className="cta-button">
              <span>🎬</span>
              Start Watching
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
