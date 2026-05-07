import type { Config } from "tailwindcss";

/**
 * Tailwind config aligned with the Claude Design handoff (`forecastlab/`).
 * The page itself is mostly CSS-class driven — Tailwind utilities are
 * available for any new components added on top.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          dim: "var(--ink-dim)",
          faint: "var(--ink-faint)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        grad: {
          1: "var(--grad-1)",
          2: "var(--grad-2)",
          3: "var(--grad-3)",
        },
      },
      backgroundImage: {
        "grad": "var(--grad)",
        "grad-soft": "var(--grad-soft)",
      },
    },
  },
  plugins: [],
};

export default config;
