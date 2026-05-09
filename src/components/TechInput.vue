<script setup lang="ts">
import { type Component } from 'vue';

interface Props {
  modelValue: string | number;
  type?: string;
  placeholder?: string;
  label?: string;
  icon?: Component;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();
</script>

<template>
  <div class="tech-input-container" :class="{ 'has-error': error, disabled }">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="input-wrapper glass">
      <component :is="icon" v-if="icon" class="input-icon" :size="18" />
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        class="input-field"
      />
    </div>
    <Transition name="fade">
      <span v-if="error" class="error-text">{{ error }}</span>
    </Transition>
  </div>
</template>

<style scoped>
.tech-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.input-label {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.input-icon {
  color: var(--text-dim);
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
  width: 100%;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

.has-error .input-wrapper {
  border-color: #ef4444;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled .input-field {
  cursor: not-allowed;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
