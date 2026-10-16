import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#141A33",
          900: "#1E2544",
          800: "#2A3256",
          700: "#36416B",
        },
        sand: {
          50: "#FFFDF7",
          100: "#FEF9EF",
          200: "#F8ECD2",
          300: "#EADCB9",
          400: "#D3C299",
        },
        yellowAccent: {
          400: "#FFC72C",
          500: "#FFB800",
          600: "#E6A600",
        },
        brandBlue: {
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        warm: "0 8px 30px rgba(42, 50, 86, 0.08)",
        warmLg: "0 16px 40px rgba(42, 50, 86, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
