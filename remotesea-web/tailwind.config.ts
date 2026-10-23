import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0F9F4",
          100: "#DCEFDF",
          200: "#B8DFC0",
          400: "#6DBF82",
          600: "#2E9B52",
          700: "#1F7A3D",
          900: "#0D3D1F",
        },
        neutral: {
          50: "#F8F7F4",
          100: "#EFEDE8",
          200: "#DDD9D1",
          300: "#C7C2B9",
          400: "#9B9690",
          500: "#757069",
          600: "#5C5954",
          700: "#423F3C",
          800: "#2C2A28",
          900: "#1A1917",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          400: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "24": "24px",
      },
      boxShadow: {
        card: "0 2px 4px rgba(26,25,23,0.04), 0 6px 16px rgba(26,25,23,0.06)",
        "card-lg": "0 8px 24px rgba(26,25,23,0.10)",
        focus: "0 0 0 3px rgba(46,155,82,0.20)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
