export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}
