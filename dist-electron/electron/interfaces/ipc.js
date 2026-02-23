/**
 * =============================================================================
 * IPC Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces defining the structure and types for all Inter-Process
 * Communication (IPC) messages exchanged between the main process and the
 * renderer process. These interfaces ensure type safety across the IPC boundary.
 *
 * IPC Architecture:
 * ┌─────────────┐  send/invoke  ┌───────────────┐
 * │  Renderer    │ ────────────► │  Main Process  │
 * │  (React)     │ ◄──────────── │  (Node.js)     │
 * └─────────────┘  fromMain     └───────────────┘
 *
 * Channel Types:
 * - SEND: One-way, fire-and-forget (ipcMain.on / ipcRenderer.send)
 * - INVOKE: Two-way, request-response (ipcMain.handle / ipcRenderer.invoke)
 * - RECEIVE: Main → Renderer notifications (webContents.send)
 *
 * @module electron/interfaces/ipc
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
export {};
//# sourceMappingURL=ipc.js.map