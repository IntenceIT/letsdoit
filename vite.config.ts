import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimized build settings for faster loading
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into smaller chunks
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-db': ['firebase/firestore'],
          'ui-components': ['framer-motion', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Stricter warning limit
    cssCodeSplit: true, // Split CSS for better caching
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'firebase/app', 
      'firebase/auth', 
      'firebase/firestore'
    ],
    // Force optimization on startup
    force: true,
  },
}));