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
export declare function ensureDirectory(dirPath: string): Promise<FileOperationResult>;
export declare function listDirectory(dirPath: string, options?: {
    filesOnly?: boolean;
    directoriesOnly?: boolean;
    extensions?: string[];
}): Promise<FileOperationResult<FileInfo[]>>;
export declare function getDirectorySize(dirPath: string): Promise<number>;
export declare function readTextFile(filePath: string): Promise<FileOperationResult<string>>;
export declare function readBinaryFile(filePath: string): Promise<FileOperationResult<Buffer>>;
export declare function writeTextFileAtomic(filePath: string, content: string): Promise<FileOperationResult>;
export declare function writeBinaryFile(filePath: string, data: Buffer | Uint8Array): Promise<FileOperationResult>;
export declare function readJSONFile<T>(filePath: string): Promise<FileOperationResult<T>>;
export declare function writeJSONFile<T>(filePath: string, data: T, pretty?: boolean): Promise<FileOperationResult>;
export declare function pathExists(path: string): Promise<boolean>;
export declare function isReadable(filePath: string): Promise<boolean>;
export declare function isWritable(filePath: string): Promise<boolean>;
export declare function getFileInfo(filePath: string): Promise<FileOperationResult<FileInfo>>;
export declare function safeDelete(filePath: string): Promise<FileOperationResult>;
export declare function copyFile(source: string, destination: string): Promise<FileOperationResult>;
export declare function moveFile(source: string, destination: string): Promise<FileOperationResult>;
export declare function getTempDir(): string;
export declare function createTempFile(content: string, extension?: string): Promise<FileOperationResult<string>>;
export declare function cleanupTempFiles(maxAgeMs?: number): Promise<number>;
export declare function formatBytes(bytes: number, decimals?: number): string;
