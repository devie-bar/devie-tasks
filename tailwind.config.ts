import type { Config } from "tailwindcss";

/**
 * Colours and faces come from DESIGN.md (De Vie Design Standard, Part 2).
 * Do not add a value here that is not in that file.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--c-paper) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          line: "rgb(var(--c-line) / <alpha-value>)",
        },
        // Primary structural colour. White on brand is 8.0:1, so every
        // existing text-white on bg-brand pairing stays AA.
        brand: {
          DEFAULT: "#025B4C",
          soft: "#0B7A63",
          wash: "rgb(var(--c-wash) / <alpha-value>)",
          deep: "#013D33",
        },
        // Action fill and rules. Copper is a FILL, never body text:
        // #E16000 on paper is 3.6:1. Use copper.deep for copper text (5.2:1),
        // and ink (not white) for text on a copper fill (4.65:1).
        copper: {
          DEFAULT: "#E16000",
          deep: "#B24700",
          soft: "#F0B37A",
        },
        good: { DEFAULT: "rgb(var(--c-good) / <alpha-value>)", tint: "rgb(var(--c-good-tint) / <alpha-value>)", line: "rgb(var(--c-good-line) / <alpha-value>)" },
        warn: { DEFAULT: "rgb(var(--c-warn) / <alpha-value>)", tint: "rgb(var(--c-warn-tint) / <alpha-value>)", line: "rgb(var(--c-warn-line) / <alpha-value>)" },
        danger: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", tint: "rgb(var(--c-danger-tint) / <alpha-value>)", line: "rgb(var(--c-danger-line) / <alpha-value>)" },
        info: { DEFAULT: "rgb(var(--c-info) / <alpha-value>)", tint: "rgb(var(--c-info-tint) / <alpha-value>)", line: "rgb(var(--c-info-line) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["Epilogue", "Segoe UI", "system-ui", "-apple-system", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["PP Editorial New", "Cambria", "Hoefler Text", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
