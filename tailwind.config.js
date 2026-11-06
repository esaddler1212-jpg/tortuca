/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    // `lg` at 833px: iPad portrait (~768–820) stays in stacked/mobile HUD; iPad
    // landscape and large tablets pick up two-column Today + side Iris talk.
    extend: {
      screens: {
        lg: "833px",
      },
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
        // Alfred speaking: a ripple per word, and a breathing glow (works even
        // where the browser doesn't report word boundaries).
        "hud-word": "hud-word 0.7s ease-out forwards",
        "hud-talk-glow": "hud-talk-glow 0.45s ease-in-out infinite alternate",
        "hud-listen": "hud-listen 1.1s ease-in-out infinite alternate",
        "hud-burst": "hud-burst 0.9s ease-out forwards",
        "fade-in": "fade-in 0.35s ease-out forwards",
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
        "hud-word": {
          from: { transform: "scale(1)", opacity: "0.9" },
          to: { transform: "scale(1.9)", opacity: "0" },
        },
        "hud-listen": {
          from: { transform: "scale(0.96)", opacity: "0.7" },
          to: { transform: "scale(1.1)", opacity: "1" },
        },
        "hud-burst": {
          from: { transform: "scale(0.9)", opacity: "0.95" },
          to: { transform: "scale(1.6)", opacity: "0" },
        },
        "hud-talk-glow": {
          from: { transform: "scale(0.94)", opacity: "0.75" },
          to: { transform: "scale(1.08)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
