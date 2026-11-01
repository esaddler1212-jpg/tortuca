/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', "system-ui", "sans-serif"],
        sans: ['"Rajdhani"', "system-ui", "sans-serif"],
        mono: ['"Share Tech Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // The accent palette follows the focus mode (blue / green / purple);
        // values are set as CSS variables in index.css.
        cyan: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
            n,
            `rgb(var(--accent-${n}) / <alpha-value>)`,
          ]),
        ),
        alfred: {
          ink: "#000000",
          panel: "rgb(var(--panel) / <alpha-value>)",
          border: "rgb(var(--accent-800) / <alpha-value>)",
          gold: "rgb(var(--accent-400) / <alpha-value>)",
          "gold-dim": "rgb(var(--accent-500) / <alpha-value>)",
          cream: "rgb(var(--accent-50) / <alpha-value>)",
          mist: "rgb(var(--accent-300) / <alpha-value>)",
        },
      },
      boxShadow: {
        panel: "0 0 1px rgb(var(--accent-400) / 0.35), 0 4px 32px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgb(var(--accent-400) / 0.08)",
        hud: "0 0 16px rgb(var(--accent-400) / 0.35)",
        "hud-lg": "0 0 28px rgb(var(--accent-400) / 0.28), inset 0 0 20px rgb(var(--accent-400) / 0.06)",
      },
      animation: {
        "hud-pulse": "hud-pulse 3s ease-in-out infinite",
        "hud-spin": "hud-spin 12s linear infinite",
      },
      keyframes: {
        "hud-pulse": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.15)" },
        },
        "hud-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
