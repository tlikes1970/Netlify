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
        open: false,
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
      fs: { allow: [inputsPath, path.resolve(__dirname, '..'), repoRoot] },
      // Proxy API requests to backend server in dev mode
      proxy: {
        '/api/v1': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        }
      },
      // Configure HMR to work through Netlify dev proxy
      // When running through netlify dev (port 8888), HMR should connect through the proxy
      // netlify dev sets NETLIFY_DEV=true, or we detect by checking if port 4173 is in args
      hmr: process.env.NETLIFY_DEV || process.argv.some(arg => arg.includes('4173'))
        ? { clientPort: 8888 }
        : undefined,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase chunks - separate auth and firestore
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
            'firebase-app': ['firebase/app'],
            
            // React vendor chunk
            'react-vendor': ['react', 'react-dom'],
            
            // Game components - lazy loaded
            'games': [
              './src/components/games/TriviaGame.tsx',
              './src/components/games/FlickWordModal.tsx',
              './src/components/games/TriviaModal.tsx',
              './src/components/games/FlickWordStats.tsx',
              './src/components/games/TriviaStats.tsx'
            ],
            
            // Modal components - lazy loaded
            'modals': [
              './src/components/modals/NotificationSettings.tsx',
              './src/components/modals/NotificationCenter.tsx',
              './src/components/modals/EpisodeTrackingModal.tsx',
              './src/components/modals/NotesAndTagsModal.tsx',
              './src/components/modals/NotInterestedModal.tsx'
            ],
            
            // Page components - lazy loaded
            'pages': [
              './src/pages/ListPage.tsx',
              './src/pages/MyListsPage.tsx',
              './src/pages/DiscoveryPage.tsx'
            ],
            
            // Settings - heavy component
            'settings': [
              './src/components/SettingsPage.tsx'
            ],
            
            // Community features
            'community': [
              './src/components/CommunityPanel.tsx',
              './src/components/CommunityPlayer.tsx'
            ]
          }
        }
      }
    }
  };
});
