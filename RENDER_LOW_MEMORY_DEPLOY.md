# Render low-memory deploy (512 MiB)

Running **`npm run dev`** starts **Vite + the API together** (`concurrently`). That alone can exceed a **512 MiB** instance and trigger **OOM** before any port is bound.

This repo is configured for **one Node process** in production: **`npm start`** (API + optional static `dist/` from `vite build`).

---

## Phase 1 — Fix the Start Command (required)

In the Render dashboard: **Settings → Build & Deploy → Start Command**.

| Wrong (high RAM) | Correct (low RAM) |
|------------------|-------------------|
| `npm run dev`    | `npm start`       |

Redeploy after saving.

**Verify:** Deploy logs must **not** show `concurrently` or `vite --force`. You should see only `node backend/index.js` (via `npm start`).

---

## Phase 2 — Fix the Build Command (required)

**Settings → Build Command:**

```bash
HUSKY=0 npm install && npm run build
```

- **`npm run build`** produces **`dist/`** so Express can serve the SPA in one process.
- **`HUSKY=0`** skips Husky during install (less work, no deprecated `husky install` noise on CI).

---

## Phase 3 — Environment variables (recommended)

| Key | Value | Purpose |
|-----|--------|---------|
| `NODE_ENV` | `production` | Typical production behavior |
| `HUSKY` | `0` | Skip Husky if anything still invokes `prepare` |
| `PORT` | *(Render sets this)* | HTTP port; app reads `process.env.PORT` |

Add your public app URL to backend CORS as needed, e.g.:

- `FRONTEND_URL` = `https://your-service.onrender.com`
- `ALLOWED_ORIGINS` = same URL (comma-separated if multiple)

---

## Phase 4 — Use the Blueprint file (optional but recommended)

This repository includes **`render.yaml`** at the repo root with:

- `buildCommand: HUSKY=0 npm install && npm run build`
- `startCommand: npm start`

Create or update the service from the Blueprint so the dashboard does not revert to `npm run dev`.

---

## Phase 5 — If memory is still tight (optional)

1. **Do not** run dev tooling on Render (no Vite dev server, no `concurrently`).
2. Set a conservative V8 heap cap so the container leaves headroom for native buffers:

   ```bash
   NODE_OPTIONS=--max-old-space-size=384
   ```

   Add in **Environment** on Render (adjust if you see JS heap OOM).

3. **Upgrade** the Render instance RAM if the app legitimately needs more than ~512 MiB at steady state.

---

## Phase 6 — Split frontend and API (last resort)

If the **API alone** is still near the limit:

- Deploy **Static Site** for `dist/` (build: `npm ci && npm run build`, publish `dist`).
- Deploy **Web Service** for **backend only** (`npm start` from repo root, or `npm run start --prefix backend` if you change entry).

That removes static asset handling from the API process (optional optimization).

---

## Safety rail in this repo

If the Start Command is still **`npm run dev`**, **`RENDER=true`** makes the dev script run **`node backend/index.js`** (same as **`npm start`**) so the service does not launch Vite + API and OOM.

Prefer **`npm start`** explicitly. Add **`GITHUB_WEBHOOK_SECRET`** in the dashboard when you enable GitHub webhooks (routes fail closed with **500** until it is set; the process still boots).
