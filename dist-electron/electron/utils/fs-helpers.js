import { promises as fs, constants as fsConstants } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { app } from 'electron';
import { randomBytes } from 'crypto';
export async function ensureDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to ensure directory ${dirPath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function listDirectory(dirPath, options) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const results = [];
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);
            const info = {
                name: entry.name,
                path: fullPath,
                size: stats.size,
                isDirectory: entry.isDirectory(),
                isFile: entry.isFile(),
                extension: entry.isFile() ? extname(entry.name) : '',
                modifiedAt: stats.mtime,
                createdAt: stats.birthtime,
            };
            if (options?.filesOnly && !info.isFile)
                continue;
            if (options?.directoriesOnly && !info.isDirectory)
                continue;
            if (options?.extensions && info.isFile) {
                if (!options.extensions.includes(info.extension))
                    continue;
            }
            results.push(info);
        }
        return { success: true, data: results };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to list directory ${dirPath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function getDirectorySize(dirPath) {
    let totalSize = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
            }
            else if (entry.isDirectory()) {
                totalSize += await getDirectorySize(fullPath);
            }
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Error calculating directory size for ${dirPath}: ${message}`);
    }
    return totalSize;
}
export async function readTextFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function readBinaryFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
        return { success: true, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read binary file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function writeTextFileAtomic(filePath, content) {
    const tmpPath = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;
    try {
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(tmpPath, content, 'utf-8');
        await fs.rename(tmpPath, filePath);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write file atomically ${filePath}: ${message}`);
        try {
            await fs.unlink(tmpPath);
        }
        catch {
        }
        return { success: false, error: message };
    }
}
export async function writeBinaryFile(filePath, data) {
    try {
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, data);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write binary file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function readJSONFile(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(raw);
        return { success: true, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to read JSON file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function writeJSONFile(filePath, data, pretty = true) {
    try {
        const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return await writeTextFileAtomic(filePath, content + '\n');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write JSON file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function pathExists(path) {
    try {
        await fs.access(path, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
export async function isReadable(filePath) {
    try {
        await fs.access(filePath, fsConstants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
export async function isWritable(filePath) {
    try {
        await fs.access(filePath, fsConstants.W_OK);
        return true;
    }
    catch {
        return false;
    }
}
export async function getFileInfo(filePath) {
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to get file info for ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function safeDelete(filePath) {
    try {
        await fs.unlink(filePath);
        return { success: true };
    }
    catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
            return { success: true };
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to delete file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
export async function copyFile(source, destination) {
    try {
        await fs.mkdir(dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to copy ${source} to ${destination}: ${message}`);
        return { success: false, error: message };
    }
}
export async function moveFile(source, destination) {
    try {
        await fs.mkdir(dirname(destination), { recursive: true });
        await fs.rename(source, destination);
        return { success: true };
    }
    catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'EXDEV') {
            const copyResult = await copyFile(source, destination);
            if (!copyResult.success)
                return copyResult;
            return await safeDelete(source);
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to move ${source} to ${destination}: ${message}`);
        return { success: false, error: message };
    }
}
export function getTempDir() {
    return join(app.getPath('temp'), 'zync');
}
export async function createTempFile(content, extension = '.tmp') {
    const tempDir = getTempDir();
    const fileName = `zync_${Date.now()}_${randomBytes(4).toString('hex')}${extension}`;
    const tempPath = join(tempDir, fileName);
    try {
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(tempPath, content, 'utf-8');
        return { success: true, data: tempPath };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to create temp file: ${message}`);
        return { success: false, error: message };
    }
}
export async function cleanupTempFiles(maxAgeMs = 86400000) {
    const tempDir = getTempDir();
    let deleted = 0;
    try {
        const exists = await pathExists(tempDir);
        if (!exists)
            return 0;
        const entries = await fs.readdir(tempDir, { withFileTypes: true });
        const now = Date.now();
        for (const entry of entries) {
            if (!entry.isFile())
                continue;
            const filePath = join(tempDir, entry.name);
            try {
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > maxAgeMs) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            }
            catch {
            }
        }
        console.info(`[FS] Cleaned up ${deleted} temporary files`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to clean up temp files: ${message}`);
    }
    return deleted;
}
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    if (bytes < 0)
        return '-' + formatBytes(-bytes, decimals);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(decimals)} ${sizes[i]}`;
}
//# sourceMappingURL=fs-helpers.js.map