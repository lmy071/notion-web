<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import { 
  Search, 
  FileText, 
  Database, 
  ChevronRight, 
  RefreshCw,
  ExternalLink,
  Calendar,
  User
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const query = ref('');
const results = ref([]);
const loading = ref(false);
const syncLoading = ref({});
const notifications = ref([]);
const nextCursor = ref(null);
const hasMore = ref(false);

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const searchNotion = async (isLoadMore = false) => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    const params = {
      query: query.value,
      pageSize: 50
    };
    if (isLoadMore && nextCursor.value) {
      params.cursor = nextCursor.value;
    }

    const response = await api.get('/notion/search', {
      params,
      headers: { 'x-user-id': authStore.userId }
    });

    if (response.data.success) {
      const newResults = response.data.data.results;
      if (isLoadMore) {
        results.value = [...results.value, ...newResults];
      } else {
        results.value = newResults;
      }
      nextCursor.value = response.data.data.next_cursor;
      hasMore.value = response.data.data.has_more;
    } else {
      notify(response.data.message || '搜索失败', 'error');
    }
  } catch (error) {
    console.error('Search error:', error);
    notify('搜索请求失败', 'error');
  } finally {
    loading.value = false;
  }
};

const getTitle = (item) => {
  if (item.object === 'database') {
    return item.title?.[0]?.plain_text || '未命名数据库';
  }
  // 页面标题可能在 properties.title 或 properties.Name 中
  const titleProp = item.properties?.title || item.properties?.Name || item.properties?.Name;
  return titleProp?.title?.[0]?.plain_text || '未命名页面';
};

const getIcon = (item) => {
  if (item.icon) {
    if (item.icon.type === 'emoji') return item.icon.emoji;
    if (item.icon.type === 'external') return '🖼️';
    if (item.icon.type === 'file') return '📄';
  }
  return item.object === 'database' ? '🗂️' : '📄';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '未知';
  return new Date(dateStr).toLocaleString();
};

const syncAndGoToDetail = async (item) => {
  if (item.object !== 'page') {
    notify('目前仅支持查看页面详情', 'info');
    return;
  }

  const pageId = item.id;
  syncLoading.value[pageId] = true;
  
  try {
    // 自动触发同步
    const syncRes = await api.post(`/notion/page/${pageId}/sync`, {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (syncRes.data.success) {
      router.push(`/workspace/page/${pageId}`);
    } else {
      notify(syncRes.data.message || '同步失败', 'error');
    }
  } catch (error) {
    console.error('Sync error:', error);
    notify('同步详情失败', 'error');
  } finally {
    syncLoading.value[pageId] = false;
  }
};

onMounted(() => {
  searchNotion();
});
</script>

<template>
  <div class="workspace-container">
    <main>
      <header class="workspace-header">
        <div class="title-section">
          <Database :size="32" color="var(--primary)" />
          <h1>NOTION 工作区</h1>
        </div>
        <p class="subtitle">探索和管理您的 Notion 页面与数据库</p>
      </header>

      <div class="search-section">
        <div class="search-input-wrapper glass">
          <Search :size="20" class="search-icon" />
          <input 
            v-model="query" 
            type="text" 
            placeholder="搜索页面或数据库标题..." 
            @keyup.enter="searchNotion(false)"
          />
          <button @click="searchNotion(false)" class="search-btn" :disabled="loading">
            <RefreshCw v-if="loading" :size="18" class="spinning" />
            <span v-else>搜索</span>
          </button>
        </div>
      </div>

      <div class="results-grid">
        <div v-if="results.length === 0 && !loading" class="no-results glass">
          <FileText :size="48" opacity="0.5" />
          <p>没有找到相关内容</p>
        </div>

        <TechCard 
          v-for="item in results" 
          :key="item.id" 
          class="result-card glass"
          :class="{ 'database-item': item.object === 'database' }"
          @click="syncAndGoToDetail(item)"
        >
          <div class="card-content">
            <div class="item-icon">{{ getIcon(item) }}</div>
            <div class="item-info">
              <h3 class="item-title">{{ getTitle(item) }}</h3>
              <div class="item-meta">
                <span class="type-tag" :class="item.object">
                  {{ item.object === 'database' ? '数据库' : '页面' }}
                </span>
                <span class="meta-item">
                  <Calendar :size="14" />
                  {{ formatDate(item.last_edited_time) }}
                </span>
              </div>
            </div>
            <div class="action-icon">
              <RefreshCw v-if="syncLoading[item.id]" :size="20" class="spinning color-primary" />
              <ChevronRight v-else :size="20" />
            </div>
          </div>
        </TechCard>
      </div>

      <div v-if="hasMore" class="load-more">
        <button @click="searchNotion(true)" class="ghost-btn" :disabled="loading">
          <RefreshCw v-if="loading" :size="18" class="spinning" />
          <span v-else>加载更多</span>
        </button>
      </div>
    </main>

    <div class="notifications-container">
      <TechToast 
        v-for="n in notifications" 
        :key="n.id"
        :message="n.message"
        :type="n.type"
        @close="removeNotification(n.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.workspace-container {
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.workspace-header {
  margin-bottom: 3rem;
  text-align: center;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.title-section h1 {
  font-size: 2.5rem;
  letter-spacing: 4px;
  margin: 0;
}

.subtitle {
  color: var(--text-dim);
  font-size: 1.1rem;
}

.search-section {
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  border-radius: 50px;
  width: 100%;
  max-width: 600px;
  border: 1px solid var(--border);
}

.search-icon {
  color: var(--text-dim);
}

.search-input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.8rem 1rem;
  color: white;
  font-size: 1rem;
  outline: none;
}

.search-btn {
  background: var(--primary);
  color: black;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(56, 189, 248, 0.4);
}

.search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.result-card {
  cursor: pointer;
  transition: all 0.3s;
  padding: 1.5rem;
}

.result-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.item-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-dim);
}

.type-tag {
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.type-tag.page {
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
}

.type-tag.database {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-icon {
  color: var(--text-dim);
}

.no-results {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  color: var(--text-dim);
  gap: 1rem;
}

.load-more {
  margin-top: 3rem;
  display: flex;
  justify-content: center;
}

.ghost-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ghost-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.spinning {
  animation: spin 2s linear infinite;
}

.color-primary {
  color: var(--primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
