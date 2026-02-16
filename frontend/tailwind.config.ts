import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#02a95c",
          "green-hover": "#028a4a",
          "green-light": "#e6f7ef",
          dark: "#1a1a1a",
          body: "#333333",
          muted: "#6b7280",
          border: "#e5e7eb",
          "bg-warm": "#f9fafb",
          "card-hover": "#f3f4f6",
        },
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        soft: "0 2px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
