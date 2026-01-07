import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import Footer from './components/Footer';
import Home from './pages/Home';
import Recommender from './pages/Recommender';
import Charades from './pages/Charades';
import About from './pages/About';
import Details from './pages/Details';
import Category from './pages/Category';

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-[#020203] min-h-screen text-white selection:bg-cyan-500 selection:text-white flex flex-col">
        <CustomCursor />
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recommender" element={<Recommender />} />
            <Route path="/charades" element={<Charades />} />
            <Route path="/about" element={<About />} />
            <Route path="/details/:type/:id" element={<Details />} />
            <Route path="/category/:category" element={<Category />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;