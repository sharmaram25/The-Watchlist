import { MoodType } from './types';

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const TMDB_AVATAR_BASE_URL = 'https://image.tmdb.org/t/p/w185';

export const MOOD_MAPPINGS: Record<MoodType, { genres: number[]; keywords?: number[] }> = {
  [MoodType.LIGHTHEARTED]: { genres: [35, 16, 10751] },
  [MoodType.EMOTIONAL]: { genres: [18, 10749] },
  [MoodType.INTENSE]: { genres: [28, 53, 10752] },
  [MoodType.DARK]: { genres: [27, 80, 9648] },
  [MoodType.FAMILY]: { genres: [10751, 16] },
  [MoodType.NOSTALGIC]: { genres: [37, 36, 10402] },
  [MoodType.ADVENTUROUS]: { genres: [12, 14, 878] },
  [MoodType.SCIFI_GEEK]: { genres: [878, 14] },
  [MoodType.THRILL_SEEKER]: { genres: [53, 27, 9648] },
};

export const GENRES_LIST = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

export const LANGUAGES = [
  { code: 'all', name: 'All Languages' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
];