import { defineStore } from 'pinia';
import api from '../utils/api';

interface User {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  userId: string | null;
  role: string | null;
  avatar: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    userId: localStorage.getItem('userId') || null,
    role: localStorage.getItem('role') || null,
    avatar: localStorage.getItem('avatar') || null
  }),
  actions: {
    async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await api.post('/login', { username, password });
        // Assuming api.ts already handles basic response structure and status codes
        const data = response.data;
        if (data) {
          this.user = data.user;
          this.userId = data.user.id;
          this.role = data.user.role;
          this.avatar = data.user.avatar || null;
          
          if (this.userId) localStorage.setItem('userId', this.userId);
          if (this.role) localStorage.setItem('role', this.role);
          if (this.avatar) localStorage.setItem('avatar', this.avatar);
          
          return { success: true };
        }
        return { success: false, message: 'Invalid response' };
      } catch (error: any) {
        console.error('Login failed:', error);
        return { success: false, message: error.message || 'Login failed' };
      }
    },
    async register(username: string, password: string): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await api.post('/register', { username, password });
        return { 
          success: true, 
          message: response.data?.message 
        };
      } catch (error: any) {
        console.error('Registration failed:', error);
        return { 
          success: false, 
          message: error.message || 'Registration failed' 
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
      localStorage.removeItem('token');
    },
    updateAvatar(avatar: string | null) {
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
