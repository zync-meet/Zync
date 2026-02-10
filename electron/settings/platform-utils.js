/**
 * =============================================================================
 * Platform Utilities — ZYNC Desktop Application
 * =============================================================================
 *
 * Utility functions for detecting the current operating system and
 * providing platform-specific behavior in the settings window.
 *
 * @module electron/settings/platform-utils
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Detects the current platform from the electron preload API.
 * Falls back to navigator.userAgent if preload is unavailable.
 *
 * @returns {'win' | 'mac' | 'linux'} Platform identifier
 */
function detectPlatform() {
    // Try electron preload API first
    if (window.electron && window.electron.platform) {
        const p = window.electron.platform;
        if (p === 'win32') return 'win';
        if (p === 'darwin') return 'mac';
        return 'linux';
    }

    // Fallback to user agent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'win';
    if (ua.includes('mac')) return 'mac';
    return 'linux';
}

/**
 * Returns a human-readable platform name.
 *
 * @param {'win' | 'mac' | 'linux'} platform - Platform identifier
 * @returns {string} Display name
 */
function getPlatformName(platform) {
    const names = {
        win: 'Windows',
        mac: 'macOS',
        linux: 'Linux',
    };
    return names[platform] || 'Unknown';
}

/**
 * Highlights the download button for the current platform.
 *
 * Adds the 'active' class to the button matching the detected platform,
 * making it visually prominent to guide the user.
 */
function highlightCurrentPlatform() {
    const platform = detectPlatform();
    const buttons = document.querySelectorAll('[data-platform]');

    buttons.forEach((btn) => {
        if (btn.getAttribute('data-platform') === platform) {
            btn.classList.add('active', 'current-platform');
        }
    });

    // Update platform label if it exists
    const label = document.getElementById('current-platform-label');
    if (label) {
        label.textContent = `You're on ${getPlatformName(platform)}`;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', highlightCurrentPlatform);
