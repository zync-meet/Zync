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
 * security:
 * - Direct access to ipcRenderer is never exposed
 * - All exposed functions perform basic validation
 * - Only whitelisted channels are allowed
 *
 * @module electron/preload
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
export {};
