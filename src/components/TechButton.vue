<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

interface Props {
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  type: 'button',
  variant: 'primary',
  size: 'md'
});

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>();
</script>

<template>
  <button
    :type="type"
    class="tech-button"
    :class="[variant, size, { loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <Loader2 v-if="loading" class="spinner" :size="18" />
    <span v-if="!loading" class="button-content">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.tech-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
  outline: none;
  white-space: nowrap;
}

.tech-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background: var(--primary);
  color: black;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.primary:hover:not(:disabled) {
  background: white;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
}

.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border-color: var(--border);
}

.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
}

.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: #ef4444;
}

.danger:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.ghost {
  background: transparent;
  color: var(--text-dim);
}

.ghost:hover:not(:disabled) {
  color: var(--primary);
}

/* Sizes */
.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
.md { padding: 0.6rem 1.2rem; font-size: 0.85rem; }
.lg { padding: 0.8rem 1.6rem; font-size: 1rem; }

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.button-content {
  display: inline-flex;
  align-items: center;
  gap: inherit;
}
</style>
