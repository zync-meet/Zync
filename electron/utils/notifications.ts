import { Notification, app, BrowserWindow, nativeImage, NativeImage } from 'electron';
import { join } from 'path';


export enum NotificationLevel {

    INFO = 'info',

    SUCCESS = 'success',

    WARNING = 'warning',

    ERROR = 'error',
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


interface ActiveNotification {

    notification: Notification;

    shownAt: number;

    timer?: ReturnType<typeof setTimeout>;
}


const notificationQueue: ZyncNotificationOptions[] = [];


const activeNotifications: Map<string, ActiveNotification> = new Map();


const MAX_CONCURRENT_NOTIFICATIONS = 3;


const MIN_NOTIFICATION_INTERVAL = 500;


let lastNotificationTime = 0;


let notificationsEnabled = true;


let doNotDisturbMode = false;


let currentBadgeCount = 0;


export function showNotification(options: ZyncNotificationOptions): boolean {

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


    const now = Date.now();
    if (now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
        notificationQueue.push(options);
        scheduleQueueDrain();
        return true;
    }


    if (activeNotifications.size >= MAX_CONCURRENT_NOTIFICATIONS) {
        notificationQueue.push(options);
        scheduleQueueDrain();
        return true;
    }


    return showNotificationImmediate(options);
}


export function notifyInfo(title: string, body: string, onClick?: () => void): void {
    showNotification({ title, body, level: NotificationLevel.INFO, onClick });
}


export function notifySuccess(title: string, body: string): void {
    showNotification({ title, body, level: NotificationLevel.SUCCESS });
}


export function notifyWarning(title: string, body: string): void {
    showNotification({
        title,
        body,
        level: NotificationLevel.WARNING,
        urgency: 'normal',
    });
}


export function notifyError(title: string, body: string): void {
    showNotification({
        title,
        body,
        level: NotificationLevel.ERROR,
        urgency: 'critical',
        silent: false,
    });
}


export function setNotificationsEnabled(enabled: boolean): void {
    notificationsEnabled = enabled;
    console.info(`[Notification] Notifications ${enabled ? 'enabled' : 'disabled'}`);

    if (!enabled) {
        dismissAllNotifications();
    }
}


export function areNotificationsEnabled(): boolean {
    return notificationsEnabled;
}


export function setDoNotDisturb(active: boolean): void {
    doNotDisturbMode = active;
    console.info(`[Notification] Do Not Disturb ${active ? 'enabled' : 'disabled'}`);

    if (active) {
        dismissAllNotifications();
    }
}


export function isDoNotDisturbActive(): boolean {
    return doNotDisturbMode;
}


export function dismissAllNotifications(): void {
    for (const [id, active] of activeNotifications) {
        if (active.timer) clearTimeout(active.timer);
        active.notification.close();
        activeNotifications.delete(id);
    }
    notificationQueue.length = 0;
    console.info('[Notification] All notifications dismissed');
}


export function getQueueLength(): number {
    return notificationQueue.length;
}


export function setBadgeCount(count: number): void {
    try {
        const clamped = Math.max(0, Math.floor(count));
        app.setBadgeCount(clamped);
        currentBadgeCount = clamped;
        console.info(`[Notification] Badge count set to ${clamped}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Notification] Failed to set badge count: ${message}`);
    }
}


export function incrementBadgeCount(amount: number = 1): void {
    setBadgeCount(currentBadgeCount + amount);
}


export function clearBadgeCount(): void {
    setBadgeCount(0);
}


export function getBadgeCount(): number {
    return currentBadgeCount;
}


export function flashWindow(window?: BrowserWindow, continuous: boolean = false): void {
    const targetWindow = window ?? BrowserWindow.getFocusedWindow();
    if (!targetWindow) return;

    try {
        targetWindow.flashFrame(continuous);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Notification] Failed to flash window: ${message}`);
    }
}


export function stopFlashWindow(window?: BrowserWindow): void {
    const targetWindow = window ?? BrowserWindow.getFocusedWindow();
    if (!targetWindow) return;

    try {
        targetWindow.flashFrame(false);
    } catch {

    }
}


function showNotificationImmediate(options: ZyncNotificationOptions): boolean {
    try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;


        const electronOptions: Electron.NotificationConstructorOptions = {
            title: options.title,
            body: options.body,
            silent: options.silent ?? false,
            urgency: options.urgency ?? 'normal',
        };


        if (options.icon) {
            if (typeof options.icon === 'string') {
                electronOptions.icon = options.icon;
            } else {
                electronOptions.icon = options.icon;
            }
        }


        if (options.subtitle) {
            electronOptions.subtitle = options.subtitle;
        }


        if (options.actions) {
            electronOptions.actions = options.actions;
        }


        const notification = new Notification(electronOptions);


        notification.on('click', () => {
            options.onClick?.();
            removeActiveNotification(notifId);
        });


        notification.on('close', () => {
            options.onClose?.();
            removeActiveNotification(notifId);
        });


        if (options.onAction) {
            notification.on('action', (_event, index) => {
                options.onAction?.(index);
                removeActiveNotification(notifId);
            });
        }


        notification.show();
        lastNotificationTime = Date.now();


        const active: ActiveNotification = {
            notification,
            shownAt: Date.now(),
        };


        if (options.ttl && options.ttl > 0) {
            active.timer = setTimeout(() => {
                notification.close();
                removeActiveNotification(notifId);
            }, options.ttl);
        }

        activeNotifications.set(notifId, active);
        return true;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Notification] Failed to show notification: ${message}`);
        return false;
    }
}


function removeActiveNotification(id: string): void {
    const active = activeNotifications.get(id);
    if (active?.timer) {
        clearTimeout(active.timer);
    }
    activeNotifications.delete(id);


    drainQueue();
}


let drainTimer: ReturnType<typeof setTimeout> | null = null;


function scheduleQueueDrain(): void {
    if (drainTimer) return;

    drainTimer = setTimeout(() => {
        drainTimer = null;
        drainQueue();
    }, MIN_NOTIFICATION_INTERVAL);
}


function drainQueue(): void {
    while (
        notificationQueue.length > 0 &&
        activeNotifications.size < MAX_CONCURRENT_NOTIFICATIONS
    ) {
        const next = notificationQueue.shift();
        if (next) {
            showNotificationImmediate(next);
        }
    }


    if (notificationQueue.length > 0) {
        scheduleQueueDrain();
    }
}
