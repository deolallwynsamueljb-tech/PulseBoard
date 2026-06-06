/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#09090b',
          900: '#0d0d10',
          800: '#18181b',
          700: '#1c1c20',
          600: '#27272a',
          500: '#3f3f46',
          400: '#52525b',
          300: '#71717a',
        },
        brand: {
          50:  '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
