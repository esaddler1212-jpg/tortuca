/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        supply: {
          50: "#faf6f0",
          100: "#f2e8d9",
          200: "#e4cfb0",
          300: "#d4b07f",
          400: "#c49252",
          500: "#b67a38",
          600: "#9a612f",
          700: "#7c4b29",
          800: "#673f27",
          900: "#573524",
          950: "#301b12",
        },
        ink: {
          850: "#1a1f2e",
          900: "#12161f",
          950: "#0c0f14",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
