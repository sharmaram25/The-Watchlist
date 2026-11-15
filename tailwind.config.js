import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  future: {
    // `hover:` styles only apply on devices that can actually hover (no sticky taps on phones).
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        xs: '480px',
        '3xl': '1920px',
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // Warm theatre blacks
        ink: {
          DEFAULT: '#0B0B0C',
          950: '#070708',
          900: '#0B0B0C',
          800: '#121214',
          700: '#19191C',
          600: '#232327',
          500: '#2E2E33',
        },
        // Paper-white text scale
        fg: {
          DEFAULT: '#F2EFE9',
          muted: '#A6A29A',
          faint: '#6E6B65',
        },
        // Tungsten / projector-lamp amber — the single accent
        accent: {
          DEFAULT: '#F2B54C',
          hover: '#F7C66E',
          ink: '#1C1407',
        },
      },
      spacing: {
        gutter: 'var(--gutter)',
        'tabbar': 'var(--tabbar-h)',
      },
      fontSize: {
        // Fluid type — scales smoothly between phone and desktop
        'fluid-hero': ['clamp(3rem, 1.6rem + 6.4vw, 8.5rem)', { lineHeight: '0.9', letterSpacing: '-0.01em' }],
        'fluid-display': ['clamp(3rem, 1.6rem + 6vw, 8rem)', { lineHeight: '0.9', letterSpacing: '-0.01em' }],
        'fluid-title': ['clamp(2.5rem, 1.6rem + 3.8vw, 5.25rem)', { lineHeight: '0.95' }],
        'fluid-section': ['clamp(1.6rem, 1.2rem + 1.4vw, 2.4rem)', { lineHeight: '1.05' }],
        'fluid-search': ['clamp(1.125rem, 1rem + 0.6vw, 1.375rem)', { lineHeight: '1.3' }],
        kicker: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        progress: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        kenburns: {
          from: { transform: 'scale(1.06) translate3d(0,0,0)' },
          to: { transform: 'scale(1) translate3d(0,0,0)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
      },
      transitionTimingFunction: {
        cinema: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addUtilities }) => {
      // `lite:` variant — applied when the device is detected as low-powered.
      addVariant('lite', 'html.lite &');
      addUtilities({
        '.perspective-1000': { perspective: '1000px' },
        '.backface-hidden': { 'backface-visibility': 'hidden', '-webkit-backface-visibility': 'hidden' },
        '.preserve-3d': { 'transform-style': 'preserve-3d' },
      });
    }),
  ],
};
