import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink) / <alpha-value>)",
        paper: "hsl(var(--paper) / <alpha-value>)",
        "paper-warm": "hsl(var(--paper-warm) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
        brand: {
          red: "hsl(var(--brand-red) / <alpha-value>)",
          "red-ink": "hsl(var(--brand-red-ink) / <alpha-value>)",
          peach: "hsl(var(--brand-peach) / <alpha-value>)",
          yellow: "hsl(var(--brand-yellow) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      fontSize: {
        "display-lg": ["4.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "600" }],
        display: ["3rem", { lineHeight: "1.02", letterSpacing: "-0.025em", fontWeight: "600" }],
        h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.0625rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        small: ["0.8125rem", { lineHeight: "1.45" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
