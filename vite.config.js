// base './' so dist/ works on GitHub Pages subpaths and Netlify alike.
// entries: don't let Vite scan the saved reference pages in the repo root.
export default { base: './', optimizeDeps: { entries: ['index.html'] } };
