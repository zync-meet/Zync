/**
 * =============================================================================
 * Clipboard Utilities — ZYNC Desktop Application
 * =============================================================================
 *
 * Provides a safe, typed wrapper around Electron's clipboard module with
 * additional convenience methods for common clipboard operations in the
 * ZYNC application (copying links, formatted text, images, etc.).
 *
 * All operations are synchronous (matching Electron's clipboard API) but
 * wrapped to catch and log errors gracefully.
 *
 * @module electron/utils/clipboard
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { NativeImage } from 'electron';
/**
 * Result of a clipboard operation.
 *
 * @interface ClipboardResult
 */
export interface ClipboardResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Error message if the operation failed */
    error?: string;
}
/**
 * Clipboard content types that ZYNC supports reading/writing.
 *
 * @type ClipboardContentType
 */
export type ClipboardContentType = 'text' | 'html' | 'rtf' | 'image' | 'bookmark';
/**
 * Copies plain text to the system clipboard.
 *
 * @param {string} text - The text to copy
 * @returns {ClipboardResult} Result of the operation
 *
 * @example
 * ```typescript
 * const result = copyText('Hello, ZYNC!');
 * if (result.success) {
 *   console.log('Copied successfully');
 * }
 * ```
 */
export declare function copyText(text: string): ClipboardResult;
/**
 * Reads plain text from the system clipboard.
 *
 * @returns {string} The clipboard text content, or empty string on failure
 */
export declare function readText(): string;
/**
 * Copies HTML content to the system clipboard.
 *
 * Also writes a plain-text fallback so paste targets that don't support
 * HTML will receive the markup stripped of tags.
 *
 * @param {string} html - The HTML content to copy
 * @param {string} [plainTextFallback] - Optional plain text fallback
 * @returns {ClipboardResult} Result of the operation
 */
export declare function copyHTML(html: string, plainTextFallback?: string): ClipboardResult;
/**
 * Reads HTML content from the system clipboard.
 *
 * @returns {string} The HTML content, or empty string on failure
 */
export declare function readHTML(): string;
/**
 * Copies an image to the system clipboard from a NativeImage.
 *
 * @param {NativeImage} image - The image to copy
 * @returns {ClipboardResult} Result of the operation
 */
export declare function copyImage(image: NativeImage): ClipboardResult;
/**
 * Copies an image to the clipboard from a file path on disk.
 *
 * @param {string} imagePath - Path to the image file
 * @returns {ClipboardResult} Result of the operation
 */
export declare function copyImageFromPath(imagePath: string): ClipboardResult;
/**
 * Reads an image from the system clipboard as a NativeImage.
 *
 * @returns {NativeImage | null} The clipboard image, or null if unavailable
 */
export declare function readImage(): NativeImage | null;
/**
 * Copies a URL as both a bookmark and plain text.
 *
 * This is especially useful for link-sharing features in ZYNC — the URL
 * is available as a clickable bookmark in applications that support it,
 * and as plain text elsewhere.
 *
 * @param {string} url - The URL to copy
 * @param {string} [title] - The bookmark title
 * @returns {ClipboardResult} Result of the operation
 */
export declare function copyLink(url: string, title?: string): ClipboardResult;
/**
 * Clears all content from the system clipboard.
 *
 * @returns {ClipboardResult} Result of the operation
 */
export declare function clearClipboard(): ClipboardResult;
/**
 * Checks what content types are available on the clipboard.
 *
 * @returns {ClipboardContentType[]} Array of available content types
 */
export declare function getAvailableFormats(): ClipboardContentType[];
/**
 * Checks if the clipboard has text content.
 *
 * @returns {boolean} True if text is available
 */
export declare function hasText(): boolean;
/**
 * Checks if the clipboard has an image.
 *
 * @returns {boolean} True if an image is available
 */
export declare function hasImage(): boolean;
