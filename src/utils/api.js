import axios from 'axios';
import { StatusCode } from './constants';
import { useNotificationStore } from '../stores/notification';
import { getActivePinia } from 'pinia';

/**
 * 前端全局 Axios 实例
 * 封装了基础路径、超时时间以及通用的响应处理
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30秒超时
});

const notify = (message, type = 'error') => {
  try {
    if (getActivePinia()) {
      const store = useNotificationStore();
      store.notify(message, type);
      return;
    }
  } catch (_) {}
  console.warn('[Notify]', type, message);
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 如果业务状态码不是 SUCCESS，则进行统一提示
    if (res.code !== StatusCode.SUCCESS) {
      // 特殊处理：未授权跳转登录（如果后续有登录页的话）
      if (res.code === StatusCode.UNAUTHORIZED) {
        console.warn('User unauthorized, please login.');
        // router.push('/login');
      }
      
      // 弹出错误提示
      notify(res.message || '请求失败', 'error');
      
      // 如果需要让调用方捕获错误，可以 reject
      // return Promise.reject(new Error(res.message || 'Error'));
    }

    return response;
  },
  (error) => {
    let message = '网络请求失败';

    if (error.response) {
      const res = error.response.data;
      message = res.message || message;
      
      // 处理 HTTP 状态码
      if (error.response.status === 401) {
        console.warn('Unauthorized access');
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
    }

    notify(message, 'error');
    return Promise.reject(error);
  }
);

export default api;
