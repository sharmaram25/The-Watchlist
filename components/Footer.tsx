import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/5 py-12 text-white relative z-10">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start">
             <Link to="/" className="text-lg font-serif font-bold tracking-wide text-white hover:text-cyan-400 transition-colors">
               The Watchlist
             </Link>
             <p className="text-xs text-gray-600 mt-2">
               © {new Date().getFullYear()} Ram Sharma. All rights reserved.
             </p>
          </div>

          <div className="flex items-center gap-8">
             <a href="https://www.instagram.com/ramsharma.25/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-cyan-400 transition-colors transform hover:scale-110">
                 <Instagram size={20} />
             </a>
             <a href="https://www.linkedin.com/in/ram-sharma-20rs02/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-cyan-400 transition-colors transform hover:scale-110">
                 <Linkedin size={20} />
             </a>
          </div>

      </div>
    </footer>
  );
};

export default Footer;