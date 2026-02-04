/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        gold: {
          400: '#D4B77A',
          500: '#BD9A5F',
          600: '#A8874F',
          700: '#5D452B',
        },
        navy: {
          900: '#0A2240',
          800: '#0D2A4D',
          700: '#415364',
        },
        dark: {
          900: '#0A2240',
          800: '#0D2A4D',
          700: '#415364',
        },
        maroon: {
          text: '#FFFFFF',
          'text-secondary': '#D9D8D6',
          'text-muted': '#A9A89F',
          border: 'rgba(255, 255, 255, 0.08)',
          success: '#4CAF50',
          warning: '#F5A623',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 10s infinite',
        'drift-up': 'driftUp 15s linear infinite',
        'spin-slow': 'spin 15s linear infinite',
        'reverse-spin': 'reverseSpin 15s linear infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        driftUp: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.4' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-10vh) rotate(360deg)', opacity: '0' },
        },
        reverseSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        scan: {
          '0%': { top: '-10%', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { top: '110%', opacity: '0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-sheen': 'linear-gradient(45deg, transparent 25%, rgba(189, 154, 95, 0.3) 50%, transparent 75%)',
        'maroon-gradient': 'linear-gradient(135deg, #0A2240 0%, #0D2A4D 50%, #415364 100%)',
        'maroon-gold-glow': 'linear-gradient(180deg, #0A2240 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(189, 154, 95, 0.2) 0%, transparent 60%)',
        'maroon-gold-gradient': 'linear-gradient(135deg, #BD9A5F 0%, #5D452B 100%)',
      },
    },
  },
  plugins: [],
}
