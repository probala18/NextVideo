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
        brand: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
        ink: {
          950: "#090A0E",
          900: "#10131A",
          850: "#151821",
          800: "#1D212D",
          700: "#272D3D",
          600: "#373E52",
          500: "#4F5973",
          400: "#7582A3",
          300: "#9FAECB",
          200: "#CBD5E8",
          100: "#E9EFF9",
          50: "#F6F9FD",
        },
        studio: {
          lime: "#65A30D",
          "lime-hover": "#4D7C0F",
          "lime-subtle": "#ECFCCB",
          orange: "#F97316",
          "orange-hover": "#EA580C",
          emerald: "#10B981",
          crimson: "#EF4444",
          blue: "#0284C7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
        float: "0 10px 30px -5px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
