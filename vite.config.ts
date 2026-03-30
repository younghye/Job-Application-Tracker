import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"), // Tell Vite to find your TS file
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js", // This ensures it's named 'content.js' not 'content-hash.js'
      },
    },
    outDir: "dist",
  },
});
