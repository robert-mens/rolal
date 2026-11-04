/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-accent)',
        'brand-hover': 'var(--color-accent-hover)',
        surface: 'var(--color-surface)',
        background: 'var(--color-bg)',
        'text-primary': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        soft: 'var(--color-soft)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      borderRadius: {
        'xs': '2px',
        'sm': '3px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'sportsbook': '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'odds-active': '0 2px 8px rgba(0, 230, 118, 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        oddsUp: {
          '0%': { backgroundColor: 'rgba(0, 230, 118, 0.4)', borderColor: '#00E676' },
          '100%': { backgroundColor: 'transparent', borderColor: 'inherit' },
        },
        oddsDown: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.4)', borderColor: '#EF4444' },
          '100%': { backgroundColor: 'transparent', borderColor: 'inherit' },
        },
        pulseRed: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'odds-up': 'oddsUp 0.9s ease-out',
        'odds-down': 'oddsDown 0.9s ease-out',
        'pulse-red': 'pulseRed 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
