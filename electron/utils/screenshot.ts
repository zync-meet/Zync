import { desktopCapturer, BrowserWindow, nativeImage, NativeImage, screen } from 'electron';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { app } from 'electron';
import { randomBytes } from 'crypto';


export type ScreenshotFormat = 'png' | 'jpeg';


export interface ScreenshotOptions {

    format?: ScreenshotFormat;

    quality?: number;

    captureCursor?: boolean;

    outputPath?: string;
}


export interface ScreenshotResult {

    success: boolean;

    image?: NativeImage;

    buffer?: Buffer;

    dataUrl?: string;

    savedPath?: string;

    width?: number;

    height?: number;

    error?: string;
}


export interface ScreenSource {

    id: string;

    name: string;

    type: 'screen' | 'window';

    thumbnail: NativeImage;

    appIcon: NativeImage | null;
}


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


export async function captureScreen(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: getPrimaryScreenSize(),
        });

        if (sources.length === 0) {
            return { success: false, error: 'No screen sources available' };
        }


        const primarySource = sources[0];
        const image = primarySource.thumbnail;

        return processScreenshotResult(image, options);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Screenshot] Failed to capture screen: ${message}`);
        return { success: false, error: message };
    }
}


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


export async function saveScreenshot(
    image: NativeImage,
    outputPath: string,
    format: ScreenshotFormat = 'png',
    quality: number = 90,
): Promise<{ success: boolean; error?: string }> {
    try {

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


export function generateScreenshotFilename(format: ScreenshotFormat = 'png'): string {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[T]/g, '_')
        .replace(/[:.]/g, '-')
        .replace(/Z$/, '');
    return `zync_screenshot_${timestamp}.${format}`;
}


export function getScreenshotDir(): string {
    return join(app.getPath('pictures'), 'ZYNC Screenshots');
}


export async function captureAndSave(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    const format = options?.format ?? 'png';
    const outputPath = options?.outputPath ?? join(
        getScreenshotDir(),
        generateScreenshotFilename(format),
    );

    const result = await captureScreen({ ...options, outputPath });
    return result;
}


function getPrimaryScreenSize(): { width: number; height: number } {
    try {
        const primaryDisplay = screen.getPrimaryDisplay();
        return primaryDisplay.workAreaSize;
    } catch {
        return { width: 1920, height: 1080 };
    }
}


async function processScreenshotResult(
    image: NativeImage,
    options?: ScreenshotOptions,
): Promise<ScreenshotResult> {
    if (image.isEmpty()) {
        return { success: false, error: 'Captured image is empty' };
    }

    const format = options?.format ?? 'png';
    const quality = options?.quality ?? 90;


    let buffer: Buffer;
    if (format === 'jpeg') {
        buffer = image.toJPEG(quality);
    } else {
        buffer = image.toPNG();
    }


    const size = image.getSize();


    const result: ScreenshotResult = {
        success: true,
        image,
        buffer,
        dataUrl: image.toDataURL(),
        width: size.width,
        height: size.height,
    };


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
