/**
 * =============================================================================
 * Preload Script — ZYNC Desktop Application
 * =============================================================================
 *
 * This script runs before the renderer process is loaded. It has access to
 * both Node.js APIs and the DOM. It uses contextBridge to safely expose
 * specific APIs to the renderer, ensuring security through context isolation.
 *
 * All APIs exposed here must be documented in `electron/preload/types.ts`.
 *
 * Security Model:
 * ─────────────────────────────────────────────────────────────────────────────
 * - Direct access to ipcRenderer is NEVER exposed to the renderer process
 * - All exposed functions perform argument validation before forwarding
 * - Only explicitly whitelisted IPC channels are accessible
 * - No raw Node.js APIs (fs, child_process, etc.) are exposed
 * - The contextBridge ensures renderer cannot prototype-pollute these objects
 *
 * API Surface:
 * ─────────────────────────────────────────────────────────────────────────────
 * window.electron   — Main API (navigation, window mgmt, file ops, settings)
 * window.versions   — Runtime version info (node, chrome, electron, app)
 *
 * @module electron/preload
 * @author ZYNC Team
 * @version 2.0.0
 * @license MIT
 * =============================================================================
 */
export {};
