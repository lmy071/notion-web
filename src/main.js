import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/base.css';
import { initMonitoring } from './utils/monitoring';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// 初始化前端性能与错误监控
initMonitoring(app);

app.mount('#app');
