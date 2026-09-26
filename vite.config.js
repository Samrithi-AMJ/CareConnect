import { defineConfig } from 'vite';

// CareConnect is a plain HTML/CSS/JS app (no framework, no JSX), so the
// default Vite "vanilla" setup is all that's required: it serves index.html
// in dev with hot reload for src/style.css and src/main.js, and produces a
// static dist/ folder on build that can be hosted anywhere.
export default defineConfig({
  // Default base ('/') is correct for Vercel, Netlify, Render and most
  // hosting providers, which serve the app from the domain root.
  // If you deploy to a GitHub Pages *project* site (served from
  // https://username.github.io/CareConnect/ instead of a domain root),
  // uncomment the line below so built asset paths resolve correctly:
  // base: '/CareConnect/',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
