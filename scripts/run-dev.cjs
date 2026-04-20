/**
 * Local: Vite + API (concurrent). Render: same entrypoint as production so mis-set Start Command does not OOM.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const backendEntry = path.join(root, 'backend', 'index.js');

if (process.env.RENDER === 'true') {
  console.warn('[Zync] RENDER=true: starting production server (node backend/index.js).');
  const r = spawnSync(process.execPath, [backendEntry], {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  });
  process.exit(r.status === null ? 1 : r.status);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const r = spawnSync(npmCmd, ['run', 'dev:full'], {
  stdio: 'inherit',
  cwd: root,
  shell: true,
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
