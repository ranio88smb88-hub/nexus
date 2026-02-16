
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ["PP Neue Montreal", "sans-serif"],
        secondary: ["PPSupplyMono", "monospace"],
      },
    },
  },
  plugins: [],
}
