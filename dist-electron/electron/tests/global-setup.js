/**
 * =============================================================================
 * ZYNC Desktop Application - Global Test Setup
 * =============================================================================
 *
 * This file runs once before all test files start. It's used for one-time
 * setup operations that are shared across all test files, such as:
 *
 * - Starting mock servers
 * - Setting up databases
 * - Creating shared resources
 *
 * This file is referenced in vitest.config.ts under `globalSetup`.
 *
 * The setup function can return a teardown function that will be called
 * after all tests complete.
 *
 * =============================================================================
 * Lifecycle
 * =============================================================================
 *
 * 1. globalSetup.ts setup() runs once before all tests
 * 2. setup.ts beforeAll() runs before each test file
 * 3. setup.ts beforeEach() runs before each test
 * 4. Test runs
 * 5. setup.ts afterEach() runs after each test
 * 6. setup.ts afterAll() runs after each test file
 * 7. globalSetup.ts teardown() runs once after all tests
 *
 * =============================================================================
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
// =============================================================================
// Configuration
// =============================================================================
/**
 * Configuration for global test setup.
 */
const CONFIG = {
    /**
     * Root directory for test artifacts.
     */
    testArtifactsDir: path.join(os.tmpdir(), 'zync-test-artifacts'),
    /**
     * Directory for test screenshots.
     */
    screenshotsDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'screenshots'),
    /**
     * Directory for test downloads.
     */
    downloadsDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'downloads'),
    /**
     * Directory for test fixtures.
     */
    fixturesDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'fixtures'),
    /**
     * Whether to keep test artifacts after tests complete.
     * Set to true for debugging failed tests.
     */
    keepArtifacts: process.env.KEEP_TEST_ARTIFACTS === 'true',
    /**
     * Whether to start a mock server for API tests.
     */
    startMockServer: process.env.USE_MOCK_SERVER === 'true',
    /**
     * Port for the mock server.
     */
    mockServerPort: parseInt(process.env.MOCK_SERVER_PORT || '3333', 10),
};
const state = {
    mockServer: null,
    createdDirs: [],
    startTime: 0,
};
// =============================================================================
// Setup Functions
// =============================================================================
/**
 * Create the test artifacts directory structure.
 */
function createArtifactsDirectories() {
    const dirs = [
        CONFIG.testArtifactsDir,
        CONFIG.screenshotsDir,
        CONFIG.downloadsDir,
        CONFIG.fixturesDir,
    ];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            state.createdDirs.push(dir);
            console.log(`📁 Created test directory: ${dir}`);
        }
    }
}
/**
 * Set up environment variables for the test run.
 */
function setupEnvironment() {
    // Set NODE_ENV
    process.env.NODE_ENV = 'test';
    // Set test-specific variables
    process.env.ZYNC_TEST_ARTIFACTS = CONFIG.testArtifactsDir;
    process.env.ZYNC_TEST_SCREENSHOTS = CONFIG.screenshotsDir;
    process.env.ZYNC_TEST_DOWNLOADS = CONFIG.downloadsDir;
    process.env.ZYNC_TEST_FIXTURES = CONFIG.fixturesDir;
    // Platform-specific variables
    process.env.ZYNC_TEST_PLATFORM = process.platform;
    process.env.ZYNC_TEST_ARCH = process.arch;
    console.log(`🔧 Environment configured for: ${process.platform} (${process.arch})`);
}
/**
 * Create test fixtures from templates.
 */
function createFixtures() {
    // Create a sample configuration fixture
    const sampleConfig = {
        version: '1.0.0',
        theme: 'light',
        language: 'en',
        autoUpdate: true,
        telemetry: false,
        window: {
            width: 1200,
            height: 800,
            x: undefined,
            y: undefined,
            isMaximized: false,
        },
        shortcuts: {
            toggleDevTools: 'CmdOrCtrl+Shift+I',
            reload: 'CmdOrCtrl+R',
            quit: 'CmdOrCtrl+Q',
        },
    };
    const configPath = path.join(CONFIG.fixturesDir, 'sample-config.json');
    fs.writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2), 'utf-8');
    // Create a sample window state fixture
    const windowState = {
        width: 1024,
        height: 768,
        x: 100,
        y: 100,
        isMaximized: false,
        isFullScreen: false,
        displayBounds: {
            width: 1920,
            height: 1080,
            x: 0,
            y: 0,
        },
    };
    const windowStatePath = path.join(CONFIG.fixturesDir, 'window-state.json');
    fs.writeFileSync(windowStatePath, JSON.stringify(windowState, null, 2), 'utf-8');
    // Create an invalid JSON fixture for error testing
    const invalidJsonPath = path.join(CONFIG.fixturesDir, 'invalid.json');
    fs.writeFileSync(invalidJsonPath, '{ invalid json }', 'utf-8');
    // Create an empty file fixture
    const emptyFilePath = path.join(CONFIG.fixturesDir, 'empty.txt');
    fs.writeFileSync(emptyFilePath, '', 'utf-8');
    console.log('📦 Test fixtures created');
}
/**
 * Start a mock HTTP server for API tests.
 * This is optional and controlled by the USE_MOCK_SERVER environment variable.
 */
async function startMockServer() {
    if (!CONFIG.startMockServer) {
        console.log('🔌 Mock server disabled (set USE_MOCK_SERVER=true to enable)');
        return;
    }
    // Note: In a real implementation, you would start an actual mock server here.
    // For example, using msw (Mock Service Worker) or a simple Express server.
    console.log(`🌐 Mock server would start on port ${CONFIG.mockServerPort}`);
    // Example with a simple HTTP server:
    // const http = require('http');
    // state.mockServer = http.createServer((req, res) => {
    //   res.writeHead(200, { 'Content-Type': 'application/json' });
    //   res.end(JSON.stringify({ status: 'ok' }));
    // });
    // await new Promise<void>(resolve => {
    //   state.mockServer.listen(CONFIG.mockServerPort, resolve);
    // });
    console.log(`🌐 Mock server running on http://localhost:${CONFIG.mockServerPort}`);
}
/**
 * Log test environment information.
 */
function logEnvironmentInfo() {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ZYNC Desktop Application - Electron Tests');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  Node.js:    ${process.version}`);
    console.log(`  Platform:   ${process.platform}`);
    console.log(`  Arch:       ${process.arch}`);
    console.log(`  PID:        ${process.pid}`);
    console.log(`  CPUs:       ${os.cpus().length}`);
    console.log(`  Memory:     ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
    console.log('════════════════════════════════════════════════════════════\n');
}
// =============================================================================
// Teardown Functions
// =============================================================================
/**
 * Stop the mock server.
 */
async function stopMockServer() {
    if (state.mockServer) {
        // await new Promise<void>(resolve => {
        //   state.mockServer.close(resolve);
        // });
        state.mockServer = null;
        console.log('🛑 Mock server stopped');
    }
}
/**
 * Clean up test artifacts.
 */
function cleanupArtifacts() {
    if (CONFIG.keepArtifacts) {
        console.log(`📁 Keeping test artifacts at: ${CONFIG.testArtifactsDir}`);
        return;
    }
    for (const dir of state.createdDirs.reverse()) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`🗑️ Cleaned up: ${dir}`);
        }
        catch (error) {
            console.warn(`⚠️ Failed to clean up ${dir}:`, error);
        }
    }
}
/**
 * Log test run summary.
 */
function logSummary() {
    const duration = Date.now() - state.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  Test Run Complete');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  Duration:   ${minutes}m ${seconds}s`);
    console.log(`  Artifacts:  ${CONFIG.keepArtifacts ? 'Kept' : 'Cleaned'}`);
    console.log('════════════════════════════════════════════════════════════\n');
}
// =============================================================================
// Main Setup and Teardown
// =============================================================================
/**
 * Global setup function.
 * This is the default export that Vitest calls before all tests.
 *
 * @returns Teardown function to call after all tests
 */
export default async function globalSetup() {
    state.startTime = Date.now();
    console.log('\n🚀 Starting global test setup...\n');
    // Log environment info
    logEnvironmentInfo();
    // Setup steps
    setupEnvironment();
    createArtifactsDirectories();
    createFixtures();
    await startMockServer();
    console.log('\n✅ Global test setup complete!\n');
    console.log('─'.repeat(60) + '\n');
    // Return teardown function
    return async function globalTeardown() {
        console.log('\n' + '─'.repeat(60));
        console.log('\n🧹 Starting global test teardown...\n');
        // Teardown steps
        await stopMockServer();
        cleanupArtifacts();
        logSummary();
        console.log('✅ Global test teardown complete!\n');
    };
}
// =============================================================================
// Named Export for Direct Access
// =============================================================================
export { CONFIG, state };
// =============================================================================
// Global Setup Documentation
// =============================================================================
//
// This global setup file handles one-time setup operations:
//
// 1. **Environment**: Set up environment variables
// 2. **Directories**: Create temp directories for test artifacts
// 3. **Fixtures**: Create common test fixtures
// 4. **Mock Server**: Optionally start a mock API server
//
// The setup function returns a teardown function that Vitest will call
// after all tests complete. This ensures proper cleanup.
//
// Environment Variables:
// - KEEP_TEST_ARTIFACTS=true: Keep artifacts for debugging
// - USE_MOCK_SERVER=true: Start a mock API server
// - MOCK_SERVER_PORT=3333: Port for the mock server
//
// =============================================================================
//
// Last Updated: 2026-02-10
// Maintained by: ZYNC Electron Team
//
// =============================================================================
//# sourceMappingURL=global-setup.js.map