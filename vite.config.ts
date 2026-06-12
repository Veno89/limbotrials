import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  publicDir: false,
  plugins: [tailwindcss()],
  build: {
    target: 'es2022',
  },
});
