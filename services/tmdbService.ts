import { Movie, MovieDetails, Video } from '../types';
import { tmdbRequest } from './http';

export { ApiError, friendlyError, getNetStatus, subscribeNet, prunePersistent } from './http';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export interface Paged<T> {
  results: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

interface RawPage {
  results?: Movie[];
  page?: number;
  total_pages?: number;
  total_results?: number;
}

/**
 * Normalises a TMDB list:
 *  - tags `media_type` (TMDB omits it on /tv/* lists, which used to make TV
 *    cards link to /details/movie/<tv id> — the wrong title or a 404)
 *  - drops people and duplicate ids (TMDB pages sometimes overlap)
 */
const normalise = (items: Movie[] | undefined, mediaType?: 'movie' | 'tv'): Movie[] => {
  const seen = new Set<string>();
  const out: Movie[] = [];
  for (const item of items ?? []) {
    if (!item || item.media_type === 'person') continue;
    const type = item.media_type ?? mediaType ?? (item.first_air_date && !item.release_date ? 'tv' : 'movie');
    const key = `${type}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(type === item.media_type ? item : { ...item, media_type: type });
  }
  return out;
};

const toPaged = (raw: RawPage, mediaType?: 'movie' | 'tv'): Paged<Movie> => ({
  results: normalise(raw.results, mediaType),
  page: raw.page ?? 1,
  // TMDB caps list pagination at 500 pages
  totalPages: Math.min(raw.total_pages ?? 1, 500),
  totalResults: raw.total_results ?? 0,
});

const list = async (
  endpoint: string,
  mediaType: 'movie' | 'tv' | undefined,
  params: Record<string, string> = {},
  ttlMs = HOUR,
): Promise<Paged<Movie>> => toPaged(await tmdbRequest<RawPage>(endpoint, params, { ttlMs }), mediaType);

/* ---------------- Lists ---------------- */

export const getTrendingPage = (page = 1) => list('/trending/all/day', undefined, { page: String(page) }, 30 * MIN);
export const getPopularMoviesPage = (page = 1) => list('/movie/popular', 'movie', { page: String(page) });
export const getPopularTVPage = (page = 1) => list('/tv/popular', 'tv', { page: String(page) });
export const getTopRatedPage = (page = 1) => list('/movie/top_rated', 'movie', { page: String(page) }, 6 * HOUR);
export const getTopRatedTVPage = (page = 1) => list('/tv/top_rated', 'tv', { page: String(page) }, 6 * HOUR);
export const getUpcomingPage = (page = 1) => list('/movie/upcoming', 'movie', { page: String(page) }, 3 * HOUR);
export const getGenrePage = (genreId: number, page = 1) =>
  list('/discover/movie', 'movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page: String(page),
  });

export const getTrending = async () => (await getTrendingPage()).results;
export const getPopularMovies = async () => (await getPopularMoviesPage()).results;
export const getPopularTV = async () => (await getPopularTVPage()).results;
export const getTopRated = async () => (await getTopRatedPage()).results;
export const getUpcoming = async () => (await getUpcomingPage()).results;
export const getMoviesByGenre = async (genreId: number) => (await getGenrePage(genreId)).results;

/* ---------------- Categories (home rails → "see all" pages) ---------------- */

export interface CategoryDef {
  title: string;
  fetchPage: (page: number) => Promise<Paged<Movie>>;
}

export const CATEGORIES: Record<string, CategoryDef> = {
  trending: { title: 'Trending now', fetchPage: getTrendingPage },
  upcoming: { title: 'Coming soon', fetchPage: getUpcomingPage },
  'popular-movies': { title: 'Popular films', fetchPage: getPopularMoviesPage },
  'popular-tv': { title: 'Popular series', fetchPage: getPopularTVPage },
  'top-rated': { title: 'Critically acclaimed', fetchPage: getTopRatedPage },
  'top-rated-tv': { title: 'Top-rated series', fetchPage: getTopRatedTVPage },
  action: { title: 'High-octane action', fetchPage: (p) => getGenrePage(28, p) },
  comedy: { title: 'Laugh out loud', fetchPage: (p) => getGenrePage(35, p) },
  'sci-fi': { title: 'Sci-fi & the future', fetchPage: (p) => getGenrePage(878, p) },
};

/* ---------------- Details ---------------- */

export const getDetails = async (id: number, type: 'movie' | 'tv'): Promise<MovieDetails> => {
  const append =
    type === 'movie'
      ? 'credits,videos,similar,reviews,keywords,release_dates'
      : 'credits,videos,similar,reviews,keywords,content_ratings';

  const data = await tmdbRequest<MovieDetails>(`/${type}/${id}`, { append_to_response: append }, { ttlMs: 6 * HOUR });

  return {
    ...data,
    media_type: type,
    similar: data.similar ? { results: normalise(data.similar.results, type) } : undefined,
  };
};

/* ---------------- Search ---------------- */

export const searchMulti = async (query: string, page = 1): Promise<Movie[]> => {
  const q = query.trim();
  if (!q) return [];
  const raw = await tmdbRequest<RawPage>(
    '/search/multi',
    { query: q, include_adult: 'false', page: String(page) },
    { ttlMs: 15 * MIN },
  );
  return normalise(raw.results);
};

/* ---------------- Videos / trailers ---------------- */

export const getVideos = async (id: number, type: 'movie' | 'tv'): Promise<Video[]> => {
  const raw = await tmdbRequest<{ results?: Video[] }>(`/${type}/${id}/videos`, {}, { ttlMs: 24 * HOUR });
  return raw.results ?? [];
};

/** Best YouTube trailer: official trailer → any trailer → teaser. */
export const pickTrailer = (videos: Video[] | undefined): Video | undefined => {
  const yt = (videos ?? []).filter((v) => v.site === 'YouTube' && v.key);
  return (
    yt.find((v) => v.type === 'Trailer' && /official/i.test(v.name)) ||
    yt.find((v) => v.type === 'Trailer') ||
    yt.find((v) => v.type === 'Teaser')
  );
};

/* ---------------- Discover (mood recommender) ---------------- */

export interface DiscoverOptions {
  genres?: number[];
  language?: string;
  fromYear?: number;
  toYear?: number;
  sortBy?: string;
  minRating?: number;
  page?: number;
}

export const discoverContent = async ({
  genres = [],
  language = 'all',
  fromYear,
  toYear,
  sortBy = 'popularity.desc',
  minRating = 0,
  page = 1,
}: DiscoverOptions): Promise<Paged<Movie>> => {
  const params: Record<string, string> = {
    sort_by: sortBy,
    include_adult: 'false',
    'vote_count.gte': sortBy.startsWith('vote_average') ? '300' : '50',
    page: String(page),
  };
  if (minRating > 0) params['vote_average.gte'] = String(minRating);
  if (language !== 'all') params.with_original_language = language;
  // `|` = OR. A comma means AND in TMDB, which made mixed moods return nothing.
  if (genres.length > 0) params.with_genres = genres.join('|');
  if (fromYear) params['primary_release_date.gte'] = `${fromYear}-01-01`;
  if (toYear) params['primary_release_date.lte'] = `${toYear}-12-31`;
  // Newest-first should not surface unreleased titles
  if (sortBy.startsWith('primary_release_date') && !toYear) {
    params['primary_release_date.lte'] = new Date().toISOString().slice(0, 10);
  }

  return list('/discover/movie', 'movie', params);
};

/* ---------------- Charades ---------------- */

export const countTitleWords = (title: string) =>
  title
    .replace(/[:\-–—]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Picks a random, reasonably well-known movie whose title has `wordCount` words.
 * Only samples pages that actually exist for the chosen filters, fetches a few
 * pages in parallel, and avoids repeating recently drawn titles.
 */
export const drawCharadesTitle = async (
  language: string,
  wordCount: number,
  genreId: number | null,
  exclude: Set<number> = new Set(),
): Promise<Movie | null> => {
  const base: Record<string, string> = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    'vote_count.gte': '20',
  };
  if (language !== 'all') base.with_original_language = language;
  if (genreId) base.with_genres = String(genreId);

  const first = await list('/discover/movie', 'movie', { ...base, page: '1' }, 12 * HOUR);
  // Stay within the popular end of the catalogue so titles are guessable.
  const maxPage = Math.max(1, Math.min(first.totalPages, 40));
  const tried = new Set<number>([1]);
  let pool: Movie[] = first.results;

  const matches = (m: Movie) => !!m.title && !exclude.has(m.id) && countTitleWords(m.title) === wordCount;

  for (let round = 0; round < 3; round++) {
    const hits = pool.filter(matches);
    if (hits.length) return shuffle(hits)[0];

    const candidates = shuffle(Array.from({ length: maxPage }, (_, i) => i + 1).filter((p) => !tried.has(p))).slice(0, 4);
    if (candidates.length === 0) break;
    candidates.forEach((p) => tried.add(p));

    const pages = await Promise.allSettled(
      candidates.map((p) => list('/discover/movie', 'movie', { ...base, page: String(p) }, 12 * HOUR)),
    );
    pool = pages.flatMap((r) => (r.status === 'fulfilled' ? r.value.results : []));
  }

  const late = pool.filter(matches);
  if (late.length) return shuffle(late)[0];

  // Last resort: allow a repeat rather than coming back empty.
  const repeat = pool.filter((m) => m.title && countTitleWords(m.title) === wordCount);
  return repeat.length ? shuffle(repeat)[0] : null;
};
