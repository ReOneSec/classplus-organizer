/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        cp: {
          'bg-primary': '#0F0F1A',
          'bg-secondary': '#1A1A2E',
          'bg-elevated': '#252540',
          'bg-hover': '#2D2D50',
          'accent': '#7C3AED',
          'accent-hover': '#6D28D9',
          'accent-light': '#8B5CF6',
          'cyan': '#06B6D4',
          'cyan-hover': '#0891B2',
          'success': '#10B981',
          'success-bg': 'rgba(16, 185, 129, 0.15)',
          'warning': '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.15)',
          'danger': '#EF4444',
          'danger-bg': 'rgba(239, 68, 68, 0.15)',
          'text-primary': '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
          'border': '#2D2D4A',
          'border-light': '#3D3D5C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.375rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      animation: {
        'slide-in': 'slideIn 300ms ease-out',
        'slide-out': 'slideOut 300ms ease-in',
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'pulse-star': 'pulseStar 400ms ease-in-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'count-up': 'countUp 600ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'bounce-in': 'bounceIn 400ms ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pulseStar: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        'elevated': '0 20px 40px -8px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
    },
  },
  plugins: [],
};
