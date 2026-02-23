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
/**
 * Result of a file operation.
 *
 * @interface FileOperationResult
 */
export interface FileOperationResult<T = void> {
    /** Whether the operation succeeded */
    success: boolean;
    /** The data returned by the operation, if any */
    data?: T;
    /** Error message if the operation failed */
    error?: string;
}
/**
 * Information about a file or directory.
 *
 * @interface FileInfo
 */
export interface FileInfo {
    /** File name with extension */
    name: string;
    /** Full absolute path */
    path: string;
    /** File size in bytes */
    size: number;
    /** Whether this is a directory */
    isDirectory: boolean;
    /** Whether this is a file */
    isFile: boolean;
    /** File extension (with dot, e.g., '.ts') */
    extension: string;
    /** Last modification date */
    modifiedAt: Date;
    /** Creation date */
    createdAt: Date;
}
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
export declare function ensureDirectory(dirPath: string): Promise<FileOperationResult>;
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
export declare function listDirectory(dirPath: string, options?: {
    filesOnly?: boolean;
    directoriesOnly?: boolean;
    extensions?: string[];
}): Promise<FileOperationResult<FileInfo[]>>;
/**
 * Recursively calculates the total size of a directory in bytes.
 *
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<number>} Total size in bytes, or 0 on error
 */
export declare function getDirectorySize(dirPath: string): Promise<number>;
/**
 * Reads a file as a UTF-8 string.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<FileOperationResult<string>>} The file content
 */
export declare function readTextFile(filePath: string): Promise<FileOperationResult<string>>;
/**
 * Reads a file as a Buffer (binary).
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<FileOperationResult<Buffer>>} The raw file buffer
 */
export declare function readBinaryFile(filePath: string): Promise<FileOperationResult<Buffer>>;
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
export declare function writeTextFileAtomic(filePath: string, content: string): Promise<FileOperationResult>;
/**
 * Writes binary data to a file, ensuring parent directories exist.
 *
 * @param {string} filePath - Absolute path to write to
 * @param {Buffer | Uint8Array} data - The binary data to write
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export declare function writeBinaryFile(filePath: string, data: Buffer | Uint8Array): Promise<FileOperationResult>;
/**
 * Reads a JSON file and parses it.
 *
 * @template T - Expected type of the parsed JSON
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<FileOperationResult<T>>} The parsed data
 */
export declare function readJSONFile<T>(filePath: string): Promise<FileOperationResult<T>>;
/**
 * Writes data as a JSON file atomically.
 *
 * @template T - Type of the data to serialize
 * @param {string} filePath - Path to write the JSON file
 * @param {T} data - The data to serialize
 * @param {boolean} [pretty=true] - Whether to pretty-print the JSON
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export declare function writeJSONFile<T>(filePath: string, data: T, pretty?: boolean): Promise<FileOperationResult>;
/**
 * Checks if a file or directory exists.
 *
 * @param {string} path - Absolute path to check
 * @returns {Promise<boolean>} True if exists
 */
export declare function pathExists(path: string): Promise<boolean>;
/**
 * Checks if a file is readable.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if readable
 */
export declare function isReadable(filePath: string): Promise<boolean>;
/**
 * Checks if a path is writable.
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if writable
 */
export declare function isWritable(filePath: string): Promise<boolean>;
/**
 * Gets detailed information about a file.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileOperationResult<FileInfo>>} File information
 */
export declare function getFileInfo(filePath: string): Promise<FileOperationResult<FileInfo>>;
/**
 * Safely deletes a file. Does nothing if the file doesn't exist.
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export declare function safeDelete(filePath: string): Promise<FileOperationResult>;
/**
 * Copies a file to a new location, creating parent directories as needed.
 *
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {Promise<FileOperationResult>} Result of the operation
 */
export declare function copyFile(source: string, destination: string): Promise<FileOperationResult>;
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
export declare function moveFile(source: string, destination: string): Promise<FileOperationResult>;
/**
 * Gets the ZYNC temporary directory path.
 *
 * @returns {string} Absolute path to the temp directory
 */
export declare function getTempDir(): string;
/**
 * Creates a temporary file with the given content.
 *
 * @param {string} content - Content to write
 * @param {string} [extension='.tmp'] - File extension
 * @returns {Promise<FileOperationResult<string>>} Path to the temp file
 */
export declare function createTempFile(content: string, extension?: string): Promise<FileOperationResult<string>>;
/**
 * Cleans up ZYNC temporary files older than the specified age.
 *
 * @param {number} [maxAgeMs=86400000] - Max age in milliseconds (default: 24 hours)
 * @returns {Promise<number>} Number of files deleted
 */
export declare function cleanupTempFiles(maxAgeMs?: number): Promise<number>;
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
export declare function formatBytes(bytes: number, decimals?: number): string;
