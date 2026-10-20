import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#090A0C",
          900: "#101115",
          850: "#15171D",
          800: "#1B1E26",
          700: "#242833",
          600: "#323745",
          500: "#495063",
          400: "#757D93",
          300: "#9FA7BD",
          200: "#CBD1E1",
          100: "#E8ECF5",
          50: "#F5F7FC",
        },
        studio: {
          orange: "#F97316",
          "orange-hover": "#EA580C",
          "orange-subtle": "#27170B",
          emerald: "#10B981",
          "emerald-subtle": "#0A251B",
          crimson: "#F43F5E",
          "crimson-subtle": "#290F16",
          cyan: "#06B6D4",
          "cyan-subtle": "#08252C",
          yellow: "#EAB308",
          "yellow-subtle": "#261E08",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
