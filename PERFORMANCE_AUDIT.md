# Performance Audit Todo List

## Frontend (React/Vite)
- [ ] Analyze Vite bundle size (e.g., using `rollup-plugin-visualizer`).
- [ ] Implement lazy loading (`React.lazy`) for heavy routes and components.
- [ ] Audit React component re-renders and apply `useMemo`/`useCallback` where appropriate.
- [ ] Optimize static assets (images, fonts, large icons) for faster loading.
- [ ] Run Lighthouse audits on the frontend production build.
- [ ] Review and clean up unnecessary dependencies in `package.json`.

## Backend (Node/Express)
- [ ] Review MongoDB collection structures and add necessary indexes for slow queries.
- [ ] Optimize database queries (avoid resolving unnecessary large nested documents).
- [x] Implement API pagination and limit dataset sizes returned to the client.
- [ ] Introduce caching strategies (e.g., Redis) for frequently accessed, strictly read-only data.
- [ ] Profile expensive API routes and optimize heavy computational logic.
- [ ] Audit WebSocket (socket.io) event payloads and frequency to prevent network saturation.

## Network & Infrastructure
- [ ] Verify HTTP gzip/brotli compression is enabled on the server.
- [ ] Setup application performance monitoring (APM) to track response times.
- [ ] Review Docker image sizes and optimize `Dockerfile` build processes.
