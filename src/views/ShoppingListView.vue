<script setup>
import TechCard from '../components/TechCard.vue';
import { Activity } from 'lucide-vue-next';
</script>

<template>
  <div class="charts-page">
    <main>
      <header class="page-header">
        <div class="title-info">
          <Activity :size="32" color="var(--primary)" />
          <div>
            <h1>数据图表 · 购物清单</h1>
            <p>功能建设中，敬请期待</p>
          </div>
        </div>
      </header>

      <div class="content glass">
        <TechCard>
          <p>这里将展示购物清单的统计图表与相关分析。</p>
        </TechCard>
      </div>
    </main>
  </div>
</template>

<style scoped>
.charts-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.title-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.content {
  padding: 1rem;
}
</style>
