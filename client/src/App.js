import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import Search from './pages/Search/Search';
import MovieDetails from './pages/MovieDetails/MovieDetails';
import TVDetails from './pages/TVDetails/TVDetails';
import MyRatings from './pages/MyRatings/MyRatings';
import About from './pages/About/About';
import Charades from './pages/Charades/Charades';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/tv/:id" element={<TVDetails />} />
              <Route path="/my-ratings" element={<MyRatings />} />
              <Route path="/charades" element={<Charades />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
