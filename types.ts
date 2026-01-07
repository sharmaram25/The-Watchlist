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
  tagline?: string;
  status: string;
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