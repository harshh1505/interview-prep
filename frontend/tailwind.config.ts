import type { Config } from "tailwindcss";

// Design direction: a "study room" feel — the calm, focused mood of prepping
// alone before a big conversation. Ink-navy ground (not black), a warm
// chalk-white surface, and a single confident brass/amber accent used only
// for the score/progress signal, not decoration.
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0F1626",
          900: "#151E33",
          800: "#1E2A45",
          700: "#2B3A5C",
        },
        chalk: {
          50: "#FBF9F3",
          100: "#F4F0E4",
          200: "#E7E0CC",
        },
        amber: {
          400: "#D9A44A",
          500: "#C88A2E",
          600: "#A9701F",
        },
        moss: {
          400: "#7A9E78",
          500: "#5C7A5A",
        },
        clay: {
          400: "#D4705A",
          500: "#B5563C",
        },
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
} satisfies Config;
