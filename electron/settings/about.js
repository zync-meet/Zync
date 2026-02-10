/**
 * =============================================================================
 * Settings — About Tab — ZYNC Desktop Application
 * =============================================================================
 *
 * Renderer script for the About tab in the settings window.
 * Displays application version, runtime versions, and system info.
 *
 * @module electron/settings/about
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Initializes the About tab with application information.
 *
 * Retrieves version data from the main process via the preload API
 * and populates the DOM elements with the information.
 */
async function initAboutTab() {
    try {
        // Get app info from main process
        const info = await window.electron.getAppInfo();

        // Populate version information
        setTextContent('app-version', `v${info.version}`);
        setTextContent('electron-version', info.electronVersion);
        setTextContent('chrome-version', info.chromeVersion);
        setTextContent('node-version', info.nodeVersion);
        setTextContent('v8-version', info.v8Version);
        setTextContent('platform-info', `${info.platform} (${info.arch})`);
        setTextContent('user-data-path', info.userDataPath);

    } catch (error) {
        console.error('[About] Failed to load app info:', error);
        setTextContent('app-version', 'Error loading version');
    }
}

/**
 * Sets the text content of a DOM element by its ID.
 *
 * @param {string} id - Element ID
 * @param {string} text - Text to set
 */
function setTextContent(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Copies version info to clipboard for bug reports.
 */
function copyVersionInfo() {
    const elements = [
        'app-version',
        'electron-version',
        'chrome-version',
        'node-version',
        'platform-info',
    ];

    const info = elements
        .map((id) => {
            const el = document.getElementById(id);
            const label = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return `${label}: ${el ? el.textContent : 'N/A'}`;
        })
        .join('\n');

    window.electron.copyToClipboard(info);

    // Show feedback
    const btn = document.getElementById('copy-version-btn');
    if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = original;
        }, 2000);
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initAboutTab);
