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

import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest Configuration for Electron Tests
 *
 * This separate configuration ensures that Electron main process tests
 * run in the correct environment with appropriate mocks and settings.
 */
export default defineConfig({
  // ===========================================================================
  // Test Configuration
  // ===========================================================================

  test: {
    // -------------------------------------------------------------------------
    // Test Environment
    // -------------------------------------------------------------------------
    // Use Node.js environment since Electron main process is Node.js-based.
    // This is different from frontend tests which use jsdom or happy-dom.

    environment: 'node',

    // -------------------------------------------------------------------------
    // Test Files Pattern
    // -------------------------------------------------------------------------
    // Specify which files should be treated as test files.
    // We use multiple patterns to catch different naming conventions.

    include: [
      'electron/tests/**/*.test.ts',
      'electron/tests/**/*.spec.ts',
      'electron/**/*.test.ts',
      'electron/**/*.spec.ts',
    ],

    // -------------------------------------------------------------------------
    // Excluded Patterns
    // -------------------------------------------------------------------------
    // Files and directories to exclude from test discovery.

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/build/**',
      '**/coverage/**',
      '**/.git/**',
    ],

    // -------------------------------------------------------------------------
    // Global Test Timeout
    // -------------------------------------------------------------------------
    // Maximum time in milliseconds for each test to complete.
    // Electron operations can sometimes be slow, so we set a generous timeout.

    testTimeout: 30000,

    // -------------------------------------------------------------------------
    // Hook Timeout
    // -------------------------------------------------------------------------
    // Maximum time for beforeAll, afterAll, beforeEach, afterEach hooks.

    hookTimeout: 30000,

    // -------------------------------------------------------------------------
    // Setup Files
    // -------------------------------------------------------------------------
    // Files to run before each test file. Use for global mocks and setup.

    setupFiles: ['electron/tests/setup.ts'],

    // -------------------------------------------------------------------------
    // Global Setup
    // -------------------------------------------------------------------------
    // File to run once before all test files start.
    // Use for one-time setup like starting services.

    globalSetup: 'electron/tests/global-setup.ts',

    // -------------------------------------------------------------------------
    // Globals
    // -------------------------------------------------------------------------
    // Make test functions (describe, it, expect) available globally.
    // This matches Jest behavior for easier migration.

    globals: true,

    // -------------------------------------------------------------------------
    // Watch Mode Configuration
    // -------------------------------------------------------------------------
    // Configure which files trigger re-runs in watch mode.

    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
    ],

    // -------------------------------------------------------------------------
    // Reporter Configuration
    // -------------------------------------------------------------------------
    // Configure test output format.

    reporters: ['verbose'],

    // -------------------------------------------------------------------------
    // Output File (for CI)
    // -------------------------------------------------------------------------
    // Output test results to a file for CI integration.

    outputFile: {
      junit: './test-results/electron-junit.xml',
      json: './test-results/electron-results.json',
    },

    // -------------------------------------------------------------------------
    // Coverage Configuration
    // -------------------------------------------------------------------------
    // Code coverage settings for the Electron codebase.

    coverage: {
      // Provider to use for coverage instrumentation
      provider: 'v8',

      // Enable coverage collection
      enabled: false,

      // Files to include in coverage
      include: [
        'electron/**/*.ts',
      ],

      // Files to exclude from coverage
      exclude: [
        'electron/tests/**',
        'electron/**/*.test.ts',
        'electron/**/*.spec.ts',
        'electron/**/*.d.ts',
        'electron/**/types.ts',
      ],

      // Coverage thresholds
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },

      // Coverage report formats
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],

      // Output directory for coverage reports
      reportsDirectory: './coverage/electron',

      // Report coverage for files without tests
      all: true,

      // Clean coverage results before running
      clean: true,

      // Skip full coverage report if thresholds not met
      skipFull: false,
    },

    // -------------------------------------------------------------------------
    // Mock Configuration
    // -------------------------------------------------------------------------
    // Configure how mocks are handled.

    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // -------------------------------------------------------------------------
    // Snapshot Configuration
    // -------------------------------------------------------------------------
    // Configure snapshot testing.

    snapshotFormat: {
      printBasicPrototype: false,
      escapeString: false,
    },

    // -------------------------------------------------------------------------
    // Isolation
    // -------------------------------------------------------------------------
    // Run tests in isolated threads for reliability.

    isolate: true,

    // -------------------------------------------------------------------------
    // Pool Configuration
    // -------------------------------------------------------------------------
    // Configure the test runner pool.

    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },

    // -------------------------------------------------------------------------
    // Sequence
    // -------------------------------------------------------------------------
    // Configure test execution order.

    sequence: {
      shuffle: false, // Deterministic order for reproducibility
      concurrent: false, // Run sequentially for Electron tests
    },

    // -------------------------------------------------------------------------
    // Retry On Failure
    // -------------------------------------------------------------------------
    // Retry failed tests (useful for flaky Electron tests).

    retry: process.env.CI ? 2 : 0,

    // -------------------------------------------------------------------------
    // Bail Configuration
    // -------------------------------------------------------------------------
    // Stop on first failure in CI for faster feedback.

    bail: process.env.CI ? 1 : 0,

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------
    // External dependencies configuration.

    deps: {
      // Inline dependencies that should be transformed
      inline: [
        // Add any packages that need to be transformed
      ],
    },
  },

  // ===========================================================================
  // Resolve Configuration
  // ===========================================================================
  // Configure module resolution for tests.

  resolve: {
    // Alias configuration for cleaner imports in tests
    alias: {
      '@electron': path.resolve(__dirname, './'),
      '@electron/main': path.resolve(__dirname, './main'),
      '@electron/preload': path.resolve(__dirname, './preload'),
      '@electron/services': path.resolve(__dirname, './services'),
      '@electron/utils': path.resolve(__dirname, './utils'),
      '@electron/config': path.resolve(__dirname, './config'),
      '@electron/interfaces': path.resolve(__dirname, './interfaces'),
      '@electron/tests': path.resolve(__dirname, './tests'),
      
      // Mock the electron module for testing
      'electron': path.resolve(__dirname, './tests/__mocks__/electron.ts'),
    },
  },

  // ===========================================================================
  // ESBuild Configuration
  // ===========================================================================
  // Configure ESBuild for TypeScript transformation.

  esbuild: {
    target: 'node18',
  },

  // ===========================================================================
  // Define Configuration
  // ===========================================================================
  // Global constants to define for tests.

  define: {
    'import.meta.vitest': 'undefined',
  },
});

// =============================================================================
// Configuration Documentation
// =============================================================================
//
// This configuration is optimized for testing Electron main process code:
//
// 1. **Environment**: Uses Node.js environment (not jsdom) since main process
//    runs in Node.js, not a browser context.
//
// 2. **Mocking**: Electron APIs are mocked since they require a real Electron
//    runtime. See `electron/tests/__mocks__/electron.ts` for mocks.
//
// 3. **Isolation**: Tests run in separate threads to prevent interference
//    between tests that modify global state.
//
// 4. **Coverage**: Configured to collect coverage for all Electron code,
//    with reasonable thresholds for a desktop application.
//
// 5. **CI Integration**: Special settings for CI (retry, bail, etc.) to
//    handle the different requirements of CI environments.
//
// =============================================================================
// Adding New Tests
// =============================================================================
//
// 1. Create test file in `electron/tests/unit/` or `electron/tests/integration/`
// 2. Name it `*.test.ts` or `*.spec.ts`
// 3. Import mocks from `electron/tests/__mocks__/`
// 4. Use helpers from `electron/tests/helpers/`
//
// =============================================================================
//
// Last Updated: 2026-02-10
// Maintained by: ZYNC Electron Team
//
// =============================================================================
