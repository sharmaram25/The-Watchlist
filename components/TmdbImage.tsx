import React, { ImgHTMLAttributes, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { ImageKind, proxiedImageUrl, tmdbSrcSet, tmdbUrl } from '../lib/images';

type Phase = 'loading' | 'loaded' | 'failed';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  path: string | null | undefined;
  kind: ImageKind;
  /** `sizes` attribute — tells the browser how wide the image renders. */
  sizes: string;
  /** Size used for the plain `src` (older browsers / fallback). */
  size?: string;
  /** Cap the largest candidate in the srcset (e.g. 1280 on low-power devices). */
  maxWidth?: number;
  /** Fade the image in once decoded. */
  fade?: boolean;
  /** Rendered instead of the image when there is no path or loading failed. */
  fallback?: ReactNode;
  onLoaded?: () => void;
}

/**
 * Responsive TMDB image:
 *  - picks the right size for the screen via srcset/sizes
 *  - fades in once loaded (no half-painted images)
 *  - if image.tmdb.org fails (blocked network), retries once through the
 *    Netlify Image CDN before showing the fallback
 */
const TmdbImage: React.FC<Props> = ({
  path,
  kind,
  sizes,
  size = kind === 'backdrop' ? 'w1280' : kind === 'profile' ? 'w185' : 'w342',
  maxWidth,
  fade = true,
  fallback = null,
  onLoaded,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  alt = '',
  onLoad,
  onError,
  ...rest
}) => {
  const [state, setState] = useState<{ path: typeof path; phase: Phase; proxied: boolean }>({
    path,
    phase: 'loading',
    proxied: false,
  });
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when the image path changes (derived state, no extra effect pass).
  let current = state;
  if (state.path !== path) {
    current = { path, phase: 'loading', proxied: false };
    setState(current);
  }

  // Images already in the HTTP cache may finish before React attaches onLoad.
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && current.phase === 'loading') {
      setState((s) => (s.path === path ? { ...s, phase: 'loaded' } : s));
      onLoaded?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, current.proxied]);

  if (!path || current.phase === 'failed') return <>{fallback}</>;

  const proxyWidth = kind === 'backdrop' ? 1280 : kind === 'poster' ? 500 : 300;
  const src = current.proxied ? proxiedImageUrl(path, proxyWidth) : tmdbUrl(path, size);
  const srcSet = current.proxied ? undefined : tmdbSrcSet(path, kind, maxWidth);

  return (
    <img
      ref={imgRef}
      {...rest}
      key={current.proxied ? 'proxied' : 'direct'}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      crossOrigin="anonymous"
      className={`${className} ${fade ? `transition-opacity duration-500 ${current.phase === 'loaded' ? 'opacity-100' : 'opacity-0'}` : ''}`}
      onLoad={(e) => {
        setState((s) => (s.path === path ? { ...s, phase: 'loaded' } : s));
        onLoaded?.();
        onLoad?.(e);
      }}
      onError={(e) => {
        const canProxy = !current.proxied && !!proxiedImageUrl(path, proxyWidth);
        setState((s) =>
          s.path === path ? (canProxy ? { ...s, proxied: true, phase: 'loading' } : { ...s, phase: 'failed' }) : s,
        );
        onError?.(e);
      }}
    />
  );
};

export default TmdbImage;
