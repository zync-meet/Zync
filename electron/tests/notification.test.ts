import { describe, it, expect, vi } from 'vitest';


vi.mock('electron', () => ({
    Notification: {
        isSupported: vi.fn(() => true),
    },
    app: {
        setBadgeCount: vi.fn(() => true),
        getBadgeCount: vi.fn(() => 0),
    },
}));


interface NotificationItem {
    id: string;
    title: string;
    body: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timestamp: number;
    read: boolean;
}


class NotificationQueue {
    private queue: NotificationItem[] = [];
    private maxSize: number;
    private dndEnabled = false;

    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }

    add(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
        const notification: NotificationItem = {
            ...item,
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            read: false,
        };

        this.queue.push(notification);


        if (this.queue.length > this.maxSize) {
            this.queue = this.queue.slice(-this.maxSize);
        }

        return notification;
    }

    getAll(): NotificationItem[] {
        return [...this.queue];
    }

    getUnread(): NotificationItem[] {
        return this.queue.filter((n) => !n.read);
    }

    markAsRead(id: string): boolean {
        const item = this.queue.find((n) => n.id === id);
        if (item) {
            item.read = true;
            return true;
        }
        return false;
    }

    markAllAsRead(): number {
        let count = 0;
        for (const item of this.queue) {
            if (!item.read) {
                item.read = true;
                count++;
            }
        }
        return count;
    }

    remove(id: string): boolean {
        const index = this.queue.findIndex((n) => n.id === id);
        if (index >= 0) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }

    clear(): void {
        this.queue = [];
    }

    get size(): number {
        return this.queue.length;
    }

    get unreadCount(): number {
        return this.queue.filter((n) => !n.read).length;
    }

    setDnd(enabled: boolean): void {
        this.dndEnabled = enabled;
    }

    isDnd(): boolean {
        return this.dndEnabled;
    }

    shouldShow(priority: NotificationItem['priority']): boolean {
        if (!this.dndEnabled) {return true;}
        return priority === 'critical';
    }
}


describe('Notification Queue', () => {
    it('should add notifications and assign IDs', () => {
        const queue = new NotificationQueue();
        const notif = queue.add({
            title: 'Test',
            body: 'Test body',
            priority: 'normal',
        });
        expect(notif.id).toBeDefined();
        expect(notif.title).toBe('Test');
        expect(queue.size).toBe(1);
    });

    it('should track unread notifications', () => {
        const queue = new NotificationQueue();
        queue.add({ title: 'N1', body: '', priority: 'normal' });
        queue.add({ title: 'N2', body: '', priority: 'normal' });
        expect(queue.unreadCount).toBe(2);
    });

    it('should mark single notification as read', () => {
        const queue = new NotificationQueue();
        const notif = queue.add({ title: 'Test', body: '', priority: 'normal' });
        queue.markAsRead(notif.id);
        expect(queue.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
        const queue = new NotificationQueue();
        queue.add({ title: 'N1', body: '', priority: 'normal' });
        queue.add({ title: 'N2', body: '', priority: 'normal' });
        queue.add({ title: 'N3', body: '', priority: 'high' });
        const count = queue.markAllAsRead();
        expect(count).toBe(3);
        expect(queue.unreadCount).toBe(0);
    });

    it('should remove notifications by ID', () => {
        const queue = new NotificationQueue();
        const notif = queue.add({ title: 'Test', body: '', priority: 'normal' });
        expect(queue.remove(notif.id)).toBe(true);
        expect(queue.size).toBe(0);
    });

    it('should return false when removing non-existent notification', () => {
        const queue = new NotificationQueue();
        expect(queue.remove('nonexistent')).toBe(false);
    });

    it('should clear all notifications', () => {
        const queue = new NotificationQueue();
        queue.add({ title: 'N1', body: '', priority: 'low' });
        queue.add({ title: 'N2', body: '', priority: 'high' });
        queue.clear();
        expect(queue.size).toBe(0);
    });

    it('should trim queue when exceeding max size', () => {
        const queue = new NotificationQueue(3);
        queue.add({ title: 'N1', body: '', priority: 'normal' });
        queue.add({ title: 'N2', body: '', priority: 'normal' });
        queue.add({ title: 'N3', body: '', priority: 'normal' });
        queue.add({ title: 'N4', body: '', priority: 'normal' });
        expect(queue.size).toBe(3);


        const all = queue.getAll();
        expect(all[0].title).toBe('N2');
        expect(all[2].title).toBe('N4');
    });
});


describe('Do Not Disturb Mode', () => {
    it('should default to DND off', () => {
        const queue = new NotificationQueue();
        expect(queue.isDnd()).toBe(false);
    });

    it('should toggle DND on', () => {
        const queue = new NotificationQueue();
        queue.setDnd(true);
        expect(queue.isDnd()).toBe(true);
    });

    it('should show all notifications when DND is off', () => {
        const queue = new NotificationQueue();
        expect(queue.shouldShow('low')).toBe(true);
        expect(queue.shouldShow('normal')).toBe(true);
        expect(queue.shouldShow('high')).toBe(true);
        expect(queue.shouldShow('critical')).toBe(true);
    });

    it('should only show critical notifications when DND is on', () => {
        const queue = new NotificationQueue();
        queue.setDnd(true);
        expect(queue.shouldShow('low')).toBe(false);
        expect(queue.shouldShow('normal')).toBe(false);
        expect(queue.shouldShow('high')).toBe(false);
        expect(queue.shouldShow('critical')).toBe(true);
    });
});


describe('Notification Priority', () => {
    it('should categorize priority levels correctly', () => {
        const priorities: NotificationItem['priority'][] = ['low', 'normal', 'high', 'critical'];
        const priorityValues: Record<string, number> = {
            low: 0,
            normal: 1,
            high: 2,
            critical: 3,
        };

        const sorted = [...priorities].sort(
            (a, b) => priorityValues[b] - priorityValues[a],
        );

        expect(sorted[0]).toBe('critical');
        expect(sorted[3]).toBe('low');
    });
});
