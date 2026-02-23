/**
 * =============================================================================
 * Notification Utilities — ZYNC Desktop Application
 * =============================================================================
 *
 * Provides a unified notification system for the ZYNC desktop application
 * using Electron's native Notification API. Supports different notification
 * types (info, success, warning, error), sound control, click actions,
 * and a notification queue to prevent overwhelming the user.
 *
 * Also provides badge count management for the dock/taskbar icon.
 *
 * Platform Notes:
 * - Linux: Uses libnotify (notification daemon required)
 * - macOS: Uses Notification Center (requires code signing for production)
 * - Windows: Uses WNS (toast notifications)
 *
 * @module electron/utils/notifications
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow, NativeImage } from 'electron';
/**
 * Severity levels for notifications.
 *
 * @enum {string}
 */
export declare enum NotificationLevel {
    /** Informational notification */
    INFO = "info",
    /** Success notification */
    SUCCESS = "success",
    /** Warning notification */
    WARNING = "warning",
    /** Error notification */
    ERROR = "error"
}
/**
 * Options for creating a notification.
 *
 * @interface ZyncNotificationOptions
 */
export interface ZyncNotificationOptions {
    /** The main notification title */
    title: string;
    /** The notification body text */
    body: string;
    /** Severity level (affects icon and urgency) */
    level?: NotificationLevel;
    /** Whether to play a sound (default: true) */
    silent?: boolean;
    /** Custom icon path (overrides level-based icon) */
    icon?: string | NativeImage;
    /** Urgency for Linux notifications ('low' | 'normal' | 'critical') */
    urgency?: 'low' | 'normal' | 'critical';
    /** Subtitle text (macOS only) */
    subtitle?: string;
    /** Time-to-live in milliseconds (auto-dismiss, 0 = no auto-dismiss) */
    ttl?: number;
    /** Callback when notification is clicked */
    onClick?: () => void;
    /** Callback when notification is closed/dismissed */
    onClose?: () => void;
    /** Action buttons (limited platform support) */
    actions?: Array<{
        type: 'button';
        text: string;
    }>;
    /** Callback when an action button is clicked */
    onAction?: (actionIndex: number) => void;
}
/**
 * Shows a notification to the user.
 *
 * If the maximum number of concurrent notifications is reached, the
 * notification is queued and shown when a slot becomes available.
 *
 * @param {ZyncNotificationOptions} options - Notification configuration
 * @returns {boolean} True if the notification was shown or queued
 *
 * @example
 * ```typescript
 * showNotification({
 *   title: 'Meeting Started',
 *   body: 'Your standup meeting is starting now',
 *   level: NotificationLevel.INFO,
 *   onClick: () => mainWindow.focus(),
 * });
 * ```
 */
export declare function showNotification(options: ZyncNotificationOptions): boolean;
/**
 * Shows a simple info notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {() => void} [onClick] - On-click callback
 */
export declare function notifyInfo(title: string, body: string, onClick?: () => void): void;
/**
 * Shows a success notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export declare function notifySuccess(title: string, body: string): void;
/**
 * Shows a warning notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export declare function notifyWarning(title: string, body: string): void;
/**
 * Shows an error notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export declare function notifyError(title: string, body: string): void;
/**
 * Enables or disables all notifications globally.
 *
 * @param {boolean} enabled - Whether to enable notifications
 */
export declare function setNotificationsEnabled(enabled: boolean): void;
/**
 * Checks if notifications are currently enabled.
 *
 * @returns {boolean} True if enabled
 */
export declare function areNotificationsEnabled(): boolean;
/**
 * Enables or disables Do Not Disturb mode.
 *
 * When active, all notifications are silently suppressed.
 *
 * @param {boolean} active - Whether DND mode should be active
 */
export declare function setDoNotDisturb(active: boolean): void;
/**
 * Checks if Do Not Disturb mode is active.
 *
 * @returns {boolean} True if DND is active
 */
export declare function isDoNotDisturbActive(): boolean;
/**
 * Dismisses all currently visible notifications.
 */
export declare function dismissAllNotifications(): void;
/**
 * Returns the number of queued notifications.
 *
 * @returns {number} Queue length
 */
export declare function getQueueLength(): number;
/**
 * Sets the badge count on the dock/taskbar icon.
 *
 * @param {number} count - The badge count (0 to clear)
 */
export declare function setBadgeCount(count: number): void;
/**
 * Increments the badge count by a given amount.
 *
 * @param {number} [amount=1] - Amount to increment
 */
export declare function incrementBadgeCount(amount?: number): void;
/**
 * Clears the badge count.
 */
export declare function clearBadgeCount(): void;
/**
 * Gets the current badge count.
 *
 * @returns {number} Current badge count
 */
export declare function getBadgeCount(): number;
/**
 * Flashes the taskbar icon to get the user's attention.
 *
 * @param {BrowserWindow} [window] - Window to flash (defaults to focused)
 * @param {boolean} [continuous=false] - Flash continuously until focused
 */
export declare function flashWindow(window?: BrowserWindow, continuous?: boolean): void;
/**
 * Stops flashing the taskbar icon.
 *
 * @param {BrowserWindow} [window] - Window to stop flashing
 */
export declare function stopFlashWindow(window?: BrowserWindow): void;
