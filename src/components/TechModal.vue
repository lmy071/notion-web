<script setup>
import { X } from 'lucide-vue-next';

defineProps({
  show: Boolean,
  title: String
});

defineEmits(['close']);
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content glass">
        <div class="modal-header">
          <h2 class="glow-text">{{ title }}</h2>
          <button class="close-btn" @click="$emit('close')">
            <X :size="20" />
          </button>
        </div>
        <div class="hud-line"></div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  border-radius: 12px;
  position: relative;
  border: 1px solid var(--primary);
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.close-btn {
  color: var(--text-dim);
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #ef4444;
}

.modal-body {
  margin-top: 1.5rem;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
