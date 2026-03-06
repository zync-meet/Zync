import { BrowserWindow } from 'electron';
export declare function hardenWindow(window: BrowserWindow): void;
export declare function applyGlobalSecurity(): void;
export declare function validateIPCPayload(payload: unknown, maxSize?: number): {
    valid: boolean;
    reason?: string;
};
export declare function getSecurityConfig(): {
    allowedNavigationOrigins: string[];
    allowedPopupOrigins: string[];
    blockedProtocols: string[];
    isDev: boolean;
};
