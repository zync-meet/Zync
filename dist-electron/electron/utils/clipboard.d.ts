import { NativeImage } from 'electron';
export interface ClipboardResult {
    success: boolean;
    error?: string;
}
export type ClipboardContentType = 'text' | 'html' | 'rtf' | 'image' | 'bookmark';
export declare function copyText(text: string): ClipboardResult;
export declare function readText(): string;
export declare function copyHTML(html: string, plainTextFallback?: string): ClipboardResult;
export declare function readHTML(): string;
export declare function copyImage(image: NativeImage): ClipboardResult;
export declare function copyImageFromPath(imagePath: string): ClipboardResult;
export declare function readImage(): NativeImage | null;
export declare function copyLink(url: string, title?: string): ClipboardResult;
export declare function clearClipboard(): ClipboardResult;
export declare function getAvailableFormats(): ClipboardContentType[];
export declare function hasText(): boolean;
export declare function hasImage(): boolean;
