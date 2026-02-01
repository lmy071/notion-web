<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import { 
  Database, 
  ChevronLeft, 
  RefreshCw,
  Eye,
  Calendar,
  ExternalLink,
  TableProperties
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { databaseId } = route.params;

const loading = ref(true);
const databaseInfo = ref(null);
const results = ref([]);
const properties = ref({});
const notifications = ref([]);

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const fetchPreviewData = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/notion/database/${databaseId}/preview`, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      databaseInfo.value = response.data.database;
      results.value = response.data.results;
      properties.value = response.data.database.properties;
    } else {
      notify(response.data.message || '获取预览数据失败', 'error');
    }
  } catch (error) {
    console.error('Fetch preview error:', error);
    notify('获取实时数据失败', 'error');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/workspace');
};

const getPropertyValue = (page, propertyName) => {
  const prop = page.properties[propertyName];
  if (!prop) return '-';

  switch (prop.type) {
    case 'title':
      return prop.title.map(t => t.plain_text).join('') || '未命名';
    case 'rich_text':
      return prop.rich_text.map(t => t.plain_text).join('');
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name || '-';
    case 'multi_select':
      return prop.multi_select.map(s => s.name).join(', ');
    case 'date':
      return prop.date?.start || '-';
    case 'checkbox':
      return prop.checkbox ? '✅' : '❌';
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    case 'status':
      return prop.status?.name || '-';
    default:
      return '[不支持预览的类型]';
  }
};

const getTitle = computed(() => {
  if (!databaseInfo.value) return '数据库实时预览';
  return databaseInfo.value.title?.[0]?.plain_text || '未命名数据库';
});

const sortedProperties = computed(() => {
  if (!properties.value) return [];
  // 确保 title 类型排在最前面
  return Object.entries(properties.value).sort((a, b) => {
    if (a[1].type === 'title') return -1;
    if (b[1].type === 'title') return 1;
    return 0;
  });
});

onMounted(fetchPreviewData);
</script>

<template>
  <div class="preview-container">
    <main>
      <header class="preview-header">
        <button @click="goBack" class="back-btn ghost">
          <ChevronLeft :size="20" />
          <span>返回工作区</span>
        </button>
        <div class="title-section">
          <Eye :size="32" color="var(--primary)" />
          <div class="header-text">
            <h1>{{ getTitle }}</h1>
            <p class="subtitle">实时数据预览 · 不进行持久化存储</p>
          </div>
          <button @click="fetchPreviewData" class="refresh-btn" :disabled="loading">
            <RefreshCw :size="20" :class="{ spinning: loading }" />
          </button>
        </div>
      </header>

      <TechCard class="table-card glass">
        <div v-if="loading" class="loading-state">
          <RefreshCw :size="48" class="spinning" color="var(--primary)" />
          <p>正在从 Notion 实时获取数据...</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="[name, prop] in sortedProperties" :key="name">
                  <div class="th-content">
                    <TableProperties :size="14" opacity="0.6" />
                    <span>{{ name }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="page in results" :key="page.id">
                <td v-for="[name, prop] in sortedProperties" :key="name">
                  <div class="cell-content">
                    {{ getPropertyValue(page, name) }}
                  </div>
                </td>
              </tr>
              <tr v-if="results.length === 0">
                <td :colspan="sortedProperties.length" class="empty-cell">
                  数据库中没有记录
                </td>
              </tr>
            </tbody>
          </table>
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
.preview-container {
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.preview-header {
  margin-bottom: 2.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-dim);
  margin-bottom: 1.5rem;
  transition: color 0.3s;
}

.back-btn:hover {
  color: var(--primary);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-text h1 {
  font-size: 2rem;
  margin: 0 0 0.25rem 0;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--primary);
  opacity: 0.7;
  font-size: 0.9rem;
  margin: 0;
  font-family: monospace;
}

.refresh-btn {
  margin-left: auto;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid var(--primary);
  color: var(--primary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary);
  color: black;
  transform: rotate(180deg);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 70vh;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.preview-table th {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem 1.5rem;
  font-size: 0.85rem;
  color: var(--primary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.preview-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 0.9rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-table tr:hover td {
  background: rgba(56, 189, 248, 0.03);
}

.cell-content {
  color: var(--text);
}

.empty-cell {
  text-align: center;
  padding: 4rem !important;
  color: var(--text-dim);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1.5rem;
  color: var(--text-dim);
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>