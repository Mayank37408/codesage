/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', '"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        'bg-primary': '#000000',
        'bg-secondary': '#0a0a0a',
        accent: '#ffffff',
        'accent-hover': '#e2e2e2',
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255, 255, 255, 0.6)',
        'text-muted': 'rgba(255, 255, 255, 0.3)',
        high: '#ff4444',
        medium: '#ffaa00',
        low: '#aaaaaa',
        success: '#ffffff',
      }
    },
  },
  plugins: [],
}
