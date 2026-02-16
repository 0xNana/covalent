import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-slate": "#121826",
        "lighter-slate": "#1c2536",
        "soft-white": "#f8fafc",
        "primary-blue": "#4f95ff",
        "primary-purple": "#a78bfa",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
