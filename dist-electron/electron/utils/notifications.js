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
import { Notification, app, BrowserWindow } from 'electron';
/**
 * Severity levels for notifications.
 *
 * @enum {string}
 */
export var NotificationLevel;
(function (NotificationLevel) {
    /** Informational notification */
    NotificationLevel["INFO"] = "info";
    /** Success notification */
    NotificationLevel["SUCCESS"] = "success";
    /** Warning notification */
    NotificationLevel["WARNING"] = "warning";
    /** Error notification */
    NotificationLevel["ERROR"] = "error";
})(NotificationLevel || (NotificationLevel = {}));
// =============================================================================
// Notification Manager State
// =============================================================================
/** Queue of pending notifications */
const notificationQueue = [];
/** Currently displayed notifications */
const activeNotifications = new Map();
/** Maximum number of concurrent notifications */
const MAX_CONCURRENT_NOTIFICATIONS = 3;
/** Minimum delay between notifications in ms */
const MIN_NOTIFICATION_INTERVAL = 500;
/** Timestamp of last shown notification */
let lastNotificationTime = 0;
/** Whether notifications are enabled globally */
let notificationsEnabled = true;
/** Whether Do Not Disturb mode is active */
let doNotDisturbMode = false;
/** Badge count for dock/taskbar */
let currentBadgeCount = 0;
// =============================================================================
// Notification Lifecycle
// =============================================================================
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
export function showNotification(options) {
    // Check global state
    if (!notificationsEnabled) {
        console.info('[Notification] Notifications are disabled');
        return false;
    }
    if (doNotDisturbMode) {
        console.info('[Notification] Do Not Disturb is active, suppressing notification');
        return false;
    }
    if (!Notification.isSupported()) {
        console.warn('[Notification] Notifications are not supported on this platform');
        return false;
    }
    // Check rate limiting
    const now = Date.now();
    if (now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
        notificationQueue.push(options);
        scheduleQueueDrain();
        return true;
    }
    // Check concurrent limit
    if (activeNotifications.size >= MAX_CONCURRENT_NOTIFICATIONS) {
        notificationQueue.push(options);
        scheduleQueueDrain();
        return true;
    }
    // Show immediately
    return showNotificationImmediate(options);
}
/**
 * Shows a simple info notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {() => void} [onClick] - On-click callback
 */
export function notifyInfo(title, body, onClick) {
    showNotification({ title, body, level: NotificationLevel.INFO, onClick });
}
/**
 * Shows a success notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function notifySuccess(title, body) {
    showNotification({ title, body, level: NotificationLevel.SUCCESS });
}
/**
 * Shows a warning notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function notifyWarning(title, body) {
    showNotification({
        title,
        body,
        level: NotificationLevel.WARNING,
        urgency: 'normal',
    });
}
/**
 * Shows an error notification.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function notifyError(title, body) {
    showNotification({
        title,
        body,
        level: NotificationLevel.ERROR,
        urgency: 'critical',
        silent: false,
    });
}
// =============================================================================
// Notification State Management
// =============================================================================
/**
 * Enables or disables all notifications globally.
 *
 * @param {boolean} enabled - Whether to enable notifications
 */
export function setNotificationsEnabled(enabled) {
    notificationsEnabled = enabled;
    console.info(`[Notification] Notifications ${enabled ? 'enabled' : 'disabled'}`);
    if (!enabled) {
        dismissAllNotifications();
    }
}
/**
 * Checks if notifications are currently enabled.
 *
 * @returns {boolean} True if enabled
 */
export function areNotificationsEnabled() {
    return notificationsEnabled;
}
/**
 * Enables or disables Do Not Disturb mode.
 *
 * When active, all notifications are silently suppressed.
 *
 * @param {boolean} active - Whether DND mode should be active
 */
export function setDoNotDisturb(active) {
    doNotDisturbMode = active;
    console.info(`[Notification] Do Not Disturb ${active ? 'enabled' : 'disabled'}`);
    if (active) {
        dismissAllNotifications();
    }
}
/**
 * Checks if Do Not Disturb mode is active.
 *
 * @returns {boolean} True if DND is active
 */
export function isDoNotDisturbActive() {
    return doNotDisturbMode;
}
/**
 * Dismisses all currently visible notifications.
 */
export function dismissAllNotifications() {
    for (const [id, active] of activeNotifications) {
        if (active.timer)
            clearTimeout(active.timer);
        active.notification.close();
        activeNotifications.delete(id);
    }
    notificationQueue.length = 0;
    console.info('[Notification] All notifications dismissed');
}
/**
 * Returns the number of queued notifications.
 *
 * @returns {number} Queue length
 */
export function getQueueLength() {
    return notificationQueue.length;
}
// =============================================================================
// Badge Count (Dock / Taskbar)
// =============================================================================
/**
 * Sets the badge count on the dock/taskbar icon.
 *
 * @param {number} count - The badge count (0 to clear)
 */
export function setBadgeCount(count) {
    try {
        const clamped = Math.max(0, Math.floor(count));
        app.setBadgeCount(clamped);
        currentBadgeCount = clamped;
        console.info(`[Notification] Badge count set to ${clamped}`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Notification] Failed to set badge count: ${message}`);
    }
}
/**
 * Increments the badge count by a given amount.
 *
 * @param {number} [amount=1] - Amount to increment
 */
export function incrementBadgeCount(amount = 1) {
    setBadgeCount(currentBadgeCount + amount);
}
/**
 * Clears the badge count.
 */
export function clearBadgeCount() {
    setBadgeCount(0);
}
/**
 * Gets the current badge count.
 *
 * @returns {number} Current badge count
 */
export function getBadgeCount() {
    return currentBadgeCount;
}
// =============================================================================
// Window Attention / Flash
// =============================================================================
/**
 * Flashes the taskbar icon to get the user's attention.
 *
 * @param {BrowserWindow} [window] - Window to flash (defaults to focused)
 * @param {boolean} [continuous=false] - Flash continuously until focused
 */
export function flashWindow(window, continuous = false) {
    const targetWindow = window ?? BrowserWindow.getFocusedWindow();
    if (!targetWindow)
        return;
    try {
        targetWindow.flashFrame(continuous);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Notification] Failed to flash window: ${message}`);
    }
}
/**
 * Stops flashing the taskbar icon.
 *
 * @param {BrowserWindow} [window] - Window to stop flashing
 */
export function stopFlashWindow(window) {
    const targetWindow = window ?? BrowserWindow.getFocusedWindow();
    if (!targetWindow)
        return;
    try {
        targetWindow.flashFrame(false);
    }
    catch {
        // Ignore
    }
}
// =============================================================================
// Internal Helpers
// =============================================================================
/**
 * Shows a notification immediately without throttling checks.
 *
 * @param {ZyncNotificationOptions} options - Notification config
 * @returns {boolean} True if shown successfully
 * @internal
 */
function showNotificationImmediate(options) {
    try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        // Build notification options
        const electronOptions = {
            title: options.title,
            body: options.body,
            silent: options.silent ?? false,
            urgency: options.urgency ?? 'normal',
        };
        // Set icon
        if (options.icon) {
            if (typeof options.icon === 'string') {
                electronOptions.icon = options.icon;
            }
            else {
                electronOptions.icon = options.icon;
            }
        }
        // Set subtitle (macOS)
        if (options.subtitle) {
            electronOptions.subtitle = options.subtitle;
        }
        // Set actions
        if (options.actions) {
            electronOptions.actions = options.actions;
        }
        // Create notification
        const notification = new Notification(electronOptions);
        // Wire up click handler
        notification.on('click', () => {
            options.onClick?.();
            removeActiveNotification(notifId);
        });
        // Wire up close handler
        notification.on('close', () => {
            options.onClose?.();
            removeActiveNotification(notifId);
        });
        // Wire up action handler
        if (options.onAction) {
            notification.on('action', (_event, index) => {
                options.onAction?.(index);
                removeActiveNotification(notifId);
            });
        }
        // Show the notification
        notification.show();
        lastNotificationTime = Date.now();
        // Track active notification
        const active = {
            notification,
            shownAt: Date.now(),
        };
        // Set auto-dismiss timer
        if (options.ttl && options.ttl > 0) {
            active.timer = setTimeout(() => {
                notification.close();
                removeActiveNotification(notifId);
            }, options.ttl);
        }
        activeNotifications.set(notifId, active);
        return true;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Notification] Failed to show notification: ${message}`);
        return false;
    }
}
/**
 * Removes a notification from the active set and drains the queue.
 *
 * @param {string} id - Notification ID
 * @internal
 */
function removeActiveNotification(id) {
    const active = activeNotifications.get(id);
    if (active?.timer) {
        clearTimeout(active.timer);
    }
    activeNotifications.delete(id);
    // Drain queue if there's room
    drainQueue();
}
/** Handle for the queue drain scheduler */
let drainTimer = null;
/**
 * Schedules a queue drain after the minimum notification interval.
 *
 * @internal
 */
function scheduleQueueDrain() {
    if (drainTimer)
        return;
    drainTimer = setTimeout(() => {
        drainTimer = null;
        drainQueue();
    }, MIN_NOTIFICATION_INTERVAL);
}
/**
 * Processes the notification queue, showing as many as possible.
 *
 * @internal
 */
function drainQueue() {
    while (notificationQueue.length > 0 &&
        activeNotifications.size < MAX_CONCURRENT_NOTIFICATIONS) {
        const next = notificationQueue.shift();
        if (next) {
            showNotificationImmediate(next);
        }
    }
    // Schedule another drain if queue isn't empty
    if (notificationQueue.length > 0) {
        scheduleQueueDrain();
    }
}
//# sourceMappingURL=notifications.js.map