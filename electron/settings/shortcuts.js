/**
 * =============================================================================
 * Settings — Keyboard Shortcuts Tab — ZYNC Desktop Application
 * =============================================================================
 *
 * Renderer script for displaying keyboard shortcuts in the settings window.
 *
 * @module electron/settings/shortcuts
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/** Whether the current platform is macOS */
const isMacPlatform = window.electron.platform === 'darwin';

/** Modifier key label based on platform */
const MOD = isMacPlatform ? '⌘' : 'Ctrl';
const ALT = isMacPlatform ? '⌥' : 'Alt';

/**
 * Keyboard shortcuts organized by category.
 */
const SHORTCUTS = [
    {
        category: 'General',
        shortcuts: [
            { keys: `${MOD}+,`, description: 'Open Settings' },
            { keys: `${MOD}+Q`, description: 'Quit Application' },
            { keys: `${MOD}+N`, description: 'New Window' },
            { keys: `${MOD}+W`, description: 'Close Window' },
            { keys: 'F11', description: 'Toggle Fullscreen' },
        ],
    },
    {
        category: 'Editing',
        shortcuts: [
            { keys: `${MOD}+Z`, description: 'Undo' },
            { keys: `${MOD}+Shift+Z`, description: 'Redo' },
            { keys: `${MOD}+X`, description: 'Cut' },
            { keys: `${MOD}+C`, description: 'Copy' },
            { keys: `${MOD}+V`, description: 'Paste' },
            { keys: `${MOD}+A`, description: 'Select All' },
        ],
    },
    {
        category: 'View',
        shortcuts: [
            { keys: `${MOD}+R`, description: 'Reload Page' },
            { keys: `${MOD}+Shift+R`, description: 'Force Reload' },
            { keys: `${MOD}++`, description: 'Zoom In' },
            { keys: `${MOD}+-`, description: 'Zoom Out' },
            { keys: `${MOD}+0`, description: 'Reset Zoom' },
            { keys: 'F12', description: 'Toggle Developer Tools' },
        ],
    },
    {
        category: 'Navigation',
        shortcuts: [
            { keys: `${ALT}+Left`, description: 'Go Back' },
            { keys: `${ALT}+Right`, description: 'Go Forward' },
        ],
    },
];

/**
 * Renders the keyboard shortcuts list into the DOM.
 */
function renderShortcuts() {
    const container = document.getElementById('shortcuts-container');
    if (!container) return;

    container.innerHTML = '';

    SHORTCUTS.forEach((group) => {
        // Category header
        const header = document.createElement('h3');
        header.className = 'shortcuts-category';
        header.textContent = group.category;
        container.appendChild(header);

        // Shortcuts list
        const list = document.createElement('div');
        list.className = 'shortcuts-list';

        group.shortcuts.forEach((shortcut) => {
            const row = document.createElement('div');
            row.className = 'shortcut-row';

            const desc = document.createElement('span');
            desc.className = 'shortcut-description';
            desc.textContent = shortcut.description;

            const keys = document.createElement('kbd');
            keys.className = 'shortcut-keys';
            keys.textContent = shortcut.keys;

            row.appendChild(desc);
            row.appendChild(keys);
            list.appendChild(row);
        });

        container.appendChild(list);
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', renderShortcuts);
