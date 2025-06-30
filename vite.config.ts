import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tsconfigPaths()],

  clearScreen: false,

  server: {
    port: 3000,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Damit WASM-Dateien separat ausgeliefert werden (und nicht im JS-Bundle landen)
        assetFileNames: "[name].[hash][extname]",
      },
    },
  },
}));
