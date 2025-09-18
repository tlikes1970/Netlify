/**
 * Vite Configuration
 * Purpose: Build system configuration for Flicklet
 * Data Source: Project structure and requirements
 * Update Path: Modify this file for build changes
 * Dependencies: Vite build system
 */

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "www",
  base: "/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "www/index.html"),
      },
    },
    // Performance optimizations
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096,
    // Source maps for debugging
    sourcemap: true,
  },
  server: {
    port: 8000,
    open: true,
    cors: true,
  },
  preview: {
    port: 8000,
    open: true,
  },
  // CSS optimization
  css: {
    devSourcemap: true,
  },
  // Plugin configuration
  plugins: [
    // Custom plugin for environment variables
    {
      name: "env-loader",
      configResolved(config) {
        // Load environment variables
        require("dotenv").config();
      },
    },
  ],
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "26.0"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
