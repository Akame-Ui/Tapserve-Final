/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: "#4F46E5",
        "indigo-dark": "#3730A3",
        "indigo-light": "#818CF8",
        "indigo-pale": "#EEF2FF",
        "space-indigo": "#1E2952",
        "space-indigo-deep": "#0F172A",
        slate: {
          bg: "#F8FAFC",
          dark: "#1E293B",
          muted: "#64748B",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
}