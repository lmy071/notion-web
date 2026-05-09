import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { StatusCode } from './constants';
import { useNotificationStore } from '../stores/notification';
import { getActivePinia } from 'pinia';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 前端全局 Axios 实例
 * 封装了基础路径、超时时间以及通用的响应处理
 */
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30秒超时
});

const notify = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'error') => {
  try {
    if (getActivePinia()) {
      const store = useNotificationStore();
      store.notify(message, type);
      return;
    }
  } catch (_) {
    // Pinia not initialized yet
  }
  console.warn('[Notify]', type, message);
};

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在这里可以添加 Token 等鉴权逻辑
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    // 如果业务状态码不是 SUCCESS，则进行统一提示
    if (res.code !== StatusCode.SUCCESS) {
      // 特殊处理：未授权跳转登录
      if (res.code === StatusCode.UNAUTHORIZED) {
        console.warn('User unauthorized, please login.');
        localStorage.removeItem('token');
        // window.location.href = '/login';
      }
      
      // 弹出错误提示
      notify(res.message || '请求失败', 'error');
      
      // 返回 reject 状态，让调用处可以捕获异常
      return Promise.reject(new Error(res.message || 'Error'));
    }

    return response;
  },
  (error) => {
    let message = '网络请求失败';

    if (error.response) {
      const res = error.response.data as ApiResponse;
      message = res?.message || message;
      
      // 处理 HTTP 状态码
      if (error.response.status === 401) {
        console.warn('Unauthorized access');
        localStorage.removeItem('token');
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
    }

    notify(message, 'error');
    return Promise.reject(error);
  }
);

export default api;
