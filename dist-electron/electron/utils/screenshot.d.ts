import { NativeImage } from 'electron';
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
export declare function getScreenSources(): Promise<ScreenSource[]>;
export declare function getDisplaySources(): Promise<ScreenSource[]>;
export declare function captureScreen(options?: ScreenshotOptions): Promise<ScreenshotResult>;
export declare function captureWindow(options?: ScreenshotOptions): Promise<ScreenshotResult>;
export declare function captureRegion(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}, options?: ScreenshotOptions): Promise<ScreenshotResult>;
export declare function saveScreenshot(image: NativeImage, outputPath: string, format?: ScreenshotFormat, quality?: number): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function generateScreenshotFilename(format?: ScreenshotFormat): string;
export declare function getScreenshotDir(): string;
export declare function captureAndSave(options?: ScreenshotOptions): Promise<ScreenshotResult>;
