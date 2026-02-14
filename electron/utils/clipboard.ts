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

import { clipboard, nativeImage, NativeImage } from 'electron';

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
export function copyText(text: string): ClipboardResult {
    try {
        clipboard.writeText(text);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy text: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Reads plain text from the system clipboard.
 *
 * @returns {string} The clipboard text content, or empty string on failure
 */
export function readText(): string {
    try {
        return clipboard.readText();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read text: ${message}`);
        return '';
    }
}

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
export function copyHTML(html: string, plainTextFallback?: string): ClipboardResult {
    try {
        clipboard.write({
            html,
            text: plainTextFallback ?? stripHTML(html),
        });
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy HTML: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Reads HTML content from the system clipboard.
 *
 * @returns {string} The HTML content, or empty string on failure
 */
export function readHTML(): string {
    try {
        return clipboard.readHTML();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read HTML: ${message}`);
        return '';
    }
}

/**
 * Copies an image to the system clipboard from a NativeImage.
 *
 * @param {NativeImage} image - The image to copy
 * @returns {ClipboardResult} Result of the operation
 */
export function copyImage(image: NativeImage): ClipboardResult {
    try {
        clipboard.writeImage(image);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy image: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Copies an image to the clipboard from a file path on disk.
 *
 * @param {string} imagePath - Path to the image file
 * @returns {ClipboardResult} Result of the operation
 */
export function copyImageFromPath(imagePath: string): ClipboardResult {
    try {
        const image = nativeImage.createFromPath(imagePath);
        if (image.isEmpty()) {
            return { success: false, error: `Image at path ${imagePath} is empty or unreadable` };
        }
        clipboard.writeImage(image);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy image from path: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Reads an image from the system clipboard as a NativeImage.
 *
 * @returns {NativeImage | null} The clipboard image, or null if unavailable
 */
export function readImage(): NativeImage | null {
    try {
        const image = clipboard.readImage();
        return image.isEmpty() ? null : image;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read image: ${message}`);
        return null;
    }
}

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
export function copyLink(url: string, title?: string): ClipboardResult {
    try {
        clipboard.write({
            text: url,
            bookmark: title ?? url,
        });
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy link: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Clears all content from the system clipboard.
 *
 * @returns {ClipboardResult} Result of the operation
 */
export function clearClipboard(): ClipboardResult {
    try {
        clipboard.clear();
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to clear clipboard: ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Checks what content types are available on the clipboard.
 *
 * @returns {ClipboardContentType[]} Array of available content types
 */
export function getAvailableFormats(): ClipboardContentType[] {
    const formats: ClipboardContentType[] = [];

    try {
        const availableFormats = clipboard.availableFormats();

        if (availableFormats.some((f) => f.includes('text/plain'))) {
            formats.push('text');
        }
        if (availableFormats.some((f) => f.includes('text/html'))) {
            formats.push('html');
        }
        if (availableFormats.some((f) => f.includes('text/rtf') || f.includes('RTF'))) {
            formats.push('rtf');
        }
        if (availableFormats.some((f) => f.includes('image'))) {
            formats.push('image');
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to check available formats: ${message}`);
    }

    return formats;
}

/**
 * Checks if the clipboard has text content.
 *
 * @returns {boolean} True if text is available
 */
export function hasText(): boolean {
    try {
        return clipboard.readText().length > 0;
    } catch {
        return false;
    }
}

/**
 * Checks if the clipboard has an image.
 *
 * @returns {boolean} True if an image is available
 */
export function hasImage(): boolean {
    try {
        return !clipboard.readImage().isEmpty();
    } catch {
        return false;
    }
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Strips HTML tags from a string, providing a plain-text fallback.
 *
 * @param {string} html - The HTML string to strip
 * @returns {string} The plain text content
 * @internal
 */
function stripHTML(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}
