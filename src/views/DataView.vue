<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import { formatDate } from '../utils/date';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import { 
  Database, 
  ChevronLeft, 
  Search, 
  RefreshCw, 
  Filter,
  Download,
  Table as TableIcon,
  Sliders,
  Plus,
  Trash2,
  X as XIcon,
  ChevronRight
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const databaseId = route.params.databaseId;

const data = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const notifications = ref([]);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(50);
const totalItems = ref(0);
const totalPages = ref(0);
const syncLoading = ref({}); // 存储每个 pageId 的同步状态

// 高级检索状态
const showAdvancedSearch = ref(false);
const advancedFilters = ref([
  { field: '', value: '' }
]);

// 监听搜索和分页大小变化
watch([searchQuery, pageSize], () => {
  fetchData(1);
});

// 监听高级过滤器的变化 (深层监听)
watch(advancedFilters, () => {
  if (showAdvancedSearch.value) {
    fetchData(1);
  }
}, { deep: true });

const addFilter = () => {
  advancedFilters.value.push({ field: '', value: '' });
};

const removeFilter = (index) => {
  advancedFilters.value.splice(index, 1);
  if (advancedFilters.value.length === 0) {
    addFilter();
  }
};

const resetFilters = () => {
  advancedFilters.value = [{ field: '', value: '' }];
  searchQuery.value = '';
  fetchData(1);
};

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const formatCellValue = (val, col) => {
  if (val === null || val === undefined) return '-';
  
  if (col.toLowerCase().includes('id')) return val;
  
  if (typeof val === 'string' && val.length > 10 && !isNaN(Date.parse(val))) {
    if (/^\d+$/.test(val)) return val;
    return formatDate(val);
  }
  
  return val;
};

const fetchData = async (page = 1) => {
  // 确保 page 是数字，避免被事件对象覆盖
  const pageNum = typeof page === 'number' ? page : 1;
  
  loading.value = true;
  currentPage.value = pageNum;
  try {
    const params = {
      page: pageNum,
      limit: pageSize.value,
      search: searchQuery.value,
      filters: JSON.stringify(advancedFilters.value.filter(f => f.field && f.value))
    };

    const response = await api.get(`/data/${databaseId}`, {
      params,
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      data.value = response.data.data;
      totalItems.value = response.data.pagination.total;
      totalPages.value = response.data.pagination.totalPages;
    } else {
      notify(response.data.message || '获取数据失败', 'error');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '网络请求失败';
    notify(errorMsg, 'error');
  }
  loading.value = false;
};

// 提取列名 (排除系统字段)
const columns = computed(() => {
  if (data.value.length === 0) return [];
  return Object.keys(data.value[0]).filter(key => key !== 'synced_at');
});

const exportCSV = () => {
  if (data.value.length === 0) return;
  
  const headers = columns.value.join(',');
  const rows = data.value.map(row => 
    columns.value.map(col => `"${String(row[col]).replace(/"/g, '""')}"`).join(',')
  );
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `notion_data_${databaseId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify('数据已导出为 CSV');
};

const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return;
  fetchData(page);
};

const goToPageDetail = async (pageId) => {
  // 不再自动触发同步，直接跳转到详情页
  // 详情页会根据数据库是否有数据来决定是否提示同步
  router.push(`/data/${databaseId}/page/${pageId}`);
};

const syncPageDetail = async (pageId) => {
  if (syncLoading.value[pageId]) return;
  
  syncLoading.value[pageId] = true;
  try {
    const response = await api.post(`/data/${databaseId}/page/${pageId}/sync`, {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      notify(`页面详情同步成功 (${response.data.count} 个区块)`);
    } else {
      notify(response.data.message || '同步失败', 'error');
    }
  } catch (error) {
    console.error('Sync detail error:', error);
    notify('同步页面详情失败', 'error');
  } finally {
    syncLoading.value[pageId] = false;
  }
};

onMounted(() => fetchData(1));
</script>

<template>
  <div class="data-page">
    <main>
      <header class="data-header">
        <div class="title-section">
          <TableIcon :size="32" color="var(--primary)" />
          <div>
            <h1>数据浏览: {{ databaseId }}</h1>
            <p>
              总记录数: {{ totalItems }} 
              <span v-if="searchQuery || advancedFilters.some(f => f.field && f.value)">
                (已应用过滤)
              </span>
            </p>
          </div>
        </div>
        
        <div class="search-actions">
          <div class="search-box glass">
            <Search :size="18" class="search-icon" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="快速全局搜索..." 
            />
          </div>
          <button 
            @click="showAdvancedSearch = !showAdvancedSearch" 
            class="ghost action-btn" 
            :class="{ active: showAdvancedSearch }"
          >
            <Sliders :size="18" />
            <span>高级检索</span>
          </button>
          <button @click="exportCSV" class="ghost action-btn" title="导出 CSV">
            <Download :size="18" />
            <span>导出</span>
          </button>
        </div>
      </header>

      <!-- 高级检索面板 -->
      <Transition name="slide-down">
        <div v-if="showAdvancedSearch" class="advanced-search-panel glass">
          <div class="panel-header">
            <div class="header-title">
              <Filter :size="16" />
              <span>多维字段检索</span>
            </div>
            <button @click="resetFilters" class="reset-link">重置所有条件</button>
          </div>
          
          <div class="filter-grid">
            <div v-for="(filter, index) in advancedFilters" :key="index" class="filter-row">
              <div class="select-wrapper glass">
                <select v-model="filter.field">
                  <option value="">选择字段</option>
                  <option v-for="col in columns" :key="col" :value="col">
                    {{ col.replace(/_/g, ' ').toUpperCase() }}
                  </option>
                </select>
              </div>
              <div class="input-wrapper glass">
                <input v-model="filter.value" type="text" placeholder="匹配内容..." />
              </div>
              <button @click="removeFilter(index)" class="remove-btn" title="移除条件">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
          
          <div class="panel-footer">
            <button @click="addFilter" class="add-filter-btn">
              <Plus :size="16" />
              <span>添加过滤维度</span>
            </button>
            <div class="filter-count">
              当前激活维度: {{ advancedFilters.filter(f => f.field && f.value).length }}
            </div>
          </div>
        </div>
      </Transition>

      <div class="table-container glass">
        <div v-if="loading" class="loading-state">
          <RefreshCw :size="48" class="spinning" color="var(--primary)" />
          <p>正在读取核心数据...</p>
        </div>
        
        <div v-else-if="data.length === 0" class="empty-state">
          <Filter :size="48" opacity="0.2" />
          <p>未找到匹配的数据节点</p>
        </div>

        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="col in columns" :key="col">{{ col.replace(/_/g, ' ').toUpperCase() }}</th>
                <th class="action-th">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in data" :key="idx">
                <td v-for="col in columns" :key="col">
                  <span 
                    v-if="col.toLowerCase().includes('id')" 
                    class="id-cell clickable"
                    :class="{ loading: syncLoading[row[col]] }"
                    @click="goToPageDetail(row[col])"
                    title="点击自动同步并查看详情"
                  >
                    <RefreshCw v-if="syncLoading[row[col]]" :size="10" class="spinning mini-icon" />
                    {{ row[col] }}
                  </span>
                  <span v-else>{{ formatCellValue(row[col], col) }}</span>
                </td>
                <td class="action-td">
                  <button 
                    class="mini-sync-btn" 
                    @click="syncPageDetail(row[columns.find(c => c.toLowerCase().includes('id'))])"
                    :disabled="syncLoading[row[columns.find(c => c.toLowerCase().includes('id'))]]"
                  >
                    <RefreshCw :size="12" :class="{ spinning: syncLoading[row[columns.find(c => c.toLowerCase().includes('id'))]] }" />
                    <span>同步详情</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控制 -->
        <div v-if="totalPages > 0" class="pagination-footer glass">
          <div class="page-size-selector">
            <span>每页显示:</span>
            <select v-model="pageSize">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </div>
          
          <div class="page-controls">
            <button 
              @click="handlePageChange(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              <ChevronLeft :size="16" />
            </button>
            
            <div class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页
            </div>
            
            <button 
              @click="handlePageChange(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
          
          <div class="total-count">
            共 {{ totalItems }} 条记录
          </div>
        </div>
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
.data-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.title-section h1 {
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.title-section p {
  font-size: 0.75rem;
  color: var(--primary);
  opacity: 0.7;
}

.search-actions {
  display: flex;
  gap: 1rem;
}

.search-box {
  position: relative;
  width: 300px;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border-radius: 4px;
}

.search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary);
  opacity: 0.6;
}

.search-box input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: 0.9rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.action-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.advanced-search-panel {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.6);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.reset-link {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
}

.reset-link:hover {
  color: var(--primary);
}

.filter-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.select-wrapper, .input-wrapper {
  padding: 0.5rem;
  border-radius: 4px;
  flex: 1;
}

.select-wrapper select, .input-wrapper input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: 0.9rem;
}

.select-wrapper select option {
  background: #0f172a;
}

.remove-btn {
  color: #ef4444;
  opacity: 0.6;
  padding: 0.5rem;
}

.remove-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.add-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
}

.add-filter-btn:hover {
  text-decoration: underline;
}

.filter-count {
  font-size: 0.75rem;
  color: var(--text-dim);
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(-10px);
}

.table-container {
  border-radius: 8px;
  border: 1px solid var(--border);
  min-height: 400px;
  position: relative;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  max-height: calc(100vh - 350px);
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-dim);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  outline: none;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.page-btn {
  padding: 0.4rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-family: monospace;
  letter-spacing: 1px;
}

.total-count {
  font-size: 0.75rem;
  opacity: 0.6;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th {
  position: sticky;
  top: 0;
  background: rgba(10, 15, 25, 0.95);
  backdrop-filter: blur(10px);
  text-align: left;
  padding: 1rem;
  color: var(--primary);
  font-family: monospace;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border);
  z-index: 10;
}

td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-dim);
}

tr:hover td {
  background: rgba(56, 189, 248, 0.05);
  color: white;
}

.id-cell {
  font-family: monospace;
  font-size: 0.7rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.id-cell.clickable {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.id-cell.clickable:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--primary);
  color: white;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.id-cell.loading {
  opacity: 0.7;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.mini-icon {
  color: var(--primary);
}

.action-th, .action-td {
  text-align: center !important;
  width: 120px;
}

.mini-sync-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: var(--primary);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.mini-sync-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.mini-sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
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

.notifications-container {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 2000;
}
</style>
