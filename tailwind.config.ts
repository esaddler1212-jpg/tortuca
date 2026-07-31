import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b0b0f",
          raised: "#14141a",
          card: "#1c1c24",
        },
        accent: {
          DEFAULT: "#e8a838",
          muted: "#c4922f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-fade":
          "linear-gradient(90deg, rgba(11,11,15,0.95) 0%, rgba(11,11,15,0.4) 55%, rgba(11,11,15,0.1) 100%)",
        "hero-bottom":
          "linear-gradient(180deg, transparent 0%, rgba(11,11,15,0.6) 70%, #0b0b0f 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
