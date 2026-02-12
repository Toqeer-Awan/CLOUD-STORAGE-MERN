import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke",
      },
      transitionDuration: {
        300: "300ms",
      },
      transitionTimingFunction: {
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
