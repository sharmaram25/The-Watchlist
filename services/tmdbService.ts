import { Movie, MovieDetails } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

const requireApiKey = (): string => {
  if (!API_KEY) {
    throw new Error('Missing TMDB API key. Set VITE_TMDB_API_KEY in your environment.');
  }
  return API_KEY;
};

const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const query = new URLSearchParams({ api_key: requireApiKey(), ...params }).toString();
  const response = await fetch(`${BASE_URL}${endpoint}?${query}`);
  
  if (!response.ok) {
    throw new Error(`TMDB Error: ${response.statusText}`);
  }
  return response.json();
};

export const getTrending = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/trending/all/day');
  return data.results;
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/movie/popular');
  return data.results;
};

export const getPopularTV = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/tv/popular');
  return data.results;
};

export const getTopRated = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/movie/top_rated');
  return data.results;
};

export const getUpcoming = async (): Promise<Movie[]> => {
    const data = await fetchFromTMDB<{ results: Movie[] }>('/movie/upcoming');
    return data.results;
};

export const getMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    const data = await fetchFromTMDB<{ results: Movie[] }>('/discover/movie', {
        with_genres: genreId.toString(),
        sort_by: 'popularity.desc'
    });
    return data.results;
};

export const getDetails = async (id: number, type: 'movie' | 'tv'): Promise<MovieDetails> => {
  return fetchFromTMDB<MovieDetails>(`/${type}/${id}`, {
    append_to_response: 'credits,videos,similar',
  });
};

export const searchMulti = async (query: string): Promise<Movie[]> => {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/search/multi', { query });
  return data.results.filter(m => m.media_type !== 'person');
};

export const discoverContent = async (
  genres: number[], 
  language: string = 'en', 
  year?: number,
  sortBy: string = 'popularity.desc',
  minRating: number = 0
): Promise<Movie[]> => {
  const params: Record<string, string> = {
    sort_by: sortBy,
    include_adult: 'false',
    'vote_count.gte': '50',
    'vote_average.gte': minRating.toString()
  };
  
  if (language !== 'all') {
    params.with_original_language = language;
  }
  
  if (genres.length > 0) {
    params.with_genres = genres.join(',');
  }
  
  if (year) {
    params.primary_release_year = year.toString();
  }

  const data = await fetchFromTMDB<{ results: Movie[] }>('/discover/movie', params);
  return data.results;
};

export const getRandomTitle = async (language: string, wordCount: number, genreId: number | null, page: number = 1): Promise<Movie | null> => {
    const params: Record<string, string> = {
        sort_by: 'popularity.desc',
        page: page.toString(),
        include_adult: 'false'
    };

    if (language !== 'all') {
        params.with_original_language = language;
    }

    if (genreId) {
        params.with_genres = genreId.toString();
    }

    try {
        const data = await fetchFromTMDB<{ results: Movie[] }>('/discover/movie', params);
        if (!data.results || data.results.length === 0) return null;

        const shuffled = data.results.sort(() => 0.5 - Math.random());
        
        for (const movie of shuffled) {
            if (!movie.title) continue;
            const cleanTitle = movie.title.replace(/[:\-]/g, '');
            const words = cleanTitle.split(/\s+/).filter(w => w.length > 0).length;
            
            if (words === wordCount) {
                return movie;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};