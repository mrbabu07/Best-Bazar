import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fbf7eb",
          100: "#f5ebcf",
          200: "#ead49b",
          300: "#ddbd67",
          400: "#d5ae4c",
          500: "#c8a96e",
          600: "#a27e32",
          700: "#7a5c25",
          800: "#523d1a",
          900: "#2b200e"
        },
        navy: "#1A1A2E",
        sale: "#E63946",
        paper: "#F8F7F4",
        ink: "#2D2D2D"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(26, 26, 46, 0.08)",
        lift: "0 24px 70px rgba(26, 26, 46, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
