import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: Object.fromEntries(['index', 'about', 'projects', '404'].map((page) => [
        page, fileURLToPath(new URL(`./${page}.html`, import.meta.url)),
      ])),
    },
  },
});
