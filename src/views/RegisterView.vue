<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import { ShieldAlert, Lock, User, UserPlus } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const successMsg = ref('');

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = '访问代码不匹配';
    return;
  }

  loading.value = true;
  error.value = '';
  successMsg.value = '';
  
  const result = await authStore.register(username.value, password.value);
  if (result.success) {
    successMsg.value = '身份已建立。正在重定向...';
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } else {
    error.value = result.message;
  }
  loading.value = false;
};
</script>

<template>
  <div class="login-container">
    <div class="hud-bg"></div>
    <div class="login-box">
      <TechCard>
        <div class="header">
          <div class="icon-glow">
            <UserPlus :size="48" color="var(--primary)" />
          </div>
          <h1 class="glow-text">新身份</h1>
          <p class="subtitle">量子注册终端</p>
        </div>

        <form @submit.prevent="handleRegister" class="login-form">
          <div class="input-group">
            <User class="input-icon" :size="20" />
            <input 
              v-model="username" 
              type="text" 
              placeholder="新操作员 ID" 
              required
            />
          </div>

          <div class="input-group">
            <Lock class="input-icon" :size="20" />
            <input 
              v-model="password" 
              type="password" 
              placeholder="访问代码" 
              required
            />
          </div>

          <div class="input-group">
            <Lock class="input-icon" :size="20" />
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="确认访问代码" 
              required
            />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
          <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>

          <button type="submit" class="primary login-btn" :disabled="loading">
            {{ loading ? '注册中...' : '建立身份' }}
          </button>
        </form>

        <div class="footer">
          <router-link to="/login" class="link">返回登录</router-link>
          <div class="hud-line"></div>
          <p>受限访问 // 4级加密</p>
        </div>
      </TechCard>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.hud-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
}

.login-box {
  width: 100%;
  max-width: 450px;
  padding: 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.icon-glow {
  filter: drop-shadow(0 0 15px var(--primary-glow));
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.5rem;
  letter-spacing: 4px;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--primary);
  font-size: 0.8rem;
  letter-spacing: 6px;
  opacity: 0.8;
}

.login-form {
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

.login-btn {
  width: 100%;
  margin-top: 1rem;
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  text-align: center;
  letter-spacing: 1px;
}

.success-msg {
  color: #10b981;
  font-size: 0.8rem;
  text-align: center;
  letter-spacing: 1px;
}

.footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.6rem;
  color: var(--text-dim);
  letter-spacing: 2px;
}

.link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--primary);
  text-decoration: none;
  font-size: 0.75rem;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.link:hover {
  text-shadow: 0 0 10px var(--primary-glow);
  color: white;
}
</style>
