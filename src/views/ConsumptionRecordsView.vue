<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import TechCard from '../components/TechCard.vue';
import { Activity } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useAuthStore, api } from '../stores/auth';

const authStore = useAuthStore();
const chartContainer = ref(null);
let chart = null;
const loading = ref(false);
const errorMsg = ref('');

const fetchData = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await api.get('/charts/consumption/daily', {
      headers: { 'x-user-id': authStore.userId }
    });
    if (!res.data.success) {
      throw new Error(res.data.message || '请求失败');
    }
    const rows = res.data.data || [];
    const days = rows.map(r => {
      const d = new Date(r.day);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${m}-${dd}`;
    });
    const totals = rows.map(r => Math.round(Number(r.total || 0)));
    loading.value = false;
    await nextTick();
    renderChart(days, totals);
  } catch (e) {
    errorMsg.value = e.message || '请求失败';
  } finally {
    if (loading.value) loading.value = false;
  }
};

const renderChart = (x, y) => {
  if (!chart && chartContainer.value) {
    chart = echarts.init(chartContainer.value);
  }
  if (!chart && chartContainer.value) {
    chart = echarts.init(chartContainer.value);
  }
  if (!chart) return;
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: x },
    yAxis: { type: 'value', axisLabel: { formatter: (v) => Math.round(v) } },
    series: [
      {
        name: '日支出',
        type: 'line',
        smooth: true,
        data: y
      }
    ]
  };
  chart.setOption(option);
};

const handleResize = () => {
  if (chart) chart.resize();
};

onMounted(async () => {
  await fetchData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<template>
  <div class="charts-page">
    <main>
      <header class="page-header">
        <div class="title-info">
          <Activity :size="32" color="var(--primary)" />
          <div>
            <h1>数据图表 · 消费记录</h1>
            <p>默认显示最近一个月的日支出总和</p>
          </div>
        </div>
      </header>

      <div class="content glass">
        <TechCard>
          <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
          <div class="loading" v-if="loading">加载中...</div>
          <div ref="chartContainer" class="chart"></div>
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

.chart {
  width: 100%;
  height: 420px;
}

.loading {
  padding: 1rem;
}

.error {
  color: #e54d2e;
  padding: 0.5rem 0;
}
</style>
