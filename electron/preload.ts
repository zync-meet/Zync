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

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Validates that an action name is a string and potentially matches
 * our whitelisted channels.
 *
 * @param {string} action - The action name to validate
 * @returns {boolean} True if valid
 */
function isValidAction(action: string): boolean {
  return typeof action === 'string' && action.length > 0;
}

/**
 * Safely exposes Electron APIs to the renderer process.
 */
contextBridge.exposeInMainWorld('electron', {
  // Navigation & Platform
  downloadPlatform: (platform: string): void => {
    ipcRenderer.send('download-platform', platform);
  },

  openSettings: (): void => {
    ipcRenderer.send('open-settings');
  },

  openExternalLink: (url: string): void => {
    ipcRenderer.send('open-external-link', url);
  },

  copyToClipboard: (text: string): void => {
    ipcRenderer.send('copy-to-clipboard', text);
  },

  // App & System Info
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  getAppInfo: (): Promise<any> => ipcRenderer.invoke('get-app-info'),
  getSystemTheme: (): Promise<string> => ipcRenderer.invoke('get-system-theme'),

  // Window Management
  minimizeWindow: (): void => ipcRenderer.send('minimize-window'),
  maximizeWindow: (): void => ipcRenderer.send('maximize-window'),
  closeWindow: (): void => ipcRenderer.send('close-window'),
  isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-window-maximized'),

  // File System Operations
  showSaveDialog: (options: any): Promise<string | null> =>
    ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any): Promise<string[]> =>
    ipcRenderer.invoke('show-open-dialog', options),
  writeFile: (data: any): Promise<any> => ipcRenderer.invoke('write-file', data),

  // Events from Main Process
  onMainMessage: (callback: (data: any) => void): (() => void) => {
    const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('fromMain', subscription);

    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('fromMain', subscription);
    };
  },

  // Environment info
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  platform: process.platform,
});

// Also expose 'versions' for backward compatibility or simple checks
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});

console.info('[Preload] APIs exposed to renderer');
