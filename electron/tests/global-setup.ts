import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';


const CONFIG = {

  testArtifactsDir: path.join(os.tmpdir(), 'zync-test-artifacts'),


  screenshotsDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'screenshots'),


  downloadsDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'downloads'),


  fixturesDir: path.join(os.tmpdir(), 'zync-test-artifacts', 'fixtures'),


  keepArtifacts: process.env.KEEP_TEST_ARTIFACTS === 'true',


  startMockServer: process.env.USE_MOCK_SERVER === 'true',


  mockServerPort: parseInt(process.env.MOCK_SERVER_PORT || '3333', 10),
};


interface GlobalState {
  mockServer: unknown | null;
  createdDirs: string[];
  startTime: number;
}

const state: GlobalState = {
  mockServer: null,
  createdDirs: [],
  startTime: 0,
};


function createArtifactsDirectories(): void {
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


function setupEnvironment(): void {

  process.env.NODE_ENV = 'test';


  process.env.ZYNC_TEST_ARTIFACTS = CONFIG.testArtifactsDir;
  process.env.ZYNC_TEST_SCREENSHOTS = CONFIG.screenshotsDir;
  process.env.ZYNC_TEST_DOWNLOADS = CONFIG.downloadsDir;
  process.env.ZYNC_TEST_FIXTURES = CONFIG.fixturesDir;


  process.env.ZYNC_TEST_PLATFORM = process.platform;
  process.env.ZYNC_TEST_ARCH = process.arch;

  console.log(`🔧 Environment configured for: ${process.platform} (${process.arch})`);
}


function createFixtures(): void {

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


  const invalidJsonPath = path.join(CONFIG.fixturesDir, 'invalid.json');
  fs.writeFileSync(invalidJsonPath, '{ invalid json }', 'utf-8');


  const emptyFilePath = path.join(CONFIG.fixturesDir, 'empty.txt');
  fs.writeFileSync(emptyFilePath, '', 'utf-8');

  console.log('📦 Test fixtures created');
}


async function startMockServer(): Promise<void> {
  if (!CONFIG.startMockServer) {
    console.log('🔌 Mock server disabled (set USE_MOCK_SERVER=true to enable)');
    return;
  }


  console.log(`🌐 Mock server would start on port ${CONFIG.mockServerPort}`);


  console.log(`🌐 Mock server running on http://localhost:${CONFIG.mockServerPort}`);
}


function logEnvironmentInfo(): void {
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


async function stopMockServer(): Promise<void> {
  if (state.mockServer) {


    state.mockServer = null;
    console.log('🛑 Mock server stopped');
  }
}


function cleanupArtifacts(): void {
  if (CONFIG.keepArtifacts) {
    console.log(`📁 Keeping test artifacts at: ${CONFIG.testArtifactsDir}`);
    return;
  }

  for (const dir of state.createdDirs.reverse()) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up: ${dir}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clean up ${dir}:`, error);
    }
  }
}


function logSummary(): void {
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


export default async function globalSetup(): Promise<() => Promise<void>> {
  state.startTime = Date.now();

  console.log('\n🚀 Starting global test setup...\n');


  logEnvironmentInfo();


  setupEnvironment();
  createArtifactsDirectories();
  createFixtures();
  await startMockServer();

  console.log('\n✅ Global test setup complete!\n');
  console.log('─'.repeat(60) + '\n');


  return async function globalTeardown(): Promise<void> {
    console.log('\n' + '─'.repeat(60));
    console.log('\n🧹 Starting global test teardown...\n');


    await stopMockServer();
    cleanupArtifacts();
    logSummary();

    console.log('✅ Global test teardown complete!\n');
  };
}


export { CONFIG, state };
