/**
 * =============================================================================
 * Main Process — ZYNC Desktop Application
 * =============================================================================
 *
 * This is the entry point for the Electron main process. It manages the
 * application lifecycle, creates the primary and secondary windows, and
 * initializes all system-level modules (menu, tray, IPC, deep linking,
 * crash reporting, settings, splash screen, and security hardening).
 *
 * Startup Sequence:
 * 1. Request single instance lock (quit if already running)
 * 2. Initialize deep link handler (before app.whenReady())
 * 3. Disable hardware acceleration if user opted out
 * 4. Wait for app.whenReady()
 * 5. Initialize crash reporter
 * 6. Apply global security policies
 * 7. Initialize settings store
 * 8. Create splash screen
 * 9. Create main window (hidden)
 * 10. Initialize menu, IPC, tray, auto-updater
 * 11. Show main window & close splash
 * 12. Process pending deep links
 * 13. Clean up temporary files
 *
 * @module electron/main
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
export {};
