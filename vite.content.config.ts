import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      name: "content",
      fileName: "content",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "content.js",
      },
    },
    outDir: "dist",
    emptyOutDir: false, // Don't empty the output directory
  },
});
