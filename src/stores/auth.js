import { defineStore } from 'pinia';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userId: localStorage.getItem('userId') || null
  }),
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/login', { username, password });
        if (response.data.success) {
          this.user = response.data.user;
          this.userId = response.data.user.id;
          localStorage.setItem('userId', this.userId);
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
      localStorage.removeItem('userId');
    }
  }
});

export { api };
