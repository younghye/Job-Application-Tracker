import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"), // Tell Vite to find your TS file
        background: resolve(__dirname, "src/background.ts"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
      output: {
        entryFileNames: "[name].js", // This ensures it's named 'content.js' not 'content-hash.js'
        // let import function in content script work without CORS issues
        manualChunks: undefined,
      },
    },
    modulePreload: false,
    outDir: "dist",
  },
});
