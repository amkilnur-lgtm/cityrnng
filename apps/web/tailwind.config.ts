import type { Config } from "tailwindcss";

/**
 * CITYRNNG Tailwind theme — aligned with C3 · Светлый design v0.
 * Token values live in src/app/globals.css :root; here we expose them
 * as Tailwind utilities (bg-paper, text-ink, bg-brand-red, etc.) so
 * product screens can build forward without CSS Modules.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink) / <alpha-value>)",
        paper: "hsl(var(--paper) / <alpha-value>)",
        "paper-2": "hsl(var(--paper-2) / <alpha-value>)",
        "paper-3": "hsl(var(--paper-3) / <alpha-value>)",
        graphite: "hsl(var(--graphite) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-2": "hsl(var(--muted-2) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
        brand: {
          red: "hsl(var(--brand-red) / <alpha-value>)",
          "red-ink": "hsl(var(--brand-red-ink) / <alpha-value>)",
          tint: "hsl(var(--brand-tint) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
