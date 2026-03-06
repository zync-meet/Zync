import { BrowserWindow, NativeImage } from 'electron';
export declare enum NotificationLevel {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}
export interface ZyncNotificationOptions {
    title: string;
    body: string;
    level?: NotificationLevel;
    silent?: boolean;
    icon?: string | NativeImage;
    urgency?: 'low' | 'normal' | 'critical';
    subtitle?: string;
    ttl?: number;
    onClick?: () => void;
    onClose?: () => void;
    actions?: Array<{
        type: 'button';
        text: string;
    }>;
    onAction?: (actionIndex: number) => void;
}
export declare function showNotification(options: ZyncNotificationOptions): boolean;
export declare function notifyInfo(title: string, body: string, onClick?: () => void): void;
export declare function notifySuccess(title: string, body: string): void;
export declare function notifyWarning(title: string, body: string): void;
export declare function notifyError(title: string, body: string): void;
export declare function setNotificationsEnabled(enabled: boolean): void;
export declare function areNotificationsEnabled(): boolean;
export declare function setDoNotDisturb(active: boolean): void;
export declare function isDoNotDisturbActive(): boolean;
export declare function dismissAllNotifications(): void;
export declare function getQueueLength(): number;
export declare function setBadgeCount(count: number): void;
export declare function incrementBadgeCount(amount?: number): void;
export declare function clearBadgeCount(): void;
export declare function getBadgeCount(): number;
export declare function flashWindow(window?: BrowserWindow, continuous?: boolean): void;
export declare function stopFlashWindow(window?: BrowserWindow): void;
