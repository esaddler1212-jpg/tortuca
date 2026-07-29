/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        alfred: {
          ink: "#0c0f14",
          panel: "#141a22",
          border: "#2a3441",
          gold: "#c9a962",
          "gold-dim": "#8a7340",
          cream: "#e8e4dc",
          mist: "#9aa8b8",
        },
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
