import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: []
    }),
    actions: {
        notify(message, type = 'success', duration = 3000) {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }
        },
        remove(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }
});
