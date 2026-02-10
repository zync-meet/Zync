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
/**
 * Configuration for global test setup.
 */
declare const CONFIG: {
    /**
     * Root directory for test artifacts.
     */
    testArtifactsDir: string;
    /**
     * Directory for test screenshots.
     */
    screenshotsDir: string;
    /**
     * Directory for test downloads.
     */
    downloadsDir: string;
    /**
     * Directory for test fixtures.
     */
    fixturesDir: string;
    /**
     * Whether to keep test artifacts after tests complete.
     * Set to true for debugging failed tests.
     */
    keepArtifacts: boolean;
    /**
     * Whether to start a mock server for API tests.
     */
    startMockServer: boolean;
    /**
     * Port for the mock server.
     */
    mockServerPort: number;
};
/**
 * Track resources that need to be cleaned up.
 */
interface GlobalState {
    mockServer: unknown | null;
    createdDirs: string[];
    startTime: number;
}
declare const state: GlobalState;
/**
 * Global setup function.
 * This is the default export that Vitest calls before all tests.
 *
 * @returns Teardown function to call after all tests
 */
export default function globalSetup(): Promise<() => Promise<void>>;
export { CONFIG, state };
