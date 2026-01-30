<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, api } from '../stores/auth';
import { useRouter } from 'vue-router';
import TechCard from '../components/TechCard.vue';
import TechModal from '../components/TechModal.vue';
import TechToast from '../components/TechToast.vue';
import { formatDate } from '../utils/date';
import { 
  Database, 
  RefreshCw, 
  Settings, 
  LogOut, 
  Activity,
  Cpu,
  Layers,
  Key,
  Hash,
  Terminal,
  Trash2,
  AlertTriangle,
  Layout,
  CheckCircle2,
  Shield
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const databases = ref([]);
const loading = ref(false);
const syncing = ref({});
const refreshing = ref({});
const syncingAll = ref(false);

// 弹窗状态
const showAddModal = ref(false);
const showSettingsModal = ref(false);
const showDeleteModal = ref(false);
const showRefreshModal = ref(false);

// 表单数据
const newDb = ref({ databaseId: '', name: '' });
const dbToDelete = ref(null);
const dbToRefresh = ref(null);
const config = ref({ apiKey: '', version: '2025-09-03' });
const formLoading = ref(false);

// 通知系统
const notifications = ref([]);
const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const fetchDatabases = async () => {
  loading.value = true;
  try {
    const response = await api.get('/databases', {
      headers: { 'x-user-id': authStore.userId }
    });
    databases.value = response.data.data;
  } catch (error) {
    console.error('获取数据库失败:', error);
  }
  loading.value = false;
};

const fetchConfigs = async () => {
  try {
    const response = await api.get('/configs', {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      config.value.apiKey = response.data.data.notion_api_key || '';
      config.value.version = response.data.data.notion_version || '2025-09-03';
    }
  } catch (error) {
    console.error('获取配置失败:', error);
  }
};

const handleAddDatabase = async () => {
  formLoading.value = true;
  try {
    const response = await api.post('/databases', newDb.value, {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      showAddModal.value = false;
      newDb.value = { databaseId: '', name: '' };
      notify('数据库连接已建立');
      await fetchDatabases();
    }
  } catch (error) {
    notify(error.response?.data?.message || '添加失败', 'error');
  }
  formLoading.value = false;
};

const handleSaveSettings = async () => {
  formLoading.value = true;
  try {
    const response = await api.post('/config', config.value, {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      showSettingsModal.value = false;
      notify('核心配置已更新');
    }
  } catch (error) {
    notify(error.response?.data?.message || '保存失败', 'error');
  }
  formLoading.value = false;
};

const triggerSync = async (databaseId) => {
  syncing.value[databaseId] = true;
  try {
    await api.post(`/sync/${databaseId}`, {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    notify('数据库同步完成');
    await fetchDatabases();
  } catch (error) {
    notify('同步失败: ' + (error.response?.data?.message || error.message), 'error');
  }
  syncing.value[databaseId] = false;
};

const confirmRefresh = (db) => {
  dbToRefresh.value = db;
  showRefreshModal.value = true;
};

const handleRefreshSchema = async () => {
  if (!dbToRefresh.value) return;
  
  const databaseId = dbToRefresh.value.database_id;
  refreshing.value[databaseId] = true;
  formLoading.value = true;
  
  try {
    const response = await api.post(`/databases/${databaseId}/refresh-schema`, {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      showRefreshModal.value = false;
      dbToRefresh.value = null;
      notify('表结构重构成功');
      await fetchDatabases();
    }
  } catch (error) {
    notify(error.response?.data?.message || '更新字段失败', 'error');
  }
  refreshing.value[databaseId] = false;
  formLoading.value = false;
};

const triggerSyncAll = async () => {
  syncingAll.value = true;
  try {
    await api.post('/sync', {}, {
      headers: { 'x-user-id': authStore.userId }
    });
    notify('全数据库同步指令已下发');
    await fetchDatabases();
  } catch (error) {
    notify('全量同步失败: ' + (error.response?.data?.message || error.message), 'error');
  }
  syncingAll.value = false;
};

const handleLogout = () => {
  authStore.logout();
  window.location.reload();
};

const confirmDelete = (db) => {
  dbToDelete.value = db;
  showDeleteModal.value = true;
};

const handleDeleteDatabase = async () => {
  if (!dbToDelete.value) return;
  
  formLoading.value = true;
  try {
    const response = await api.delete(`/databases/${dbToDelete.value.id}`, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      showDeleteModal.value = false;
      dbToDelete.value = null;
      notify('数据节点已成功断开', 'info');
      await fetchDatabases();
    }
  } catch (error) {
    notify(error.response?.data?.message || '删除失败', 'error');
  }
  formLoading.value = false;
};

onMounted(() => {
  fetchDatabases();
  fetchConfigs();
});
</script>

<template>
  <div class="dashboard">
    <nav class="glass">
      <div class="nav-content">
        <div class="logo">
          <Cpu :size="24" color="var(--primary)" />
          <span class="glow-text">Notion 核心</span>
        </div>
        <div class="nav-actions">
          <button v-if="authStore.role === 'admin'" @click="router.push('/permissions')" class="ghost">
            <Shield :size="18" />
            <span>权限管理</span>
          </button>
          <button @click="router.push('/logs')" class="ghost">
            <Terminal :size="18" />
            <span>系统日志</span>
          </button>
          <button @click="showSettingsModal = true" class="ghost">
            <Settings :size="18" />
            <span>核心配置</span>
          </button>
          <button @click="handleLogout" class="danger-ghost">
            <LogOut :size="18" />
            <span>断开连接</span>
          </button>
        </div>
      </div>
    </nav>

    <main>
      <header class="main-header">
        <div class="header-info">
          <Activity :size="32" color="var(--primary)" />
          <div>
            <h1>数据库控制</h1>
            <p>活动节点: {{ authStore.userId }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="triggerSyncAll" class="primary" :disabled="syncingAll">
            <RefreshCw :class="{ spinning: syncingAll }" :size="18" />
            {{ syncingAll ? '全量同步中...' : '全数据库同步' }}
          </button>
          <button @click="fetchDatabases" class="ghost">
            <RefreshCw :class="{ spinning: loading }" :size="18" />
            <span>刷新</span>
          </button>
        </div>
      </header>

      <div class="grid">
        <TechCard v-for="db in databases" :key="db.database_id" class="db-card">
          <div class="data-badge glass">
            <Hash :size="10" />
            <span>{{ db.total_count || 0 }}</span>
          </div>
          <div class="card-header">
            <Database :size="24" color="var(--primary)" />
            <h3 @click="router.push(`/data/${db.database_id}`)" class="clickable-title">{{ db.name || '未命名数据库' }}</h3>
          </div>
          <div class="db-id">{{ db.database_id }}</div>
          
          <div class="status-grid">
            <div class="status-item">
              <span class="label">数据总量</span>
              <span class="value">{{ db.total_count || 0 }} 条</span>
            </div>
            <div class="status-item">
              <span class="label">上次同步</span>
              <span class="value">{{ db.last_sync_at ? formatDate(db.last_sync_at) : '从未' }}</span>
            </div>
            <div class="status-item">
              <span class="label">状态</span>
              <span class="value status-active">已连接</span>
            </div>
          </div>

          <div class="hud-line"></div>

          <div class="card-actions">
            <button 
              @click="triggerSync(db.database_id)" 
              class="sync-btn"
              :disabled="syncing[db.database_id] || refreshing[db.database_id]"
            >
              <RefreshCw :class="{ spinning: syncing[db.database_id] }" :size="16" />
              {{ syncing[db.database_id] ? '同步中...' : '立即同步' }}
            </button>
            <button 
              @click="confirmRefresh(db)" 
              class="refresh-schema-btn ghost"
              :disabled="syncing[db.database_id] || refreshing[db.database_id]"
              title="更新字段结构"
            >
              <Layout :class="{ spinning: refreshing[db.database_id] }" :size="16" />
            </button>
            <button 
              @click="confirmDelete(db)" 
              class="delete-btn ghost"
              title="删除连接"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </TechCard>

        <!-- Placeholder for new database -->
        <TechCard class="add-card glass" @click="showAddModal = true">
          <div class="add-content">
            <Layers :size="48" color="var(--primary)" opacity="0.3" />
            <p>链接新数据节点</p>
          </div>
        </TechCard>
      </div>
    </main>

    <!-- 添加数据库弹窗 -->
    <TechModal :show="showAddModal" title="链接新数据节点" @close="showAddModal = false">
      <form @submit.prevent="handleAddDatabase" class="modal-form">
        <div class="input-group">
          <Hash class="input-icon" :size="18" />
          <input v-model="newDb.databaseId" type="text" placeholder="NOTION DATABASE ID" required />
        </div>
        <div class="input-group">
          <Layers class="input-icon" :size="18" />
          <input v-model="newDb.name" type="text" placeholder="节点别名 (例如: 消费记录)" required />
        </div>
        <button type="submit" class="primary full-width" :disabled="formLoading">
          {{ formLoading ? '同步链路中...' : '建立连接' }}
        </button>
      </form>
    </TechModal>

    <!-- 设置弹窗 -->
    <TechModal :show="showSettingsModal" title="核心参数配置" @close="showSettingsModal = false">
      <form @submit.prevent="handleSaveSettings" class="modal-form">
        <div class="input-group">
          <Key class="input-icon" :size="18" />
          <input v-model="config.apiKey" type="text" placeholder="NOTION INTEGRATION TOKEN" required />
        </div>
        <div class="input-group">
          <Activity class="input-icon" :size="18" />
          <input v-model="config.version" type="text" placeholder="NOTION VERSION (2025-09-03)" required />
        </div>
        <p class="hint">这些参数是连接 Notion API 的核心凭证，请妥善保管。</p>
        <button type="submit" class="primary full-width" :disabled="formLoading">
          {{ formLoading ? '保存中...' : '更新配置' }}
        </button>
      </form>
    </TechModal>

    <!-- 删除确认弹窗 -->
    <TechModal :show="showDeleteModal" title="断开数据节点" @close="showDeleteModal = false">
      <div class="confirm-modal">
        <div class="alert-icon">
          <AlertTriangle :size="48" color="#ef4444" />
        </div>
        <p class="confirm-text">
          确定要断开与数据库 <span class="highlight">"{{ dbToDelete?.name || '未命名数据库' }}"</span> 的连接吗？
        </p>
        <p class="warning-text">警告：此操作将从系统中移除该节点的所有同步元数据，操作不可撤销。</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="ghost">取消</button>
          <button @click="handleDeleteDatabase" class="danger" :disabled="formLoading">
            {{ formLoading ? '处理中...' : '确认断开连接' }}
          </button>
        </div>
      </div>
    </TechModal>

    <!-- 更新字段确认弹窗 -->
    <TechModal :show="showRefreshModal" title="重构数据结构" @close="showRefreshModal = false">
      <div class="confirm-modal">
        <div class="alert-icon">
          <Layout :size="48" color="var(--primary)" />
        </div>
        <p class="confirm-text">
          确定要更新数据库 <span class="highlight">"{{ dbToRefresh?.name || '未命名数据库' }}"</span> 的字段结构吗？
        </p>
        <p class="hint-text">这将重新同步 Notion 的列定义。注意：现有数据表会被重置，您需要重新执行同步以获取数据。</p>
        <div class="modal-actions">
          <button @click="showRefreshModal = false" class="ghost">取消</button>
          <button @click="handleRefreshSchema" class="primary" :disabled="formLoading">
            {{ formLoading ? '重构中...' : '确认更新结构' }}
          </button>
        </div>
      </div>
    </TechModal>

    <!-- 通知系统渲染 -->
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
.dashboard {
  min-height: 100vh;
  padding-top: 80px;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 100;
  border-bottom: 1px solid var(--border);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 2px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-info h1 {
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.header-info p {
  font-size: 0.75rem;
  color: var(--primary);
  opacity: 0.7;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.data-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.65rem;
  font-family: monospace;
  color: var(--primary);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.card-header h3 {
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.clickable-title {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable-title:hover {
  color: var(--primary);
  text-shadow: 0 0 10px var(--primary-glow);
}

.db-id {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-bottom: 1.5rem;
  background: rgba(0,0,0,0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.6rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.value {
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  color: #10b981;
}

.card-actions {
  display: flex;
  gap: 1rem;
}

.sync-btn {
  flex: 1;
  background: var(--primary);
  color: var(--bg-dark);
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.sync-btn:hover:not(:disabled) {
  background: white;
  box-shadow: 0 0 15px var(--primary);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  transition: all 0.3s ease;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.refresh-schema-btn {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  transition: all 0.3s ease;
}

.refresh-schema-btn:hover:not(:disabled) {
  color: var(--primary);
  background: rgba(56, 189, 248, 0.1);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.refresh-schema-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border);
  opacity: 0.6;
  transition: all 0.3s ease;
}

.add-card:hover {
  opacity: 1;
  border-color: var(--primary);
  background: rgba(56, 189, 248, 0.05);
}

.add-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.add-content p {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: var(--text-dim);
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary);
  opacity: 0.6;
}

input {
  width: 100%;
  padding-left: 3rem !important;
}

.full-width {
  width: 100%;
}

.hint {
  font-size: 0.7rem;
  color: var(--text-dim);
  line-height: 1.4;
  margin-top: -0.5rem;
}

.confirm-modal {
  text-align: center;
}

.alert-icon {
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.3));
}

.confirm-text {
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.highlight {
  color: var(--primary);
  font-weight: bold;
}

.warning-text {
  font-size: 0.8rem;
  color: #ef4444;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.hint-text {
  font-size: 0.8rem;
  color: var(--text-dim);
  opacity: 0.8;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-actions button {
  min-width: 120px;
}

.notifications-container {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 2000;
  pointer-events: none;
}

.notifications-container > * {
  pointer-events: auto;
}

button.danger {
  background: #ef4444;
  color: white;
}

button.danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}
</style>
