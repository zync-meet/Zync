import { clipboard, nativeImage } from 'electron';
export function copyText(text) {
    try {
        clipboard.writeText(text);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy text: ${message}`);
        return { success: false, error: message };
    }
}
export function readText() {
    try {
        return clipboard.readText();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read text: ${message}`);
        return '';
    }
}
export function copyHTML(html, plainTextFallback) {
    try {
        clipboard.write({
            html,
            text: plainTextFallback ?? stripHTML(html),
        });
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy HTML: ${message}`);
        return { success: false, error: message };
    }
}
export function readHTML() {
    try {
        return clipboard.readHTML();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read HTML: ${message}`);
        return '';
    }
}
export function copyImage(image) {
    try {
        clipboard.writeImage(image);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy image: ${message}`);
        return { success: false, error: message };
    }
}
export function copyImageFromPath(imagePath) {
    try {
        const image = nativeImage.createFromPath(imagePath);
        if (image.isEmpty()) {
            return { success: false, error: `Image at path ${imagePath} is empty or unreadable` };
        }
        clipboard.writeImage(image);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy image from path: ${message}`);
        return { success: false, error: message };
    }
}
export function readImage() {
    try {
        const image = clipboard.readImage();
        return image.isEmpty() ? null : image;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to read image: ${message}`);
        return null;
    }
}
export function copyLink(url, title) {
    try {
        clipboard.write({
            text: url,
            bookmark: title ?? url,
        });
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to copy link: ${message}`);
        return { success: false, error: message };
    }
}
export function clearClipboard() {
    try {
        clipboard.clear();
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to clear clipboard: ${message}`);
        return { success: false, error: message };
    }
}
export function getAvailableFormats() {
    const formats = [];
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Clipboard] Failed to check available formats: ${message}`);
    }
    return formats;
}
export function hasText() {
    try {
        return clipboard.readText().length > 0;
    }
    catch {
        return false;
    }
}
export function hasImage() {
    try {
        return !clipboard.readImage().isEmpty();
    }
    catch {
        return false;
    }
}
function stripHTML(html) {
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
//# sourceMappingURL=clipboard.js.map