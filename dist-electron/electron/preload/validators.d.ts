export declare function isNonEmptyString(value: unknown, maxLength?: number): value is string;
export declare function isValidSettingsKey(key: unknown): key is string;
export declare function isSafeExternalUrl(url: unknown): url is string;
export declare function isHttpUrl(url: unknown): url is string;
export declare function isSerializable(value: unknown): boolean;
export declare function validatePayloadSize(payload: unknown): {
    valid: boolean;
    reason?: string;
};
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
export declare function isValidNumber(value: unknown, min?: number, max?: number): value is number;
export declare function isBoolean(value: unknown): value is boolean;
export declare function isOneOf<T>(value: unknown, options: readonly T[]): value is T;
