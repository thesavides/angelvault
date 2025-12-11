/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Turquoise to Teal gradient
        primary: {
          50: '#f0fdfc',
          100: '#ccfbf6',
          200: '#99f6ed',
          300: '#5fe9df',
          400: '#40E0D0', // Turquoise
          500: '#14b8a6',
          600: '#0d9488',
          700: '#008080', // Teal
          800: '#115e5b',
          900: '#134e4a',
        },
        // Secondary: Deep navy
        navy: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d2d9e5',
          300: '#aab8cf',
          400: '#7c92b4',
          500: '#5c749b',
          600: '#495d81',
          700: '#3c4d69',
          800: '#344258',
          900: '#1A2332', // Main navy
          950: '#0f1419',
        },
        // Accent: Bright teal for CTAs
        accent: {
          DEFAULT: '#00CED1',
          hover: '#00b4b7',
          active: '#009a9d',
        },
        // Trust indicators: Gold/amber
        gold: {
          DEFAULT: '#FFB800',
          light: '#FFD54F',
          dark: '#F59E0B',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2.625rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #40E0D0 0%, #008080 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1A2332 0%, #0f1419 100%)',
        'mesh-gradient': `
          radial-gradient(at 40% 20%, hsla(174,72%,56%,0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsla(174,72%,36%,0.2) 0px, transparent 50%)
        `,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 40px rgba(64, 224, 208, 0.3)',
        'glow-lg': '0 0 60px rgba(64, 224, 208, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
