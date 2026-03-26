import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({

  test: {

    environment: 'node',

    include: [
      'electron/tests/**/*.test.ts',
      'electron/tests/**/*.spec.ts',
      'electron/**/*.test.ts',
      'electron/**/*.spec.ts',
    ],


    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/build/**',
      '**/coverage/**',
      '**/.git/**',
    ],


    testTimeout: 30000,


    hookTimeout: 30000,


    setupFiles: ['electron/tests/setup.ts'],


    globalSetup: 'electron/tests/global-setup.ts',


    globals: true,





    reporters: ['verbose'],


    outputFile: {
      junit: './test-results/electron-junit.xml',
      json: './test-results/electron-results.json',
    },


    coverage: {

      provider: 'v8',


      enabled: false,


      include: [
        'electron/**/*.ts',
      ],

      exclude: [
        'electron/tests/**',
        'electron/**/*.test.ts',
        'electron/**/*.spec.ts',
        'electron/**/*.d.ts',
        'electron/**/types.ts',
      ],


      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },


      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],


      reportsDirectory: './coverage/electron',





      clean: true,


      skipFull: false,
    },


    mockReset: true,
    restoreMocks: true,
    clearMocks: true,


    snapshotFormat: {
      printBasicPrototype: false,
      escapeString: false,
    },


    isolate: true,


    pool: 'threads',



    sequence: {
      shuffle: false,
      concurrent: false,
    },


    retry: process.env.CI ? 2 : 0,


    bail: process.env.CI ? 1 : 0,
  },


  resolve: {

    alias: {
      '@electron': path.resolve(__dirname, './'),
      '@electron/main': path.resolve(__dirname, './main'),
      '@electron/preload': path.resolve(__dirname, './preload'),
      '@electron/services': path.resolve(__dirname, './services'),
      '@electron/utils': path.resolve(__dirname, './utils'),
      '@electron/config': path.resolve(__dirname, './config'),
      '@electron/interfaces': path.resolve(__dirname, './interfaces'),
      '@electron/tests': path.resolve(__dirname, './tests'),


      'electron': path.resolve(__dirname, './tests/__mocks__/electron.ts'),
    },
  },


  esbuild: {
    target: 'node18',
  },


  define: {
    'import.meta.vitest': 'undefined',
  },
});
