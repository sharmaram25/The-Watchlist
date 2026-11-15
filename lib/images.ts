/**
 * TMDB image URL helpers.
 *
 * Every image gets a responsive `srcset` so phones download a ~342px poster
 * and a ~780px backdrop instead of the `original` asset (which can be a
 * multi-megabyte 4K file).
 */
export const TMDB_IMG = 'https://image.tmdb.org/t/p/';

export type ImageKind = 'poster' | 'backdrop' | 'profile' | 'logo';

const SIZES: Record<ImageKind, { size: string; w: number }[]> = {
  poster: [
    { size: 'w185', w: 185 },
    { size: 'w342', w: 342 },
    { size: 'w500', w: 500 },
    { size: 'w780', w: 780 },
  ],
  backdrop: [
    { size: 'w300', w: 300 },
    { size: 'w780', w: 780 },
    { size: 'w1280', w: 1280 },
    // `original` is usually 1920–3840px wide; only very large/high-DPR screens pick it.
    { size: 'original', w: 2400 },
  ],
  profile: [
    { size: 'w185', w: 185 },
    { size: 'h632', w: 421 },
  ],
  logo: [
    { size: 'w92', w: 92 },
    { size: 'w185', w: 185 },
    { size: 'w300', w: 300 },
  ],
};

export const tmdbUrl = (path: string | null | undefined, size = 'w500'): string | undefined =>
  path ? `${TMDB_IMG}${size}${path}` : undefined;

export const tmdbSrcSet = (path: string | null | undefined, kind: ImageKind, maxWidth = Infinity): string | undefined => {
  if (!path) return undefined;
  return SIZES[kind]
    .filter((s) => s.w <= maxWidth)
    .map((s) => `${TMDB_IMG}${s.size}${path} ${s.w}w`)
    .join(', ');
};

/**
 * Fallback route for images when image.tmdb.org is unreachable from the
 * visitor's network: Netlify's Image CDN fetches it server-side (and serves
 * WebP/AVIF). Only used in production builds on non-local hosts.
 */
export const proxiedImageUrl = (path: string, width: number): string | undefined => {
  if (!import.meta.env.PROD) return undefined;
  if (typeof location !== 'undefined' && /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return undefined;
  const source = `${TMDB_IMG}original${path}`;
  return `/.netlify/images?url=${encodeURIComponent(source)}&w=${Math.round(width)}&q=80`;
};

export const POSTER_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect fill="%23171717" width="200" height="300"/%3E%3C/svg%3E';
