/**
 * @file renderer.js
 * @description Renderer script for the Settings page.
 * This file handles user interactions on the settings page, such as clicking
 * download buttons, and communicates with the main process via the exposed IPC API.
 *
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 */

/**
 * Wait for the DOM to be fully loaded before attaching event listeners.
 * This ensures that all elements are available in the DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Settings page loaded');

  // Get references to the download buttons
  const btnWin = document.getElementById('btn-win');
  const btnMac = document.getElementById('btn-mac');
  const btnLinux = document.getElementById('btn-linux');

  /**
   * Helper function to handle button clicks safely.
   * Checks if the button exists before adding the listener.
   *
   * @param {HTMLElement | null} button - The button element.
   * @param {string} platform - The platform identifier ('win', 'mac', 'linux').
   */
  const addDownloadListener = (button, platform) => {
    if (button) {
      button.addEventListener('click', () => {
        console.log(`Download requested for platform: ${platform}`);

        // Ensure the 'electron' API is available (exposed by preload script)
        if (window.electron && window.electron.downloadPlatform) {
          window.electron.downloadPlatform(platform);
        } else {
          console.error('Electron API is not available. Are you running in Electron?');
          alert('Failed to initiate download. Electron API not found.');
        }
      });
    } else {
      console.warn(`Button for platform ${platform} not found in the DOM.`);
    }
  };

  // Attach event listeners to the buttons
  addDownloadListener(btnWin, 'win');
  addDownloadListener(btnMac, 'mac');
  addDownloadListener(btnLinux, 'linux');

  // Add more settings logic here as the application expands
  // For example: theme switching, user preferences, etc.
});
