/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        blissam: {
          black: '#08080a',
          void: '#040405',
          card: '#0f0f13',
          cardHover: '#15151b',
          border: 'rgba(243, 243, 240, 0.08)',
          borderHover: 'rgba(243, 243, 240, 0.22)',
          white: '#F3F3F0',
          muted: '#7B7B78',
          stone: '#E8E6E1',
          accent: '#c4b5fd',
        },
        darkBg: '#08080a',
        darkCard: '#0f0f13',
        darkBorder: 'rgba(243, 243, 240, 0.08)',
        brandBlue: {
          500: '#3b66f5',
          600: '#3254d6',
          700: '#2642af',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        }
      }
    },
  },
  plugins: [],
}
