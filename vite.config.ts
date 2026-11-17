import { defineConfig } from 'vite';

// Project Pages serves the site at /lantern-city.github.io/, not at the
// domain root, so built asset URLs must be prefixed with that subpath.
// Local dev then lives at http://localhost:5173/lantern-city.github.io/
export default defineConfig({
  base: '/lantern-city.github.io/',
});
