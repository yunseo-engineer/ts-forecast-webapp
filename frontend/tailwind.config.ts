import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        ink: {
          900: "#0B0B0D",
          700: "#2A2A30",
          500: "#6B6B74",
          300: "#B8B8BE",
          100: "#E8E8EB",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F6F8",
          sunken: "#EDEEF1",
        },
        accent: {
          DEFAULT: "#111113",
          soft: "#F2F3F6",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11, 11, 13, 0.04), 0 8px 24px rgba(11, 11, 13, 0.06)",
        ring: "0 0 0 1px rgba(11, 11, 13, 0.08)",
      },
      backgroundImage: {
        "landing-gradient":
          "radial-gradient(1200px 600px at 50% -10%, rgba(197, 210, 230, 0.55), transparent 60%), linear-gradient(180deg, #EEF1F6 0%, #F6F7FA 45%, #FFFFFF 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
