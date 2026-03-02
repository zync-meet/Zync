import { clipboard, nativeImage, NativeImage } from 'electron';


export interface ClipboardResult {

    success: boolean;

    error?: string;
}


export type ClipboardContentType = 'text' | 'html' | 'rtf' | 'image' | 'bookmark';


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


export function readText(): string {
    try {
        return clipboard.readText();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read text: ${message}`);
        return '';
    }
}


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


export function readHTML(): string {
    try {
        return clipboard.readHTML();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read HTML: ${message}`);
        return '';
    }
}


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


export function hasText(): boolean {
    try {
        return clipboard.readText().length > 0;
    } catch {
        return false;
    }
}


export function hasImage(): boolean {
    try {
        return !clipboard.readImage().isEmpty();
    } catch {
        return false;
    }
}


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
