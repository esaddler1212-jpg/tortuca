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
        alfred: {
          ink: "#020617",
          panel: "#0a1628",
          border: "#155e75",
          gold: "#22d3ee",
          "gold-dim": "#0891b2",
          cream: "#ecfeff",
          mist: "#7dd3fc",
        },
      },
      boxShadow: {
        panel: "0 0 1px rgba(34, 211, 238, 0.4), 0 4px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(34, 211, 238, 0.08)",
        hud: "0 0 16px rgba(34, 211, 238, 0.35)",
        "hud-lg": "0 0 28px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.06)",
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
