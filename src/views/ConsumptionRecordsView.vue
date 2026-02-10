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
const displayDays = ref([]);
const rawDays = ref([]);
const details = ref([]);
const detailsLoading = ref(false);
const selectedDate = ref('');

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
    displayDays.value = days;
    rawDays.value = rows.map(r => {
      const d = new Date(r.day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    });
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
  chart.off('click');
  chart.on('click', async (params) => {
    const idx = params.dataIndex;
    if (idx == null) return;
    const ymd = rawDays.value[idx];
    selectedDate.value = ymd;
    await fetchDetails(ymd);
  });
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

const fetchDetails = async (ymd) => {
  detailsLoading.value = true;
  try {
    const res = await api.get('/charts/consumption/daily/details', {
      params: { date: ymd },
      headers: { 'x-user-id': authStore.userId }
    });
    if (!res.data.success) throw new Error(res.data.message || '请求失败');
    const amountCol = res.data.meta?.amount_col;
    const rows = res.data.data || [];
    details.value = rows.map(r => {
      const amount = amountCol ? Math.round(Number(r[amountCol] || 0)) : 0;
      return { ...r, _amount_int: amount };
    });
  } catch (e) {
    errorMsg.value = e.message || '请求失败';
  } finally {
    detailsLoading.value = false;
  }
};
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
        <TechCard v-if="selectedDate">
          <div class="details-header">
            <div class="details-title">日期：{{ selectedDate.slice(5) }}</div>
            <div class="details-sub">明细（点击图表点加载）</div>
          </div>
          <div v-if="detailsLoading" class="loading">明细加载中...</div>
          <div v-else class="cards">
            <div v-for="item in details" :key="item.notion_id" class="card glass">
              <div class="card-title">
                <span class="name">{{ item.ming_cheng || item.notion_id }}</span>
                <span class="amount">¥ {{ item._amount_int }}</span>
              </div>
              <div class="card-meta">
                <span v-if="item.zhi_fu_fang_shi">支付：{{ item.zhi_fu_fang_shi }}</span>
                <span v-if="item.bei_zhu">备注：{{ item.bei_zhu }}</span>
              </div>
            </div>
            <div v-if="details.length === 0" class="empty">该日暂无记录</div>
          </div>
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

.details-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.details-title {
  font-weight: 600;
}
.details-sub {
  color: var(--text-dim);
  font-size: 0.9rem;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.card {
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
.card-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  color: var(--text-dim);
  font-size: 0.9rem;
}
.empty {
  color: var(--text-dim);
  padding: 0.5rem 0;
}
</style>
