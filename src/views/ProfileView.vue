<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, api } from '../stores/auth';
import { useRouter } from 'vue-router';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import { formatDate } from '../utils/date';
import { 
  User, 
  Settings, 
  Key, 
  Activity, 
  Clock, 
  Shield, 
  ArrowLeft,
  Save,
  Info
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const formLoading = ref(false);

const user = ref({
  username: '',
  role: '',
  created_at: ''
});

const config = ref({
  apiKey: '',
  version: '2025-09-03',
  syncSchedule: ''
});

const notifications = ref([]);
const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const fetchData = async () => {
  loading.value = true;
  try {
    // 获取用户信息
    const userRes = await api.get('/me', {
      headers: { 'x-user-id': authStore.userId }
    });
    if (userRes.data.success) {
      user.value = userRes.data.data;
    }

    // 获取配置信息
    const configRes = await api.get('/configs', {
      headers: { 'x-user-id': authStore.userId }
    });
    if (configRes.data.success) {
      config.value.apiKey = configRes.data.data.notion_api_key || '';
      config.value.version = configRes.data.data.notion_version || '2025-09-03';
      config.value.syncSchedule = configRes.data.data.sync_schedule || '';
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    notify('获取个人信息失败', 'error');
  }
  loading.value = false;
};

const handleSave = async () => {
  formLoading.value = true;
  try {
    const response = await api.post('/config', {
      apiKey: config.value.apiKey,
      version: config.value.version,
      syncSchedule: config.value.syncSchedule
    }, {
      headers: { 'x-user-id': authStore.userId }
    });

    if (response.data.success) {
      notify('个人信息及同步计划已更新');
    } else {
      notify(response.data.message || '保存失败', 'error');
    }
  } catch (error) {
    console.error('保存失败:', error);
    notify(error.response?.data?.message || '服务器错误', 'error');
  }
  formLoading.value = false;
};

onMounted(fetchData);
</script>

<template>
  <div class="profile-page glass-bg">
    <nav class="glass">
      <div class="nav-content">
        <div class="logo clickable" @click="router.push('/')">
          <ArrowLeft :size="20" />
          <span>返回控制台</span>
        </div>
        <div class="nav-title">
          <User :size="20" color="var(--primary)" />
          <span class="glow-text">个人信息与配置</span>
        </div>
      </div>
    </nav>

    <main v-if="!loading">
      <div class="profile-grid">
        <!-- 用户基本信息 -->
        <TechCard class="info-card">
          <div class="card-header">
            <Info :size="20" color="var(--primary)" />
            <h3>账号状态</h3>
          </div>
          <div class="info-content">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ user.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">权限角色</span>
              <span class="value role-badge" :class="user.role">{{ user.role.toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间</span>
              <span class="value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">节点 ID</span>
              <span class="value id-text">{{ user.id }}</span>
            </div>
          </div>
        </TechCard>

        <!-- Notion 核心配置 -->
        <TechCard class="config-card">
          <div class="card-header">
            <Settings :size="20" color="var(--primary)" />
            <h3>Notion 核心配置</h3>
          </div>
          <form @submit.prevent="handleSave" class="profile-form">
            <div class="input-section">
              <label>NOTION INTEGRATION TOKEN</label>
              <div class="input-group">
                <Key class="input-icon" :size="18" />
                <input v-model="config.apiKey" type="password" placeholder="秘钥内容已加密保护" />
              </div>
            </div>
            <div class="input-section">
              <label>NOTION API VERSION</label>
              <div class="input-group">
                <Activity class="input-icon" :size="18" />
                <input v-model="config.version" type="text" placeholder="2025-09-03" />
              </div>
            </div>
            
            <div class="divider"></div>

            <!-- 定时任务配置 -->
            <div class="card-header sub">
              <Clock :size="18" color="var(--primary)" />
              <h3>自动化同步计划 (Cron)</h3>
            </div>
            
            <div class="input-section">
              <label>CRON 表达式</label>
              <div class="input-group">
                <Clock class="input-icon" :size="18" />
                <input v-model="config.syncSchedule" type="text" placeholder="例如: 0 2 * * * (每天凌晨2点)" />
              </div>
              <div class="cron-hints">
                <p>常用格式示例：</p>
                <ul>
                  <li><code>0 2 * * *</code> - 每天凌晨 2:00</li>
                  <li><code>0 3 * * 1</code> - 每周一凌晨 3:00</li>
                  <li><code>0 */6 * * *</code> - 每 6 小时同步一次</li>
                </ul>
                <p class="warning" v-if="config.syncSchedule">
                  注意：留空将禁用自动同步任务。
                </p>
              </div>
            </div>

            <button type="submit" class="primary save-btn" :disabled="formLoading">
              <Save :size="18" />
              {{ formLoading ? '同步中...' : '保存所有变更' }}
            </button>
          </form>
        </TechCard>
      </div>
    </main>
    <div v-else class="loading-state">
      <div class="scanner"></div>
      <p>正在读取核心数据...</p>
    </div>

    <!-- 通知系统 -->
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
.profile-page {
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
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
  max-width: 1000px;
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
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-dim);
  transition: all 0.3s;
}

.logo:hover {
  color: var(--primary);
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}

main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.card-header.sub {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1rem;
  letter-spacing: 1px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.value {
  font-size: 0.95rem;
  font-weight: 500;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  width: fit-content;
}

.role-badge.admin {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.role-badge.user {
  background: rgba(56, 189, 248, 0.15);
  color: var(--primary);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.id-text {
  font-family: monospace;
  font-size: 0.8rem;
  opacity: 0.7;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.input-section label {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-weight: 500;
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

.divider {
  height: 1px;
  background: var(--border);
  margin: 1rem 0;
  opacity: 0.5;
}

.cron-hints {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.cron-hints p {
  margin-bottom: 0.4rem;
}

.cron-hints ul {
  list-style: none;
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.cron-hints li {
  margin-bottom: 0.2rem;
}

.cron-hints code {
  color: var(--primary);
  background: rgba(56, 189, 248, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.warning {
  color: #fbbf24;
  font-style: italic;
}

.save-btn {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 48px;
  font-weight: bold;
  letter-spacing: 2px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 2rem;
}

.loading-state p {
  color: var(--primary);
  letter-spacing: 4px;
  font-size: 0.8rem;
  animation: pulse 2s infinite;
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

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (max-width: 800px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
