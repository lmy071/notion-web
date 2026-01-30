<script setup>
import { RouterView } from 'vue-router';
import Navbar from './components/Navbar.vue';
</script>

<template>
  <Navbar />
  <RouterView />
</template>

<style>
@import './assets/base.css';

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
