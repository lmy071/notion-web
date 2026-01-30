<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { 
  Cpu, 
  User, 
  Shield, 
  Terminal, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Database,
  Layout
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const avatarError = ref(false);

const isDashboard = computed(() => route.path === '/');
const isLoginOrRegister = computed(() => ['/login', '/register'].includes(route.path));

const pageTitle = computed(() => {
  if (route.path === '/profile') return '个人信息与配置';
  if (route.path === '/logs') return '系统日志终端';
  if (route.path === '/permissions') return '权限管理中心';
  if (route.path.startsWith('/data/')) return '数据核心终端';
  return 'Notion 核心';
});

const pageIcon = computed(() => {
  if (route.path === '/profile') return User;
  if (route.path === '/logs') return Terminal;
  if (route.path === '/permissions') return Shield;
  if (route.path.startsWith('/data/')) return Database;
  return Cpu;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const getAvatarUrl = (url) => {
  avatarError.value = false;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // 确保相对路径以 / 开头
  return url.startsWith('/') ? url : `/${url}`;
};

const handleAvatarError = () => {
  avatarError.value = true;
};

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <nav v-if="!isLoginOrRegister" class="glass">
    <div class="nav-content">
      <!-- 左侧: Logo 或 返回按钮 -->
      <div class="left-section">
        <div v-if="isDashboard" class="logo">
          <Cpu :size="24" color="var(--primary)" />
          <span class="glow-text">Notion 核心</span>
        </div>
        <button v-else @click="goBack" class="back-btn">
          <ChevronLeft :size="20" />
          <span>返回控制台</span>
        </button>
      </div>

      <!-- 中间: 页面标题 (非 Dashboard 时显示) -->
      <div v-if="!isDashboard" class="nav-title">
        <component :is="pageIcon" :size="20" color="var(--primary)" />
        <span class="glow-text">{{ pageTitle }}</span>
      </div>

      <!-- 右侧: 动作按钮 -->
      <div class="nav-actions">
        <!-- Dashboard 专属动作 -->
        <template v-if="isDashboard">
          <button @click="router.push('/profile')" class="ghost profile-btn">
            <div class="avatar-mini glass" v-if="authStore.avatar && !avatarError">
              <img :src="getAvatarUrl(authStore.avatar)" alt="Avatar" @error="handleAvatarError" />
            </div>
            <User v-else :size="18" />
            <span>个人信息</span>
          </button>
          <button v-if="authStore.role === 'admin'" @click="router.push('/permissions')" class="ghost">
            <Shield :size="18" />
            <span>权限管理</span>
          </button>
          <button @click="router.push('/logs')" class="ghost">
            <Terminal :size="18" />
            <span>系统日志</span>
          </button>
          <button @click="router.push('/profile')" class="ghost">
            <Settings :size="18" />
            <span>核心配置</span>
          </button>
        </template>

        <!-- 通用动作 -->
        <button @click="handleLogout" class="danger-ghost">
          <LogOut :size="18" />
          <span>断开连接</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 1000;
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

.left-section {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 2px;
}

.back-btn {
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.back-btn:hover {
  color: var(--primary);
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.nav-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  min-width: 200px;
}

button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
}

.avatar-mini {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border);
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-btn {
  padding-left: 0.4rem;
}

@media (max-width: 1000px) {
  .nav-actions span {
    display: none;
  }
  button {
    padding: 0.5rem;
  }
}
</style>
