<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechModal from '../components/TechModal.vue';
import TechToast from '../components/TechToast.vue';
import { 
  BarChart2, 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Users,
  Lock,
  Globe,
  Edit,
  Trash2,
  Plus,
  Eye,
  RefreshCw,
  Settings,
  Activity
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// State
const charts = ref([]);
const loading = ref(false);
const notifications = ref([]);
const showDeleteModal = ref(false);
const chartToDelete = ref(null);

// Chart type icons mapping
const chartTypeIcons = {
  line: LineChart,
  bar: BarChart3,
  pie: PieChart,
  area: TrendingUp
};

// Fetch charts
const fetchCharts = async () => {
  loading.value = true;
  try {
    const response = await api.get('/charts', {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      charts.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch charts:', error);
    notify('获取图表列表失败', 'error');
  }
  loading.value = false;
};

// Check if user can view chart
const canViewChart = (chart) => {
  // Admin can view all charts
  if (authStore.role === 'admin') return true;
  
  // Owner can view their own charts
  if (chart.created_by === authStore.userId) return true;
  
  // Check visibility
  if (chart.permissions.visibility === 'public') return true;
  
  if (chart.permissions.visibility === 'shared') {
    // Check if user is in allowed users
    if (chart.permissions.allowedUsers && chart.permissions.allowedUsers.includes(authStore.userId)) {
      return true;
    }
    
    // Check if user's role is in allowed roles
    if (chart.permissions.allowedRoles && chart.permissions.allowedRoles.includes(authStore.role)) {
      return true;
    }
  }
  
  return false;
};

// Get visibility icon
const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case 'private': return Lock;
    case 'shared': return Users;
    case 'public': return Globe;
    default: return Lock;
  }
};

// Get visibility text
const getVisibilityText = (visibility) => {
  switch (visibility) {
    case 'private': return '私有';
    case 'shared': return '共享';
    case 'public': return '公开';
    default: return '私有';
  }
};

// Navigate to chart view
const viewChart = (chart) => {
  if (!canViewChart(chart)) {
    notify('您没有权限查看此图表', 'error');
    return;
  }
  router.push(`/charts/${chart.id}`);
};

// Navigate to chart builder for editing
const editChart = (chart) => {
  if (chart.created_by !== authStore.userId && authStore.role !== 'admin') {
    notify('您没有权限编辑此图表', 'error');
    return;
  }
  router.push(`/charts/builder/${chart.id}`);
};

// Delete chart
const confirmDelete = (chart) => {
  if (chart.created_by !== authStore.userId && authStore.role !== 'admin') {
    notify('您没有权限删除此图表', 'error');
    return;
  }
  chartToDelete.value = chart;
  showDeleteModal.value = true;
};

const deleteChart = async () => {
  if (!chartToDelete.value) return;
  
  try {
    const response = await api.delete(`/charts/${chartToDelete.value.id}`, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      notify('图表删除成功');
      showDeleteModal.value = false;
      chartToDelete.value = null;
      await fetchCharts();
    }
  } catch (error) {
    notify('删除图表失败', 'error');
  }
};

// Notification system
const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

onMounted(() => {
  fetchCharts();
});
</script>

<template>
  <div class="charts-management-page">
    <main>
      <header class="page-header">
        <div class="header-info">
          <BarChart2 :size="32" color="var(--primary)" />
          <div>
            <h1>图表管理中心</h1>
            <p>管理和配置您的数据可视化图表</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="router.push('/charts/builder')" class="primary">
            <Plus :size="18" />
            <span>新建图表</span>
          </button>
          <button @click="fetchCharts" class="ghost">
            <RefreshCw :class="{ spinning: loading }" :size="18" />
            <span>刷新</span>
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <RefreshCw :size="48" class="spinning" color="var(--primary)" />
        <p>正在加载图表列表...</p>
      </div>

      <div v-else-if="charts.length === 0" class="empty-state">
        <BarChart2 :size="64" opacity="0.2" />
        <h3>暂无图表配置</h3>
        <p>点击"新建图表"开始创建您的第一个数据可视化图表</p>
        <button @click="router.push('/charts/builder')" class="primary">
          <Plus :size="18" />
          <span>创建图表</span>
        </button>
      </div>

      <div v-else class="charts-grid">
        <TechCard 
          v-for="chart in charts" 
          :key="chart.id" 
          class="chart-card"
          :class="{ 'no-permission': !canViewChart(chart) }"
        >
          <div class="card-header">
            <div class="chart-type-icon">
              <component :is="chartTypeIcons[chart.type] || BarChart2" :size="24" color="var(--primary)" />
            </div>
            <div class="chart-info">
              <h3>{{ chart.title }}</h3>
              <p v-if="chart.description">{{ chart.description }}</p>
            </div>
            <div class="visibility-badge" :class="chart.permissions.visibility">
              <component :is="getVisibilityIcon(chart.permissions.visibility)" :size="14" />
              <span>{{ getVisibilityText(chart.permissions.visibility) }}</span>
            </div>
          </div>

          <div class="chart-meta">
            <div class="meta-item">
              <span class="label">数据源:</span>
              <span class="value">{{ chart.dataSource || '未指定' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">类型:</span>
              <span class="value">{{ chart.type || '未知' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(chart.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">创建者:</span>
              <span class="value">{{ chart.created_by === authStore.userId ? '我' : '其他用户' }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button 
              @click="viewChart(chart)" 
              class="view-btn"
              :disabled="!canViewChart(chart)"
            >
              <Eye :size="16" />
              <span>查看</span>
            </button>
            
            <button 
              @click="editChart(chart)" 
              class="edit-btn"
              :disabled="chart.created_by !== authStore.userId && authStore.role !== 'admin'"
            >
              <Edit :size="16" />
              <span>编辑</span>
            </button>
            
            <button 
              @click="confirmDelete(chart)" 
              class="delete-btn"
              :disabled="chart.created_by !== authStore.userId && authStore.role !== 'admin'"
            >
              <Trash2 :size="16" />
              <span>删除</span>
            </button>
          </div>
        </TechCard>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <TechModal 
      :show="showDeleteModal" 
      title="确认删除图表" 
      @close="showDeleteModal = false"
    >
      <div class="delete-confirmation">
        <p>您确定要删除图表 "{{ chartToDelete?.title }}" 吗？</p>
        <p class="warning">此操作不可恢复，所有配置将被永久删除。</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="ghost">取消</button>
          <button @click="deleteChart" class="delete-btn">确认删除</button>
        </div>
      </div>
    </TechModal>

    <!-- Notifications Container -->
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
.charts-management-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-info h1 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text);
}

.header-info p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.primary, .ghost, .view-btn, .edit-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.primary {
  background: var(--primary);
  color: #0f172a;
  border-color: var(--primary);
}

.primary:hover {
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}

.ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  gap: 1.5rem;
  color: var(--text-dim);
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: var(--text);
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.chart-card:hover {
  border-color: var(--primary);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
}

.chart-card.no-permission {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.chart-type-icon {
  padding: 0.75rem;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.chart-info {
  flex: 1;
}

.chart-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text);
  font-size: 1.1rem;
}

.chart-info p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.85rem;
  line-height: 1.4;
}

.visibility-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.visibility-badge.private {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.visibility-badge.shared {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.visibility-badge.public {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.chart-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.meta-item .label {
  color: var(--text-dim);
}

.meta-item .value {
  color: var(--text);
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.view-btn,
.edit-btn,
.delete-btn {
  flex: 1;
  justify-content: center;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.view-btn {
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
  border-color: rgba(56, 189, 248, 0.2);
}

.view-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #0f172a;
}

.view-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.2);
}

.edit-btn:hover:not(:disabled) {
  background: #fbbf24;
  color: #0f172a;
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.delete-btn:hover:not(:disabled) {
  background: #ef4444;
  color: #0f172a;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-confirmation {
  padding: 1.5rem;
}

.delete-confirmation p {
  margin: 0 0 1rem 0;
  color: var(--text);
}

.delete-confirmation .warning {
  color: #ef4444;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.notifications-container {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 2000;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>