<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, api } from '../stores/auth';
import { 
  Shield, 
  ChevronLeft, 
  RefreshCw, 
  User, 
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import TechCard from '../components/TechCard.vue';
import TechModal from '../components/TechModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const users = ref([]);
const permissionsDict = ref([]);
const loading = ref(false);
const showAddDictModal = ref(false);
const newDict = ref({ code: '', name: '' });
const saving = ref({}); // Track saving status per user

const fetchData = async () => {
  loading.value = true;
  try {
    const [usersRes, dictRes] = await Promise.all([
      api.get('/users', { headers: { 'x-user-id': authStore.userId } }),
      api.get('/dict/permissions', { headers: { 'x-user-id': authStore.userId } })
    ]);
    users.value = usersRes.data.data;
    permissionsDict.value = dictRes.data.data;
  } catch (error) {
    console.error('获取权限数据失败:', error);
  }
  loading.value = false;
};

const togglePermission = (user, permCode) => {
  const perms = user.permissions ? user.permissions.split(',') : [];
  const index = perms.indexOf(permCode);
  if (index > -1) {
    perms.splice(index, 1);
  } else {
    perms.push(permCode);
  }
  user.permissions = perms.filter(p => p).join(',');
};

const hasPermission = (user, permCode) => {
  const perms = user.permissions ? user.permissions.split(',') : [];
  return perms.includes(permCode);
};

const toggleRole = (user) => {
  // Prevent admin from demoting themselves (optional but safer)
  if (user.id === authStore.userId && user.role === 'admin') {
    alert('管理员不能取消自己的管理员身份');
    return;
  }
  user.role = user.role === 'admin' ? 'user' : 'admin';
};

const saveUserPermissions = async (user) => {
  saving.value[user.id] = true;
  try {
    await api.put(`/users/${user.id}`, {
      permissions: user.permissions,
      role: user.role
    }, {
      headers: { 'x-user-id': authStore.userId }
    });
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
  saving.value[user.id] = false;
};

const handleAddDict = async () => {
  if (!newDict.value.code || !newDict.value.name) return;
  try {
    await api.post('/dict/permissions', newDict.value, {
      headers: { 'x-user-id': authStore.userId }
    });
    showAddDictModal.value = false;
    newDict.value = { code: '', name: '' };
    await fetchData();
  } catch (error) {
    console.error('添加权限项失败:', error);
  }
};

const deleteDictItem = async (id) => {
  if (!confirm('确定删除此权限定义吗？这将影响所有已分配该权限的用户。')) return;
  try {
    await api.delete(`/dict/permissions/${id}`, {
      headers: { 'x-user-id': authStore.userId }
    });
    await fetchData();
  } catch (error) {
    console.error('删除权限项失败:', error);
  }
};

onMounted(() => {
  if (authStore.role !== 'admin') {
    router.push('/');
    return;
  }
  fetchData();
});
</script>

<template>
  <div class="permissions-page">
    <nav class="glass">
      <div class="nav-content">
        <div class="left">
          <button @click="router.push('/')" class="back-btn">
            <ChevronLeft :size="20" />
            <span>返回控制台</span>
          </button>
        </div>
        <div class="logo">
          <Shield :size="24" color="var(--primary)" />
          <span class="glow-text">权限管理核心</span>
        </div>
        <div class="right">
          <button @click="fetchData" class="ghost" :disabled="loading">
            <RefreshCw :size="18" :class="{ spinning: loading }" />
          </button>
        </div>
      </div>
    </nav>

    <main>
      <div class="grid-layout">
        <!-- 用户权限管理 -->
        <section class="users-section">
          <div class="section-header">
            <User :size="20" />
            <h2>用户权限矩阵</h2>
          </div>
          
          <div class="users-container glass">
            <table v-if="users.length > 0">
              <thead>
                <tr>
                  <th>用户</th>
                  <th v-for="dict in permissionsDict" :key="dict.id" :title="dict.dict_name">
                    {{ dict.dict_code }}
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="user-info">
                      <span class="username">{{ user.username }}</span>
                      <button 
                        class="role-badge-btn" 
                        :class="user.role"
                        @click="toggleRole(user)"
                        title="点击切换角色"
                      >
                        {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                      </button>
                    </div>
                  </td>
                  <td v-for="dict in permissionsDict" :key="dict.id" class="checkbox-cell">
                    <input 
                      type="checkbox" 
                      :checked="hasPermission(user, dict.dict_code)"
                      @change="togglePermission(user, dict.dict_code)"
                    />
                  </td>
                  <td>
                    <button 
                      @click="saveUserPermissions(user)" 
                      class="save-btn"
                      :disabled="saving[user.id]"
                    >
                      <Save :size="16" v-if="!saving[user.id]" />
                      <RefreshCw :size="16" class="spinning" v-else />
                      <span>保存</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <User :size="48" opacity="0.1" />
              <p>暂无用户数据</p>
            </div>
          </div>
        </section>

        <!-- 权限字典管理 -->
        <section class="dict-section">
          <div class="section-header">
            <Settings :size="20" />
            <h2>权限字典配置</h2>
            <button @click="showAddDictModal = true" class="add-btn ghost">
              <Plus :size="16" />
              <span>新增权限项</span>
            </button>
          </div>

          <div class="dict-container glass">
            <div v-if="permissionsDict.length > 0" class="dict-list">
              <div v-for="dict in permissionsDict" :key="dict.id" class="dict-item">
                <div class="dict-info">
                  <div class="dict-code">{{ dict.dict_code }}</div>
                  <div class="dict-name">{{ dict.dict_name }}</div>
                </div>
                <button @click="deleteDictItem(dict.id)" class="delete-btn ghost">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
            <div v-else class="empty-state">
              <Shield :size="48" opacity="0.1" />
              <p>暂无权限定义</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 新增权限项弹窗 -->
    <TechModal :show="showAddDictModal" title="新增权限定义" @close="showAddDictModal = false">
      <form @submit.prevent="handleAddDict" class="modal-form">
        <div class="input-group">
          <Shield class="input-icon" :size="18" />
          <input v-model="newDict.code" type="text" placeholder="权限标识 (如 data:sync)" required />
        </div>
        <div class="input-group">
          <Settings class="input-icon" :size="18" />
          <input v-model="newDict.name" type="text" placeholder="权限名称 (如 执行数据同步)" required />
        </div>
        <button type="submit" class="primary full-width">确认添加</button>
      </form>
    </TechModal>
  </div>
</template>

<style scoped>
.permissions-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
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
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.back-btn {
  color: var(--text-dim);
  font-size: 0.9rem;
}

.back-btn:hover {
  color: var(--primary);
  text-shadow: 0 0 10px var(--primary-glow);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 2px;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.2rem;
  margin: 0;
  flex: 1;
}

.users-container, .dict-container {
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 1rem;
  color: var(--text-dim);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.username {
  font-weight: bold;
  color: var(--primary);
}

.role-badge-btn {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  background: none;
  border: 1px solid transparent;
}

.role-badge-btn.admin {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.role-badge-btn.admin:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.role-badge-btn.user {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.2);
}

.role-badge-btn.user:hover {
  background: rgba(148, 163, 184, 0.2);
  box-shadow: 0 0 10px rgba(148, 163, 184, 0.3);
}

.role-badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.role-badge.user {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.checkbox-cell {
  text-align: center;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
  border: 1px solid rgba(var(--primary-rgb), 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary);
  color: black;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dict-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dict-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.dict-code {
  font-family: monospace;
  color: var(--primary);
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.dict-name {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.delete-btn {
  color: var(--text-dim);
}

.delete-btn:hover {
  color: #ef4444;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-dim);
  gap: 1rem;
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
  color: var(--text-dim);
}

input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: white;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 15px var(--primary-glow);
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }
}
</style>
