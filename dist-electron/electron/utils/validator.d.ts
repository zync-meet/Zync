export declare function validateURL(url: string): {
    valid: boolean;
    reason?: string;
};
export declare function isSafeUrl(url: string): boolean;
export declare function validateFilePath(filePath: string, baseDir?: string): {
    valid: boolean;
    reason?: string;
};
export declare function isWithinUserData(filePath: string): boolean;
export declare function sanitizeFilename(filename: string, replacement?: string): string;
export declare function validateIPCPayload(payload: unknown): {
    valid: boolean;
    reason?: string;
};
export declare function isValidString(value: unknown, minLength?: number, maxLength?: number): value is string;
export declare function isValidEmail(email: string): boolean;
export declare function isValidSemver(version: string): boolean;
