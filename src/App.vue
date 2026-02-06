<script setup>
import { RouterView } from 'vue-router';
import Navbar from './components/Navbar.vue';
import TechToast from './components/TechToast.vue';
import { useNotificationStore } from './stores/notification';

const notificationStore = useNotificationStore();
</script>

<template>
  <Navbar />
  <RouterView />
  
  <!-- 全局通知容器 -->
  <div class="global-notifications">
    <TechToast 
      v-for="n in notificationStore.notifications" 
      :key="n.id"
      :message="n.message"
      :type="n.type"
      @close="notificationStore.remove(n.id)"
    />
  </div>
</template>

<style>
@import './assets/base.css';

#app {
  width: 100%;
  min-height: 100vh;
}

.global-notifications {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.global-notifications > * {
  position: relative !important;
  bottom: auto !important;
  right: auto !important;
  pointer-events: auto;
}
</style>
