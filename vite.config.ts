import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          if (id.includes('node_modules/d3') || id.includes('node_modules/topojson')) return 'd3';
          if (id.includes('node_modules/react')) return 'react';
        },
      },
    },
  },
});
