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

import { desktopCapturer, BrowserWindow, nativeImage, NativeImage, screen } from 'electron';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { app } from 'electron';
import { randomBytes } from 'crypto';

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

// =============================================================================
// Screen Source Discovery
// =============================================================================

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
export async function getScreenSources(): Promise<ScreenSource[]> {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 300, height: 200 },
            fetchWindowIcons: true,
        });

        return sources.map((source) => ({
            id: source.id,
            name: source.name,
            type: source.id.startsWith('screen:') ? 'screen' as const : 'window' as const,
            thumbnail: source.thumbnail,
            appIcon: source.appIcon ?? null,
        }));
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to get screen sources: ${message}`);
        return [];
    }
}

/**
 * Lists only screen/display sources.
 *
 * @returns {Promise<ScreenSource[]>} Array of screen sources
 */
export async function getDisplaySources(): Promise<ScreenSource[]> {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 300, height: 200 },
        });

        return sources.map((source) => ({
            id: source.id,
            name: source.name,
            type: 'screen' as const,
            thumbnail: source.thumbnail,
            appIcon: null,
        }));
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to get display sources: ${message}`);
        return [];
    }
}

// =============================================================================
// Screenshot Capture
// =============================================================================

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
export async function captureScreen(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: getPrimaryScreenSize(),
        });

        if (sources.length === 0) {
            return { success: false, error: 'No screen sources available' };
        }

        // Use primary display source
        const primarySource = sources[0];
        const image = primarySource.thumbnail;

        return processScreenshotResult(image, options);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to capture screen: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Captures a screenshot of the currently focused ZYNC window.
 *
 * @param {ScreenshotOptions} [options] - Screenshot options
 * @returns {Promise<ScreenshotResult>} The captured screenshot
 */
export async function captureWindow(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
            return { success: false, error: 'No focused window' };
        }

        const image = await focusedWindow.webContents.capturePage();
        return processScreenshotResult(image, options);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to capture window: ${message}`);
        return { success: false, error: message };
    }
}

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
export async function captureRegion(
    rect: { x: number; y: number; width: number; height: number },
    options?: ScreenshotOptions,
): Promise<ScreenshotResult> {
    try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
            return { success: false, error: 'No focused window' };
        }

        const image = await focusedWindow.webContents.capturePage(rect);
        return processScreenshotResult(image, options);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to capture region: ${message}`);
        return { success: false, error: message };
    }
}

// =============================================================================
// Screenshot Saving
// =============================================================================

/**
 * Saves a NativeImage to disk.
 *
 * @param {NativeImage} image - The image to save
 * @param {string} outputPath - Where to save the image
 * @param {ScreenshotFormat} [format='png'] - Output format
 * @param {number} [quality=90] - JPEG quality (0-100)
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function saveScreenshot(
    image: NativeImage,
    outputPath: string,
    format: ScreenshotFormat = 'png',
    quality: number = 90,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Ensure output directory exists
        await fs.mkdir(dirname(outputPath), { recursive: true });

        let buffer: Buffer;
        if (format === 'jpeg') {
            buffer = image.toJPEG(quality);
        } else {
            buffer = image.toPNG();
        }

        await fs.writeFile(outputPath, buffer);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to save screenshot: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Generates a default screenshot filename based on the current timestamp.
 *
 * @param {ScreenshotFormat} [format='png'] - File format extension
 * @returns {string} Filename like 'zync_screenshot_2024-01-15_14-30-45.png'
 */
export function generateScreenshotFilename(format: ScreenshotFormat = 'png'): string {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[T]/g, '_')
        .replace(/[:.]/g, '-')
        .replace(/Z$/, '');
    return `zync_screenshot_${timestamp}.${format}`;
}

/**
 * Returns the default screenshot save directory.
 *
 * Uses the user's Pictures directory with a 'ZYNC Screenshots' subfolder.
 *
 * @returns {string} Absolute path to the screenshots directory
 */
export function getScreenshotDir(): string {
    return join(app.getPath('pictures'), 'ZYNC Screenshots');
}

/**
 * Captures a screenshot and saves it to the default screenshots directory.
 *
 * A convenience function combining `captureScreen()` with auto-save.
 *
 * @param {ScreenshotOptions} [options] - Capture options
 * @returns {Promise<ScreenshotResult>} Result with saved path
 */
export async function captureAndSave(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    const format = options?.format ?? 'png';
    const outputPath = options?.outputPath ?? join(
        getScreenshotDir(),
        generateScreenshotFilename(format),
    );

    const result = await captureScreen({ ...options, outputPath });
    return result;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Gets the primary screen size for thumbnail capture.
 *
 * @returns {{ width: number; height: number }} Screen dimensions
 * @internal
 */
function getPrimaryScreenSize(): { width: number; height: number } {
    try {
        const primaryDisplay = screen.getPrimaryDisplay();
        return primaryDisplay.workAreaSize;
    } catch {
        return { width: 1920, height: 1080 };
    }
}

/**
 * Processes a raw NativeImage into a ScreenshotResult.
 *
 * Handles format conversion, saving, and metadata extraction.
 *
 * @param {NativeImage} image - The raw captured image
 * @param {ScreenshotOptions} [options] - Processing options
 * @returns {Promise<ScreenshotResult>} The processed result
 * @internal
 */
async function processScreenshotResult(
    image: NativeImage,
    options?: ScreenshotOptions,
): Promise<ScreenshotResult> {
    if (image.isEmpty()) {
        return { success: false, error: 'Captured image is empty' };
    }

    const format = options?.format ?? 'png';
    const quality = options?.quality ?? 90;

    // Get buffer
    let buffer: Buffer;
    if (format === 'jpeg') {
        buffer = image.toJPEG(quality);
    } else {
        buffer = image.toPNG();
    }

    // Get dimensions
    const size = image.getSize();

    // Build result
    const result: ScreenshotResult = {
        success: true,
        image,
        buffer,
        dataUrl: image.toDataURL(),
        width: size.width,
        height: size.height,
    };

    // Save to disk if path provided
    if (options?.outputPath) {
        const saveResult = await saveScreenshot(image, options.outputPath, format, quality);
        if (saveResult.success) {
            result.savedPath = options.outputPath;
        } else {
            console.warn(`[Screenshot] Capture succeeded but save failed: ${saveResult.error}`);
        }
    }

    return result;
}
