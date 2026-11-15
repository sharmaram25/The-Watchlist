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
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 10762, name: 'Kids' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
];

export const GENRE_NAME_BY_ID: Record<number, string> = Object.fromEntries(
  [...GENRES_LIST, ...TV_GENRES].map((g) => [g.id, g.name]),
);

export const genreNames = (ids: number[] | undefined, max = 2) =>
  (ids ?? [])
    .map((id) => GENRE_NAME_BY_ID[id])
    .filter(Boolean)
    .slice(0, max);

/** Plain-language description for each mood (shown on mood cards). */
export const MOOD_BLURBS: Record<string, string> = {
  Lighthearted: 'Easy laughs, warm endings',
  Emotional: 'Bring tissues',
  Intense: 'Edge-of-your-seat',
  Dark: 'Crime, dread and mystery',
  Family: 'Something everyone agrees on',
  Nostalgic: 'Westerns, history, music',
  Adventurous: 'Far-off worlds and quests',
  'Sci-Fi Geek': 'Big ideas, bigger worlds',
  'Thrill Seeker': 'Twists and jump scares',
};

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
