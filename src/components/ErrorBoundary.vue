<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { AlertTriangle, RefreshCw } from 'lucide-vue-next';
import TechButton from './TechButton.vue';

const error = ref<Error | null>(null);

onErrorCaptured((err: any) => {
  error.value = err;
  console.error('Captured by ErrorBoundary:', err);
  return false; // Prevent error from propagating further
});

const recover = () => {
  error.value = null;
  window.location.reload();
};
</script>

<template>
  <div v-if="error" class="error-boundary glass">
    <div class="error-content">
      <div class="error-icon">
        <AlertTriangle :size="48" color="#ef4444" />
      </div>
      <h2 class="glow-text">系统模块异常</h2>
      <p class="error-message">{{ error.message || '发生了一个未预期的错误' }}</p>
      <div class="hud-line"></div>
      <TechButton variant="secondary" @click="recover">
        <RefreshCw :size="16" />
        尝试重新链接
      </TechButton>
    </div>
  </div>
  <slot v-else></slot>
</template>

<style scoped>
.error-boundary {
  padding: 3rem;
  margin: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.05);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.error-icon {
  animation: pulse 2s infinite;
}

.error-message {
  color: var(--text-dim);
  font-family: monospace;
  max-width: 400px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
</style>
