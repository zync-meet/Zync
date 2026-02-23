/**
 * =============================================================================
 * Screenshot Utilities — ZYNC Desktop Application
 * =============================================================================
 *
 * Provides screen capture capabilities for the ZYNC desktop application.
 * Supports capturing the full screen, individual windows, and user-selected
 * regions. Screenshots can be saved to disk or returned as buffers for
 * inline display.
 *
 * Uses Electron's `desktopCapturer` API for screen capture and `nativeImage`
 * for image processing.
 *
 * @module electron/utils/screenshot
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { NativeImage } from 'electron';
/**
 * Supported screenshot output formats.
 *
 * @type ScreenshotFormat
 */
export type ScreenshotFormat = 'png' | 'jpeg';
/**
 * Options for taking a screenshot.
 *
 * @interface ScreenshotOptions
 */
export interface ScreenshotOptions {
    /** Output format (default: 'png') */
    format?: ScreenshotFormat;
    /** JPEG quality from 0-100 (default: 90, only applies to JPEG) */
    quality?: number;
    /** Whether to capture the cursor */
    captureCursor?: boolean;
    /** Optional output path. If not provided, returns buffer only */
    outputPath?: string;
}
/**
 * Result of a screenshot operation.
 *
 * @interface ScreenshotResult
 */
export interface ScreenshotResult {
    /** Whether the capture succeeded */
    success: boolean;
    /** The captured image */
    image?: NativeImage;
    /** The image as a PNG buffer */
    buffer?: Buffer;
    /** The image as a base64 data URL */
    dataUrl?: string;
    /** Path where the image was saved (if outputPath was provided) */
    savedPath?: string;
    /** Image width in pixels */
    width?: number;
    /** Image height in pixels */
    height?: number;
    /** Error message if capture failed */
    error?: string;
}
/**
 * Information about an available screen source.
 *
 * @interface ScreenSource
 */
export interface ScreenSource {
    /** Unique ID of the source */
    id: string;
    /** Display name of the source */
    name: string;
    /** Type of source ('screen' or 'window') */
    type: 'screen' | 'window';
    /** Thumbnail of the source */
    thumbnail: NativeImage;
    /** Application icon (for window sources) */
    appIcon: NativeImage | null;
}
/**
 * Lists all available screen sources (displays and windows).
 *
 * @returns {Promise<ScreenSource[]>} Array of available sources
 *
 * @example
 * ```typescript
 * const sources = await getScreenSources();
 * for (const source of sources) {
 *   console.log(`${source.type}: ${source.name}`);
 * }
 * ```
 */
export declare function getScreenSources(): Promise<ScreenSource[]>;
/**
 * Lists only screen/display sources.
 *
 * @returns {Promise<ScreenSource[]>} Array of screen sources
 */
export declare function getDisplaySources(): Promise<ScreenSource[]>;
/**
 * Captures a screenshot of the primary display.
 *
 * Uses the primary screen's desktopCapturer source to capture the full
 * screen content.
 *
 * @param {ScreenshotOptions} [options] - Screenshot options
 * @returns {Promise<ScreenshotResult>} The captured screenshot
 *
 * @example
 * ```typescript
 * const result = await captureScreen();
 * if (result.success && result.buffer) {
 *   await fs.writeFile('screenshot.png', result.buffer);
 * }
 * ```
 */
export declare function captureScreen(options?: ScreenshotOptions): Promise<ScreenshotResult>;
/**
 * Captures a screenshot of the currently focused ZYNC window.
 *
 * @param {ScreenshotOptions} [options] - Screenshot options
 * @returns {Promise<ScreenshotResult>} The captured screenshot
 */
export declare function captureWindow(options?: ScreenshotOptions): Promise<ScreenshotResult>;
/**
 * Captures a specific region of the currently focused window.
 *
 * @param {object} rect - The region to capture
 * @param {number} rect.x - X coordinate
 * @param {number} rect.y - Y coordinate
 * @param {number} rect.width - Width of the region
 * @param {number} rect.height - Height of the region
 * @param {ScreenshotOptions} [options] - Screenshot options
 * @returns {Promise<ScreenshotResult>} The captured screenshot
 */
export declare function captureRegion(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}, options?: ScreenshotOptions): Promise<ScreenshotResult>;
/**
 * Saves a NativeImage to disk.
 *
 * @param {NativeImage} image - The image to save
 * @param {string} outputPath - Where to save the image
 * @param {ScreenshotFormat} [format='png'] - Output format
 * @param {number} [quality=90] - JPEG quality (0-100)
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export declare function saveScreenshot(image: NativeImage, outputPath: string, format?: ScreenshotFormat, quality?: number): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Generates a default screenshot filename based on the current timestamp.
 *
 * @param {ScreenshotFormat} [format='png'] - File format extension
 * @returns {string} Filename like 'zync_screenshot_2024-01-15_14-30-45.png'
 */
export declare function generateScreenshotFilename(format?: ScreenshotFormat): string;
/**
 * Returns the default screenshot save directory.
 *
 * Uses the user's Pictures directory with a 'ZYNC Screenshots' subfolder.
 *
 * @returns {string} Absolute path to the screenshots directory
 */
export declare function getScreenshotDir(): string;
/**
 * Captures a screenshot and saves it to the default screenshots directory.
 *
 * A convenience function combining `captureScreen()` with auto-save.
 *
 * @param {ScreenshotOptions} [options] - Capture options
 * @returns {Promise<ScreenshotResult>} Result with saved path
 */
export declare function captureAndSave(options?: ScreenshotOptions): Promise<ScreenshotResult>;
