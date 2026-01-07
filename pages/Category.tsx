import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrending, getPopularMovies, getPopularTV, getTopRated } from '../services/tmdbService';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { ArrowLeft, Grid } from 'lucide-react';
import { motion } from 'framer-motion';

const Category: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            let data: Movie[] = [];
            switch (category) {
                case 'trending':
                    data = await getTrending();
                    setTitle('Trending Now');
                    break;
                case 'popular-movies':
                    data = await getPopularMovies();
                    setTitle('Popular Movies');
                    break;
                case 'popular-tv':
                    data = await getPopularTV();
                    setTitle('Popular TV Shows');
                    break;
                case 'top-rated':
                    data = await getTopRated();
                    setTitle('Critically Acclaimed');
                    break;
                default:
                    data = [];
            }
            // In a real infinite scroll, we would fetch pages. Here we just show the first page result.
            setMovies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [category]);

  return (
    <div className="min-h-screen bg-[#020203] text-white pt-24 px-6 md:px-16">
        <div className="flex items-center gap-4 mb-12">
            <Link to="/" className="magnetic-target p-3 bg-white/5 rounded-full hover:bg-cyan-500 hover:text-black transition-colors">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                {title}
            </h1>
        </div>

        {loading ? (
             <div className="h-64 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 pb-20">
                {movies.map((movie, idx) => (
                    <MovieCard key={movie.id} movie={movie} index={idx} />
                ))}
            </div>
        )}
    </div>
  );
};

export default Category;