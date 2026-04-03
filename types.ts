export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv' | 'person';
  popularity: number;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  status: string;
  budget?: number;
  revenue?: number;
  vote_count?: number;
  production_companies?: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: Video[];
  };
  similar?: {
    results: Movie[];
  };
  reviews?: {
    results: Review[];
  };
  keywords?: {
    keywords?: Keyword[];
    results?: Keyword[];
  };
  release_dates?: {
    results: ReleaseDateResult[];
  };
  content_ratings?: {
    results: ContentRating[];
  };
}

export interface Review {
  id: string;
  author: string;
  content: string;
  rating?: number;
  url?: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface ReleaseDateResult {
  iso_3166_1: string;
  release_dates: {
    certification: string;
    iso_639_1: string;
    release_date: string;
    type: number;
  }[];
}

export interface ContentRating {
  iso_3166_1: string;
  rating: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Genre {
  id: number;
  name: string;
}

export enum MoodType {
  LIGHTHEARTED = 'Lighthearted',
  EMOTIONAL = 'Emotional',
  INTENSE = 'Intense',
  DARK = 'Dark',
  FAMILY = 'Family',
  NOSTALGIC = 'Nostalgic',
  ADVENTUROUS = 'Adventurous',
  SCIFI_GEEK = 'Sci-Fi Geek',
  THRILL_SEEKER = 'Thrill Seeker',
}

export interface FilterState {
  mood: MoodType | null;
  genreId: number | null;
  year: number | null;
  language: string;
}