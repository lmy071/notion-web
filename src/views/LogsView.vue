<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, api } from '../stores/auth';
import { 
  Terminal, 
  ChevronLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Globe,
  Code
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { formatDate } from '../utils/date';

const router = useRouter();
const authStore = useAuthStore();
const logs = ref([]);
const loading = ref(false);

const fetchLogs = async () => {
  loading.value = true;
  try {
    const response = await api.get('/logs', {
      headers: { 'x-user-id': authStore.userId }
    });
    logs.value = response.data.data;
  } catch (error) {
    console.error('获取日志失败:', error);
  }
  loading.value = false;
};

const formatBody = (body) => {
  if (!body) return '无数据';
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return body;
  }
};

onMounted(fetchLogs);
</script>

<template>
  <div class="logs-page">
    <main>
      <header class="page-header">
        <div class="title-info">
          <Terminal :size="32" color="var(--primary)" />
          <div>
            <h1>日志审计终端</h1>
            <p>实时监控所有同步任务的底层交互数据</p>
          </div>
        </div>
        <button @click="fetchLogs" class="ghost refresh-btn" :disabled="loading">
          <RefreshCw :size="18" :class="{ spinning: loading }" />
          <span>刷新实时日志</span>
        </button>
      </header>
      <div class="logs-container glass">
        <div v-if="logs.length === 0" class="empty-logs">
          <Terminal :size="64" opacity="0.1" />
          <p>当前无同步日志记录</p>
        </div>
        
        <div v-else class="log-list">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-header">
              <div class="status-indicator" :class="log.is_success ? 'success' : 'error'">
                <CheckCircle2 v-if="log.is_success" :size="16" />
                <AlertCircle v-else :size="16" />
                <span>{{ log.status_code }}</span>
              </div>
              <div class="method-url">
                <span class="method">{{ log.method }}</span>
                <span class="url">{{ log.url }}</span>
              </div>
              <div class="time">
                <Clock :size="14" />
                <span>{{ formatDate(log.created_at) }}</span>
              </div>
            </div>
            
            <div class="log-details">
              <div class="detail-section">
                <div class="section-title">
                  <Code :size="14" />
                  <span>请求参数</span>
                </div>
                <pre class="code-block">{{ formatBody(log.params) }}</pre>
              </div>
              
              <div class="detail-section">
                <div class="section-title">
                  <Globe :size="14" />
                  <span>响应数据</span>
                </div>
                <pre class="code-block">{{ formatBody(log.response_body) }}</pre>
              </div>
              
              <div v-if="log.error_message" class="detail-section error">
                <div class="section-title">
                  <AlertCircle :size="14" />
                  <span>异常信息</span>
                </div>
                <pre class="code-block">{{ log.error_message }}</pre>
              </div>
            </div>
            <div class="hud-line"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.logs-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.title-info h1 {
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.title-info p {
  font-size: 0.75rem;
  color: var(--primary);
  opacity: 0.7;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.logs-container {
  border-radius: 12px;
  min-height: 70vh;
  overflow: hidden;
}

.empty-logs {
  height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--text-dim);
  letter-spacing: 2px;
}

.log-list {
  padding: 1.5rem;
}

.log-item {
  margin-bottom: 1rem;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 0;
  font-size: 0.9rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
  min-width: 80px;
}

.status-indicator.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-indicator.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.method-url {
  flex: 1;
  display: flex;
  gap: 1rem;
  font-family: monospace;
}

.method {
  color: var(--primary);
  font-weight: bold;
}

.url {
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-dim);
  font-size: 0.8rem;
}

.log-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.detail-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-section.error {
  grid-column: span 2;
  border-color: rgba(239, 68, 68, 0.2);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.code-block {
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  color: #94a3b8;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Custom Scrollbar for code blocks */
.code-block::-webkit-scrollbar {
  width: 4px;
}

.code-block::-webkit-scrollbar-track {
  background: transparent;
}

.code-block::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .log-details {
    grid-template-columns: 1fr;
  }
  .detail-section.error {
    grid-column: span 1;
  }
}
</style>
