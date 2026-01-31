<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import TechCard from '../components/TechCard.vue';
import NotionBlock from '../components/NotionBlock.vue';
import { 
  FileText, 
  RefreshCw,
  Share2,
  AlertTriangle,
  Globe
} from 'lucide-vue-next';

const route = useRoute();
const { token } = route.params;

const pageData = ref(null);
const loading = ref(true);
const error = ref(null);

// 这里的 API 基础路径需要根据实际环境配置，通常是 /api
const API_BASE = '/api';

const fetchSharedPage = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(`${API_BASE}/public/shares/${token}`);
    if (response.data.success) {
      pageData.value = response.data.data;
    } else {
      error.value = response.data.message || '获取分享页面失败';
    }
  } catch (err) {
    console.error('Fetch shared page error:', err);
    if (err.response && err.response.status === 404) {
      error.value = '分享链接已失效或不存在';
    } else {
      error.value = '网络请求失败，请稍后再试';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSharedPage);
</script>

<template>
  <div class="shared-page-container">
    <nav class="public-nav">
      <div class="nav-content">
        <div class="logo">
          <Globe :size="20" color="var(--primary)" />
          <span>Notion Public Share</span>
        </div>
        <div class="status-badge" v-if="!loading && !error">
          <span class="dot"></span>
          公开访问中
        </div>
      </div>
    </nav>

    <main>
      <header v-if="pageData" class="detail-header">
        <div class="title-section">
          <FileText :size="24" color="var(--primary)" />
          <h1>{{ pageData.title }}</h1>
        </div>
      </header>

      <TechCard class="content-card glass">
        <div v-if="loading" class="loading-state">
          <RefreshCw :size="48" class="spinning" color="var(--primary)" />
          <p>正在加载分享内容...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <AlertTriangle :size="48" color="#ef4444" />
          <h2>访问受阻</h2>
          <p>{{ error }}</p>
        </div>

        <div v-else class="notion-content">
          <div v-if="pageData.blocks.length === 0" class="empty-state">
            <p>该页面没有可显示的内容块</p>
          </div>

          <div class="blocks-container">
            <NotionBlock 
              v-for="block in pageData.blocks" 
              :key="block.id" 
              :block="block" 
            />
          </div>
        </div>
      </TechCard>
      
      <footer class="public-footer">
        <p>Powered by Notion Sync Pro</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.shared-page-container {
  min-height: 100vh;
  background: #0a0a0c;
  color: var(--text);
  padding-bottom: 50px;
}

.public-nav {
  height: 60px;
  background: rgba(10, 10, 12, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
}

.nav-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h1 {
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.content-card {
  padding: 3rem;
  min-height: 500px;
}

.notion-content {
  line-height: 1.6;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1.5rem;
  color: var(--text-dim);
}

.error-state h2 {
  color: white;
  margin: 0;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.public-footer {
  margin-top: 3rem;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.8rem;
  opacity: 0.5;
}

@media (max-width: 640px) {
  .content-card {
    padding: 1.5rem;
  }
}
</style>
