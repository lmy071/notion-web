<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

interface Props {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: '数据链路加载中...',
  size: 32,
  fullScreen: false
});
</script>

<template>
  <div class="loading-container" :class="{ 'full-screen': fullScreen }">
    <div class="loading-content">
      <div class="spinner-wrapper">
        <Loader2 class="spinner" :size="size" color="var(--primary)" />
        <div class="glow-ring"></div>
      </div>
      <p class="loading-text">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
}

.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: spin 1s linear infinite;
  z-index: 1;
}

.glow-ring {
  position: absolute;
  width: 120%;
  height: 120%;
  border: 2px solid var(--primary);
  border-radius: 50%;
  opacity: 0.2;
  animation: pulse 2s ease-in-out infinite;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: flicker 3s infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.2); opacity: 0.1; }
  100% { transform: scale(1); opacity: 0.2; }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
  75% { opacity: 0.8; }
}
</style>
