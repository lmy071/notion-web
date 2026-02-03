import api from './api';

const report = async (type, event, data) => {
  const userId = localStorage.getItem('userId');
  try {
    await api.post('/monitoring', {
      type,
      event,
      url: window.location.href,
      ua: navigator.userAgent,
      data
    }, {
      headers: userId ? { 'x-user-id': userId } : {}
    });
  } catch (error) {
    // 监控自身失败不应影响业务
    console.warn('Monitoring report failed:', error);
  }
};

export const initMonitoring = (app) => {
  // 1. 性能监控
  window.addEventListener('load', () => {
    // 延迟上报，确保数据稳定
    setTimeout(() => {
      const perfData = window.performance.timing;
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart, // DNS 解析耗时
        tcp: perfData.connectEnd - perfData.connectStart, // TCP 连接耗时
        ttfb: perfData.responseStart - perfData.navigationStart, // 首字节时间
        domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart, // DOM 构建完成耗时
        load: perfData.loadEventEnd - perfData.navigationStart, // 页面完全加载耗时
      };
      
      // 使用更现代的 PerformanceObserver 获取 Paint 数据
      const paintMetrics = {};
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        paintMetrics[entry.name] = entry.startTime;
      });

      report('performance', 'page_load', { ...metrics, ...paintMetrics });
    }, 2000);
  });

  // 2. 运行时错误监控
  window.onerror = (message, source, lineno, colno, error) => {
    report('error', 'js_error', {
      message,
      source,
      lineno,
      colno,
      stack: error?.stack
    });
  };

  // 3. 未捕获的 Promise 错误
  window.onunhandledrejection = (event) => {
    report('error', 'promise_rejection', {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack
    });
  };

  // 4. Vue 错误捕获
  if (app) {
    app.config.errorHandler = (err, vm, info) => {
      report('error', 'vue_error', {
        message: err.message,
        stack: err.stack,
        info
      });
      // 依然在控制台输出错误，方便开发调试
      console.error(err);
    };
  }
};
