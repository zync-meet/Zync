import { promises as fs, constants as fsConstants } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { app } from 'electron';
import { randomBytes } from 'crypto';


export interface FileOperationResult<T = void> {

    success: boolean;

    data?: T;

    error?: string;
}


export interface FileInfo {

    name: string;

    path: string;

    size: number;

    isDirectory: boolean;

    isFile: boolean;

    extension: string;

    modifiedAt: Date;

    createdAt: Date;
}


export async function ensureDirectory(dirPath: string): Promise<FileOperationResult> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to ensure directory ${dirPath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function listDirectory(
    dirPath: string,
    options?: {
        filesOnly?: boolean;
        directoriesOnly?: boolean;
        extensions?: string[];
    },
): Promise<FileOperationResult<FileInfo[]>> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const results: FileInfo[] = [];

        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);

            const info: FileInfo = {
                name: entry.name,
                path: fullPath,
                size: stats.size,
                isDirectory: entry.isDirectory(),
                isFile: entry.isFile(),
                extension: entry.isFile() ? extname(entry.name) : '',
                modifiedAt: stats.mtime,
                createdAt: stats.birthtime,
            };


            if (options?.filesOnly && !info.isFile) continue;
            if (options?.directoriesOnly && !info.isDirectory) continue;
            if (options?.extensions && info.isFile) {
                if (!options.extensions.includes(info.extension)) continue;
            }

            results.push(info);
        }

        return { success: true, data: results };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to list directory ${dirPath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);

            if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
            } else if (entry.isDirectory()) {
                totalSize += await getDirectorySize(fullPath);
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Error calculating directory size for ${dirPath}: ${message}`);
    }

    return totalSize;
}


export async function readTextFile(filePath: string): Promise<FileOperationResult<string>> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function readBinaryFile(filePath: string): Promise<FileOperationResult<Buffer>> {
    try {
        const data = await fs.readFile(filePath);
        return { success: true, data };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read binary file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function writeTextFileAtomic(
    filePath: string,
    content: string,
): Promise<FileOperationResult> {
    const tmpPath = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;

    try {

        await fs.mkdir(dirname(filePath), { recursive: true });


        await fs.writeFile(tmpPath, content, 'utf-8');


        await fs.rename(tmpPath, filePath);

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write file atomically ${filePath}: ${message}`);


        try {
            await fs.unlink(tmpPath);
        } catch {

        }

        return { success: false, error: message };
    }
}


export async function writeBinaryFile(
    filePath: string,
    data: Buffer | Uint8Array,
): Promise<FileOperationResult> {
    try {
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, data);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write binary file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function readJSONFile<T>(filePath: string): Promise<FileOperationResult<T>> {
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(raw) as T;
        return { success: true, data };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read JSON file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function writeJSONFile<T>(
    filePath: string,
    data: T,
    pretty: boolean = true,
): Promise<FileOperationResult> {
    try {
        const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return await writeTextFileAtomic(filePath, content + '\n');
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write JSON file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function pathExists(path: string): Promise<boolean> {
    try {
        await fs.access(path, fsConstants.F_OK);
        return true;
    } catch {
        return false;
    }
}


export async function isReadable(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fsConstants.R_OK);
        return true;
    } catch {
        return false;
    }
}


export async function isWritable(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fsConstants.W_OK);
        return true;
    } catch {
        return false;
    }
}


export async function getFileInfo(filePath: string): Promise<FileOperationResult<FileInfo>> {
    try {
        const stats = await fs.stat(filePath);
        return {
            success: true,
            data: {
                name: basename(filePath),
                path: filePath,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                extension: extname(filePath),
                modifiedAt: stats.mtime,
                createdAt: stats.birthtime,
            },
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to get file info for ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function safeDelete(filePath: string): Promise<FileOperationResult> {
    try {
        await fs.unlink(filePath);
        return { success: true };
    } catch (err: unknown) {
        if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {

            return { success: true };
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to delete file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}


export async function copyFile(
    source: string,
    destination: string,
): Promise<FileOperationResult> {
    try {
        await fs.mkdir(dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to copy ${source} to ${destination}: ${message}`);
        return { success: false, error: message };
    }
}


export async function moveFile(
    source: string,
    destination: string,
): Promise<FileOperationResult> {
    try {
        await fs.mkdir(dirname(destination), { recursive: true });
        await fs.rename(source, destination);
        return { success: true };
    } catch (err: unknown) {

        if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EXDEV') {
            const copyResult = await copyFile(source, destination);
            if (!copyResult.success) return copyResult;
            return await safeDelete(source);
        }

        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to move ${source} to ${destination}: ${message}`);
        return { success: false, error: message };
    }
}


export function getTempDir(): string {
    return join(app.getPath('temp'), 'zync');
}


export async function createTempFile(
    content: string,
    extension: string = '.tmp',
): Promise<FileOperationResult<string>> {
    const tempDir = getTempDir();
    const fileName = `zync_${Date.now()}_${randomBytes(4).toString('hex')}${extension}`;
    const tempPath = join(tempDir, fileName);

    try {
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(tempPath, content, 'utf-8');
        return { success: true, data: tempPath };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to create temp file: ${message}`);
        return { success: false, error: message };
    }
}


export async function cleanupTempFiles(maxAgeMs: number = 86400000): Promise<number> {
    const tempDir = getTempDir();
    let deleted = 0;

    try {
        const exists = await pathExists(tempDir);
        if (!exists) return 0;

        const entries = await fs.readdir(tempDir, { withFileTypes: true });
        const now = Date.now();

        for (const entry of entries) {
            if (!entry.isFile()) continue;

            const filePath = join(tempDir, entry.name);
            try {
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > maxAgeMs) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            } catch {

            }
        }

        console.info(`[FS] Cleaned up ${deleted} temporary files`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to clean up temp files: ${message}`);
    }

    return deleted;
}


export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 0) return '-' + formatBytes(-bytes, decimals);

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(decimals)} ${sizes[i]}`;
}
