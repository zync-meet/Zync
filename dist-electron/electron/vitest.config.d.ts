/**
 * =============================================================================
 * ZYNC Desktop Application - Vitest Configuration for Electron Tests
 * =============================================================================
 *
 * This configuration file sets up Vitest for testing the Electron main process,
 * preload scripts, and related utilities. It's separate from the main frontend
 * test configuration to handle Electron-specific testing needs.
 *
 * Key Features:
 * - Node.js environment for main process tests
 * - Custom module resolution for Electron mocks
 * - Coverage reporting for Electron code
 * - Proper handling of TypeScript paths
 *
 * Documentation: https://vitest.dev/config/
 *
 * =============================================================================
 * Usage
 * =============================================================================
 *
 * Run Electron tests:
 *   npm run test:electron
 *   npm run test:electron:watch
 *   npm run test:electron:coverage
 *
 * Run specific test file:
 *   npx vitest electron/tests/unit/menu.test.ts
 *
 * Run tests matching pattern:
 *   npx vitest --config electron/vitest.config.ts -t "menu"
 *
 * =============================================================================
 */
/**
 * Vitest Configuration for Electron Tests
 *
 * This separate configuration ensures that Electron main process tests
 * run in the correct environment with appropriate mocks and settings.
 */
declare const _default: any;
export default _default;
