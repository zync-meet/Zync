/**
 * =============================================================================
 * File System Helpers — ZYNC Desktop Application
 * =============================================================================
 *
 * Higher-level file system utilities built on top of Node.js `fs/promises`.
 * Provides atomic writes, safe reads, directory scanning, temp file management,
 * and size formatting for the ZYNC desktop application.
 *
 * All functions are async and use proper error handling to prevent crashes.
 * File operations that could fail due to permissions or missing directories
 * create parent directories automatically when needed.
 *
 * @module electron/utils/fs-helpers
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { promises as fs, constants as fsConstants } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { app } from 'electron';
import { randomBytes } from 'crypto';
// =============================================================================
// Directory Operations
// =============================================================================
/**
 * Ensures a directory exists. Creates it (and all parent directories)
 * if it doesn't exist.
 *
 * @param {string} dirPath - Absolute path to the directory
 * @returns {Promise<FileOperationResult>} Result of the operation
 *
 * @example
 * ```typescript
 * await ensureDirectory('/home/user/.config/zync/data');
 * ```
 */
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
/**
 * Lists contents of a directory.
 *
 * @param {string} dirPath - Absolute path to the directory
 * @param {object} [options] - Listing options
 * @param {boolean} [options.filesOnly=false] - Only return files
 * @param {boolean} [options.directoriesOnly=false] - Only return directories
 * @param {string[]} [options.extensions] - Filter by file extensions (e.g., ['.ts', '.js'])
 * @returns {Promise<FileOperationResult<FileInfo[]>>} Array of file info objects
 */
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
            // Apply filters
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
/**
 * Recursively calculates the total size of a directory in bytes.
 *
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<number>} Total size in bytes, or 0 on error
 */
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
// =============================================================================
// File Operations
// =============================================================================
/**
 * Reads a file as a UTF-8 string.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<FileOperationResult<string>>} The file content
 */
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
/**
 * Reads a file as a Buffer (binary).
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<FileOperationResult<Buffer>>} The raw file buffer
 */
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
/**
 * Writes a string to a file atomically.
 *
 * Writes to a temporary file first, then renames it to the target. This
 * prevents data corruption if the process crashes during the write.
 *
 * @param {string} filePath - Absolute path to write to
 * @param {string} content - The content to write
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export async function writeTextFileAtomic(filePath, content) {
    const tmpPath = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;
    try {
        // Ensure parent directory exists
        await fs.mkdir(dirname(filePath), { recursive: true });
        // Write to temporary file
        await fs.writeFile(tmpPath, content, 'utf-8');
        // Atomic rename
        await fs.rename(tmpPath, filePath);
        return { success: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to write file atomically ${filePath}: ${message}`);
        // Clean up temp file if it exists
        try {
            await fs.unlink(tmpPath);
        }
        catch {
            // Ignore cleanup errors
        }
        return { success: false, error: message };
    }
}
/**
 * Writes binary data to a file, ensuring parent directories exist.
 *
 * @param {string} filePath - Absolute path to write to
 * @param {Buffer | Uint8Array} data - The binary data to write
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
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
/**
 * Reads a JSON file and parses it.
 *
 * @template T - Expected type of the parsed JSON
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<FileOperationResult<T>>} The parsed data
 */
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
/**
 * Writes data as a JSON file atomically.
 *
 * @template T - Type of the data to serialize
 * @param {string} filePath - Path to write the JSON file
 * @param {T} data - The data to serialize
 * @param {boolean} [pretty=true] - Whether to pretty-print the JSON
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
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
// =============================================================================
// File Checks
// =============================================================================
/**
 * Checks if a file or directory exists.
 *
 * @param {string} path - Absolute path to check
 * @returns {Promise<boolean>} True if exists
 */
export async function pathExists(path) {
    try {
        await fs.access(path, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a file is readable.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if readable
 */
export async function isReadable(filePath) {
    try {
        await fs.access(filePath, fsConstants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a path is writable.
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if writable
 */
export async function isWritable(filePath) {
    try {
        await fs.access(filePath, fsConstants.W_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Gets detailed information about a file.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileOperationResult<FileInfo>>} File information
 */
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
// =============================================================================
// File Management
// =============================================================================
/**
 * Safely deletes a file. Does nothing if the file doesn't exist.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export async function safeDelete(filePath) {
    try {
        await fs.unlink(filePath);
        return { success: true };
    }
    catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
            // File doesn't exist, that's fine
            return { success: true };
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FS] Failed to delete file ${filePath}: ${message}`);
        return { success: false, error: message };
    }
}
/**
 * Copies a file to a new location, creating parent directories as needed.
 *
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
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
/**
 * Moves a file to a new location.
 *
 * Attempts rename first (fast, same filesystem). Falls back to copy+delete
 * if rename fails (cross-filesystem move).
 *
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export async function moveFile(source, destination) {
    try {
        await fs.mkdir(dirname(destination), { recursive: true });
        await fs.rename(source, destination);
        return { success: true };
    }
    catch (err) {
        // Cross-filesystem move: copy then delete
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
// =============================================================================
// Temporary Files
// =============================================================================
/**
 * Gets the ZYNC temporary directory path.
 *
 * @returns {string} Absolute path to the temp directory
 */
export function getTempDir() {
    return join(app.getPath('temp'), 'zync');
}
/**
 * Creates a temporary file with the given content.
 *
 * @param {string} content - Content to write
 * @param {string} [extension='.tmp'] - File extension
 * @returns {Promise<FileOperationResult<string>>} Path to the temp file
 */
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
/**
 * Cleans up ZYNC temporary files older than the specified age.
 *
 * @param {number} [maxAgeMs=86400000] - Max age in milliseconds (default: 24 hours)
 * @returns {Promise<number>} Number of files deleted
 */
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
                // Skip files that can't be stat'd or deleted
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
// =============================================================================
// Size Formatting
// =============================================================================
/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number} bytes - Number of bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted string (e.g., "1.23 MB")
 *
 * @example
 * ```typescript
 * formatBytes(1024);       // '1.00 KB'
 * formatBytes(1048576);    // '1.00 MB'
 * formatBytes(0);          // '0 Bytes'
 * ```
 */
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