import { defineStore } from 'pinia';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationState {
    notifications: Notification[];
}

export const useNotificationStore = defineStore('notification', {
    state: (): NotificationState => ({
        notifications: []
    }),
    actions: {
        notify(message: string, type: NotificationType = 'success', duration = 3000) {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }
        },
        remove(id: number) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }
});
