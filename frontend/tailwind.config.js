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
        // Deep Navy & Dark Surfaces
        navy: {
          950: '#080F1C', // Darker navy (sidebar, headers)
          900: '#0B1220', // Deep navy (main canvas)
          850: '#0F182A', // Canvas elevation
          800: '#111C2E', // Subtle card container
        },
        dark: {
          card: '#151F30',      // Cards & elevated panels
          surface: '#1C293B',   // Secondary surfaces & table headers
          border: '#24334A',    // Subtle borders
          hover: '#1E2C42',     // Hover states
          muted: '#94A3B8',     // Secondary text
          light: '#F8FAFC',     // Main text
        },
        // Professional Blue & Subtle Cyan Accents
        brand: {
          primary: '#1677E8',
          primaryHover: '#1260BD',
          cyan: '#06B6D4',
          accent: '#38BDF8',
        },
        // Incident Priorities
        priority: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
