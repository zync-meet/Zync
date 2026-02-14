/**
 * =============================================================================
 * Electron Environment Type Definitions — ZYNC Desktop Application
 * =============================================================================
 *
 * Ambient type declarations for Electron-specific environment variables,
 * process types, and Node.js global augmentations used throughout the
 * Electron main and preload processes.
 *
 * These declarations ensure TypeScript understands Electron-specific
 * globals that are not part of the standard Node.js typings.
 *
 * @module electron/types/electron-env.d.ts
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/// <reference types="vite/client" />

/**
 * Augment the NodeJS.Process interface with Electron-specific properties.
 *
 * These properties are available in the main process and are used to
 * determine the runtime environment.
 */
declare namespace NodeJS {
    interface Process {
        /**
         * When running in Electron, indicates whether the application was
         * launched as the default application (e.g., from an electron binary
         * in the PATH). This is `true` when running `electron .` during
         * development.
         *
         * @see https://www.electronjs.org/docs/latest/api/process#processdefaultapp-readonly
         */
        defaultApp?: boolean;

        /**
         * Additional Electron version strings available in `process.versions`.
         */
        versions: NodeJS.ProcessVersions & {
            /** Electron version */
            electron: string;
            /** Chrome/Chromium version */
            chrome: string;
        };

        /**
         * The type of Electron process.
         *
         * - `'browser'` — The main process
         * - `'renderer'` — A renderer process
         * - `'worker'` — A web worker in a renderer process
         * - `undefined` — Running in plain Node.js (not Electron)
         */
        type?: 'browser' | 'renderer' | 'worker';

        /**
         * The process's resource directory path.
         *
         * In production, this points to the app.asar archive.
         * In development, this points to the source directory.
         */
        resourcesPath: string;
    }
}

/**
 * Vite environment variables available via `import.meta.env`.
 *
 * These are defined in the Vite configuration and are available at
 * compile time.
 */
interface ImportMetaEnv {
    /** The base URL for the Vite dev server */
    readonly VITE_DEV_SERVER_URL?: string;

    /** The ZYNC API base URL */
    readonly VITE_API_URL?: string;

    /** Firebase API key */
    readonly VITE_FIREBASE_API_KEY?: string;

    /** Firebase Auth domain */
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;

    /** Firebase project ID */
    readonly VITE_FIREBASE_PROJECT_ID?: string;

    /** Firebase storage bucket */
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;

    /** Firebase messaging sender ID */
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;

    /** Firebase app ID */
    readonly VITE_FIREBASE_APP_ID?: string;

    /** Whether the app is in production mode */
    readonly PROD: boolean;

    /** Whether the app is in development mode */
    readonly DEV: boolean;

    /** The mode the app is running in (e.g., 'development', 'production') */
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/**
 * Electron module declarations for files that are loaded at runtime
 * but not available during compilation.
 */
declare module '*.png' {
    const src: string;
    export default src;
}

declare module '*.svg' {
    const src: string;
    export default src;
}

declare module '*.ico' {
    const src: string;
    export default src;
}

declare module '*.icns' {
    const src: string;
    export default src;
}
