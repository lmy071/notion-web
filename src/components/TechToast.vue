<script setup>
import { ref, onMounted } from 'vue';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'success' // success, error, info
  },
  duration: {
    type: Number,
    default: 3000
  }
});

const emit = defineEmits(['close']);
const visible = ref(true);

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(() => {
      visible.value = false;
      setTimeout(() => emit('close'), 300);
    }, props.duration);
  }
});
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="tech-toast glass" :class="type">
      <div class="toast-content">
        <CheckCircle2 v-if="type === 'success'" :size="18" class="icon" />
        <AlertCircle v-else-if="type === 'error'" :size="18" class="icon" />
        <Info v-else :size="18" class="icon" />
        <span class="message">{{ message }}</span>
      </div>
      <button class="close-btn" @click="visible = false; emit('close')">
        <X :size="14" />
      </button>
      <div class="progress-bar" :style="{ animationDuration: duration + 'ms' }"></div>
    </div>
  </Transition>
</template>

<style scoped>
.tech-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  min-width: 300px;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  z-index: 2000;
  border: 1px solid var(--border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon {
  flex-shrink: 0;
}

.success .icon { color: #10b981; }
.error .icon { color: #ef4444; }
.info .icon { color: var(--primary); }

.success { border-left: 4px solid #10b981; }
.error { border-left: 4px solid #ef4444; }
.info { border-left: 4px solid var(--primary); }

.message {
  font-size: 0.9rem;
  color: var(--text);
  letter-spacing: 1px;
}

.close-btn {
  color: var(--text-dim);
  opacity: 0.6;
  transition: all 0.3s ease;
}

.close-btn:hover {
  opacity: 1;
  color: white;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: currentColor;
  opacity: 0.3;
  width: 100%;
  transform-origin: left;
  animation: shrink linear forwards;
}

@keyframes shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}
</style>
