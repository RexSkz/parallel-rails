import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'game',
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'parallel-rails.min.js'
      }
    }
  }
});
