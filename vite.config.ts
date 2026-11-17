import { defineConfig } from 'vite';

// Relative base: works both on GitHub Pages (/lantern-city.github.io/)
// and on a Vercel root domain, where an absolute '/lantern-city.github.io/'
// base would 404 the assets.
export default defineConfig({
  base: './',
});
