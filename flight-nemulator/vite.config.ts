import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BATTLEWORLD_GLOBE': JSON.stringify(process.env.VITE_BATTLEWORLD_GLOBE ?? '1')
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/playcanvas')) return 'playcanvas';
        }
      }
    }
  }
});
