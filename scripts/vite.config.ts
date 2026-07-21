import { defineConfig } from 'vite';

// Dev server for the similarity explorer (npm run dev). The root is this folder;
// `fs.allow: ['..']` lets it read the committed spectra under src/__tests__/data.
export default defineConfig({
  root: import.meta.dirname,
  server: {
    fs: { allow: ['..'] },
    open: true,
  },
});
