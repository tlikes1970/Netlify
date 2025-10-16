import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../');
const inputsPath = path.resolve(__dirname, '../../migration/inputs');

export default defineConfig(({ mode }) => {
  // Load VITE_* from both places; app wins.
  const envApp  = loadEnv(mode, __dirname, 'VITE_');
  const envRoot = loadEnv(mode, repoRoot, 'VITE_');
  const env = { ...envRoot, ...envApp };

  return {
    plugins: [
      react(),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    envDir: __dirname,
    envPrefix: ['VITE_'],
    define: {
      'import.meta.env.VITE_TMDB_KEY': JSON.stringify((env.VITE_TMDB_KEY || '').trim())
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '#inputs': inputsPath
      }
    },
    server: {
      fs: { allow: [inputsPath, path.resolve(__dirname, '..'), repoRoot] }
    }
  };
});
