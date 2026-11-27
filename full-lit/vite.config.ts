import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: { port: 3001, open: true },
  resolve: {
    tsconfigPaths: true
  },
  plugins: [tailwindcss()],
});
