import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nexo: {
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        }
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
