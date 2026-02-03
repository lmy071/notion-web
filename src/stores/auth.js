import { defineStore } from 'pinia';
import api from '../utils/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userId: localStorage.getItem('userId') || null,
    role: localStorage.getItem('role') || null,
    avatar: localStorage.getItem('avatar') || null
  }),
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/login', { username, password });
        if (response.data.success) {
          this.user = response.data.user;
          this.userId = response.data.user.id;
          this.role = response.data.user.role;
          this.avatar = response.data.user.avatar || null;
          localStorage.setItem('userId', this.userId);
          localStorage.setItem('role', this.role);
          if (this.avatar) localStorage.setItem('avatar', this.avatar);
          return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        console.error('Login failed:', error);
        return { success: false, message: error.response?.data?.message || 'Login failed' };
      }
    },
    async register(username, password) {
      try {
        const response = await api.post('/register', { username, password });
        return { 
          success: response.data.success, 
          message: response.data.message 
        };
      } catch (error) {
        console.error('Registration failed:', error);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Registration failed' 
        };
      }
    },
    logout() {
      this.user = null;
      this.userId = null;
      this.role = null;
      this.avatar = null;
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('avatar');
    },
    updateAvatar(avatar) {
      this.avatar = avatar;
      if (avatar) {
        localStorage.setItem('avatar', avatar);
      } else {
        localStorage.removeItem('avatar');
      }
    }
  }
});

export { api };
