/**
 * Personal library: the user's Watchlist and their recently viewed titles.
 * Stored on-device (localStorage), synced across tabs, safe when storage is
 * unavailable (falls back to in-memory for the session).
 */
import { useSyncExternalStore } from 'react';
import { Movie } from '../types';

export type MediaType = 'movie' | 'tv';

export interface LibraryItem {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  genre_ids: number[];
  overview: string;
  popularity: number;
  /** When it was saved / viewed */
  at: number;
}

const LIST_KEY = 'wl:watchlist';
const RECENT_KEY = 'wl:recent';
const RECENT_MAX = 20;
const LIST_MAX = 500;

const read = (key: string): LibraryItem[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (key: string, items: LibraryItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* storage full or blocked — keep in memory for this session */
  }
};

let list = read(LIST_KEY);
let recent = read(RECENT_KEY);
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LIST_KEY) list = read(LIST_KEY);
    else if (e.key === RECENT_KEY) recent = read(RECENT_KEY);
    else return;
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const toLibraryItem = (m: Movie, fallbackType: MediaType = 'movie'): LibraryItem => ({
  id: m.id,
  media_type: m.media_type === 'tv' ? 'tv' : m.media_type === 'movie' ? 'movie' : fallbackType,
  title: m.title || m.name || 'Untitled',
  poster_path: m.poster_path ?? null,
  backdrop_path: m.backdrop_path ?? null,
  release_date: m.release_date || m.first_air_date,
  vote_average: m.vote_average ?? 0,
  genre_ids: m.genre_ids ?? (m as { genres?: { id: number }[] }).genres?.map((g) => g.id) ?? [],
  overview: m.overview ?? '',
  popularity: m.popularity ?? 0,
  at: Date.now(),
});

/** Convert back to the shape MovieCard expects. */
export const toMovie = (i: LibraryItem): Movie => ({
  id: i.id,
  media_type: i.media_type,
  title: i.media_type === 'movie' ? i.title : undefined,
  name: i.media_type === 'tv' ? i.title : undefined,
  poster_path: i.poster_path,
  backdrop_path: i.backdrop_path,
  release_date: i.media_type === 'movie' ? i.release_date : undefined,
  first_air_date: i.media_type === 'tv' ? i.release_date : undefined,
  vote_average: i.vote_average,
  genre_ids: i.genre_ids,
  overview: i.overview,
  popularity: i.popularity,
});

const same = (a: { id: number; media_type?: string }, id: number, type: MediaType) =>
  a.id === id && (a.media_type === 'tv' ? 'tv' : 'movie') === type;

/* ---------------- Watchlist ---------------- */

export const isSaved = (id: number, type: MediaType) => list.some((i) => same(i, id, type));

export const toggleSaved = (m: Movie, fallbackType: MediaType = 'movie'): boolean => {
  const item = toLibraryItem(m, fallbackType);
  const exists = isSaved(item.id, item.media_type);
  list = exists ? list.filter((i) => !same(i, item.id, item.media_type)) : [item, ...list].slice(0, LIST_MAX);
  write(LIST_KEY, list);
  emit();
  return !exists;
};

export const removeSaved = (id: number, type: MediaType) => {
  list = list.filter((i) => !same(i, id, type));
  write(LIST_KEY, list);
  emit();
};

export const useWatchlist = () => useSyncExternalStore(subscribe, () => list, () => list);

export const useIsSaved = (id: number, type: MediaType) =>
  useSyncExternalStore(
    subscribe,
    () => isSaved(id, type),
    () => false,
  );

/* ---------------- Recently viewed ---------------- */

export const pushRecent = (m: Movie, fallbackType: MediaType = 'movie') => {
  const item = toLibraryItem(m, fallbackType);
  if (recent[0] && same(recent[0], item.id, item.media_type)) return;
  recent = [item, ...recent.filter((i) => !same(i, item.id, item.media_type))].slice(0, RECENT_MAX);
  write(RECENT_KEY, recent);
  emit();
};

export const clearRecent = () => {
  recent = [];
  write(RECENT_KEY, recent);
  emit();
};

export const useRecent = () => useSyncExternalStore(subscribe, () => recent, () => recent);
