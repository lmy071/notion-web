<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import NotionBlock from '../components/NotionBlock.vue';
import { 
  FileText, 
  ChevronLeft, 
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Layout
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { databaseId, pageId } = route.params;

// 判断是否是工作区页面 (没有 databaseId)
const isWorkspacePage = computed(() => !databaseId);

const blocks = ref([]);
const loading = ref(true);
const synced = ref(true);
const syncMessage = ref('');
const notifications = ref([]);

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const fetchPageDetail = async () => {
  loading.value = true;
  synced.value = true;
  try {
    const endpoint = isWorkspacePage.value 
      ? `/notion/page/${pageId}` 
      : `/data/${databaseId}/page/${pageId}`;
      
    const response = await api.get(endpoint, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      if (response.data.synced) {
        blocks.value = response.data.data;
      } else {
        synced.value = false;
        syncMessage.value = response.data.message;
      }
    } else {
      notify(response.data.message || '获取详情失败', 'error');
    }
  } catch (error) {
    console.error('Fetch detail error:', error);
    notify('获取页面详情失败', 'error');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (isWorkspacePage.value) {
    router.push('/workspace');
  } else {
    router.push(`/data/${databaseId}`);
  }
};

const triggerSync = async () => {
  loading.value = true;
  try {
    const endpoint = isWorkspacePage.value 
      ? `/notion/page/${pageId}/sync` 
      : `/data/${databaseId}/page/${pageId}/sync`;
      
    const response = await api.post(endpoint, {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      notify('同步成功');
      await fetchPageDetail();
    } else {
      notify(response.data.message || '同步失败', 'error');
    }
  } catch (error) {
    notify('同步请求失败', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPageDetail);
</script>

<template>
  <div class="page-detail-container">
    <main>
      <header class="detail-header">
        <button @click="goBack" class="back-btn ghost">
          <ChevronLeft :size="20" />
          <span>返回{{ isWorkspacePage ? '工作区' : '列表' }}</span>
        </button>
        <div class="title-section">
          <Layout v-if="isWorkspacePage" :size="24" color="var(--primary)" />
          <FileText v-else :size="24" color="var(--primary)" />
          <h1>{{ isWorkspacePage ? '工作区页面分析' : '页面详情分析' }}</h1>
        </div>
      </header>

      <TechCard class="content-card glass">
        <div v-if="loading" class="loading-state">
          <RefreshCw :size="48" class="spinning" color="var(--primary)" />
          <p>正在获取节点结构...</p>
        </div>
        
        <div v-else-if="!synced" class="unsynced-state">
          <AlertTriangle :size="48" color="#f59e0b" />
          <h2>页面尚未同步</h2>
          <p>{{ syncMessage }}</p>
          <div class="actions">
            <button @click="triggerSync" class="primary-btn">立即同步</button>
            <button @click="goBack" class="ghost">返回</button>
          </div>
        </div>

        <div v-else class="notion-content">
          <div v-if="blocks.length === 0" class="empty-state">
            <p>该页面没有可显示的内容块</p>
            <button @click="triggerSync" class="ghost-btn">
              <RefreshCw :size="16" />
              <span>重新同步</span>
            </button>
          </div>

          <div class="blocks-container">
            <NotionBlock 
              v-for="block in blocks" 
              :key="block.id" 
              :block="block" 
            />
          </div>
        </div>
      </TechCard>
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
.page-detail-container {
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-dim);
}

.back-btn:hover {
  color: var(--primary);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h1 {
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.content-card {
  padding: 3rem;
  min-height: 500px;
}

.notion-content {
  color: var(--text);
  line-height: 1.6;
}

.notion-block {
  margin-bottom: 1rem;
}

h1 { font-size: 2rem; margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; color: var(--primary); }
h2 { font-size: 1.5rem; margin-top: 1.5rem; color: var(--primary); opacity: 0.9; }
h3 { font-size: 1.25rem; margin-top: 1.2rem; color: var(--primary); opacity: 0.8; }
p { font-size: 1rem; margin-bottom: 0.8rem; }

.list-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.bullet {
  color: var(--primary);
  font-weight: bold;
}

.nested-blocks {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  border-left: 1px solid var(--border);
  padding-left: 1rem;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  position: relative;
  overflow-x: auto;
  border: 1px solid var(--border);
}

.lang-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  color: var(--primary);
  text-transform: uppercase;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.todo-item .checked {
  text-decoration: line-through;
  opacity: 0.5;
}

blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 1.5rem;
  font-style: italic;
  margin: 1.5rem 0;
  color: var(--text-dim);
}

.toggle-block summary {
  cursor: pointer;
  font-weight: bold;
  color: var(--primary);
  outline: none;
}

.image-block {
  margin: 2rem 0;
  text-align: center;
}

.image-block img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.caption {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-top: 0.5rem;
}

.unsupported-block {
  font-size: 0.8rem;
  color: var(--text-dim);
  opacity: 0.5;
  font-style: italic;
}

.type-tag {
  color: var(--primary);
  margin-right: 0.5rem;
}

.loading-state, .unsynced-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1.5rem;
  color: var(--text-dim);
}

.unsynced-state h2 {
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

:deep(.notion-link) {
  color: var(--primary);
  text-decoration: underline;
}

:deep(.notion-link:hover) {
  color: white;
}
</style>
