/**
 * Prevent `npm run dev` on Render (Vite + API exceeds ~512Mi).
 * Set Start Command to `npm start` in the Render dashboard or use render.yaml.
 */
if (process.env.RENDER === 'true') {
  console.error('');
  console.error('[Zync] Refusing `npm run dev` on Render (out-of-memory risk).');
  console.error('    Use Start Command: npm start');
  console.error('    Use Build Command:  HUSKY=0 npm install && npm run build');
  console.error('');
  process.exit(1);
}
