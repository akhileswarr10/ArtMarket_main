/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#0C0A08',
          50:  '#F5F1EC',
          100: '#EDE6DC',
          900: '#181210',
          950: '#0C0A08',
        },
        surface: {
          DEFAULT: '#181411',
          raised: '#211D1A',
          overlay: '#2A2420',
        },
        border: {
          subtle: '#252019',
          DEFAULT: '#332C26',
          strong: '#47403A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          300: '#E3BC62',
          400: '#D4A63A',
          500: '#C9A84C',
          600: '#A88535',
          muted: 'rgba(201,168,76,0.12)',
          glow:  'rgba(201,168,76,0.25)',
        },
        copper: {
          DEFAULT: '#9B6B3D',
          light: '#C08B5C',
          dark:  '#6B4525',
          muted: 'rgba(155,107,61,0.12)',
        },
        ink: {
          DEFAULT:   '#F0EBE3',
          secondary: '#A09388',
          muted:     '#655C55',
          inverse:   '#0C0A08',
        },
        emerald: {
          DEFAULT: '#4A9B6B',
          400: '#5AC387',
          500: '#3A7A54',
          muted: 'rgba(74,155,107,0.15)',
        },
        rose: {
          DEFAULT: '#B85C4E',
          400: '#C06B60',
          500: '#8F4640',
          muted: 'rgba(184,92,78,0.15)',
        },
        teal: {
          DEFAULT: '#4A9B8E',
          muted: 'rgba(74,155,142,0.15)',
        },
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)',
        gold:       '0 0 24px rgba(201,168,76,0.2)',
        'gold-sm':  '0 0 12px rgba(201,168,76,0.15)',
        modal:      '0 24px 80px rgba(0,0,0,0.7)',
      },
      animation: {
        shimmer:    'shimmer 2s linear infinite',
        'gold-pulse':'goldPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        goldPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}