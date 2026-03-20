import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#122023",
        mist: "#eef2ea",
        pine: "#31574f",
        clay: "#c7b49b",
        rust: "#9d5a4c",
        gold: "#ba9b5d"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(18, 32, 35, 0.08)"
      },
      fontFamily: {
        sans: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
