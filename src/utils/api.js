import axios from 'axios';

/**
 * 前端全局 Axios 实例
 * 封装了基础路径、超时时间以及通用的响应处理
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30秒超时
});

// 请求拦截器：可以在这里统一添加 Token 等
api.interceptors.request.use(
  (config) => {
    // 如果需要全局注入某个 header，可以在这里处理
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误提示或数据格式化
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 可以在这里做全局的错误通知
    console.error('[API Error]:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
