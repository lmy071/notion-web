<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechModal from '../components/TechModal.vue';
import * as echarts from 'echarts';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Database,
  Settings,
  Users,
  Lock,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Move,
  Palette,
  BarChart2,
  Activity,
  RefreshCw,
  ChevronLeft
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Chart configuration state
const chartConfig = reactive({
  title: '新建图表',
  description: '',
  type: 'line',
  dataSource: '',
  xAxis: '',
  yAxis: '',
  aggregation: 'sum',
  timeRange: '30d',
  filters: [],
  permissions: {
    visibility: 'private', // private, shared, public
    allowedUsers: [],
    allowedRoles: []
  },
  styling: {
    theme: 'default',
    colors: ['#38bdf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa'],
    showLegend: true,
    showGrid: true,
    smooth: true
  }
});

// UI state
const activeTab = ref('basic');
const availableDataSources = ref([]);
const availableUsers = ref([]);
const availableRoles = ref(['admin', 'user']);
const chartPreview = ref(null);
let previewChart = null;
const loading = ref(false);
const saving = ref(false);
const showPermissionModal = ref(false);

// Chart types available
const chartTypes = [
  { id: 'line', name: '折线图', icon: LineChart },
  { id: 'bar', name: '柱状图', icon: BarChart3 },
  { id: 'pie', name: '饼图', icon: PieChart },
  { id: 'area', name: '面积图', icon: TrendingUp }
];

// Aggregation methods
const aggregationMethods = [
  { id: 'sum', name: '求和' },
  { id: 'avg', name: '平均值' },
  { id: 'count', name: '计数' },
  { id: 'max', name: '最大值' },
  { id: 'min', name: '最小值' }
];

// Time ranges
const timeRanges = [
  { id: '7d', name: '最近7天' },
  { id: '30d', name: '最近30天' },
  { id: '90d', name: '最近90天' },
  { id: '1y', name: '最近1年' },
  { id: 'all', name: '全部时间' }
];

// Fetch available data sources
const fetchDataSources = async () => {
  try {
    const response = await api.get('/data-sources', {
      headers: { 'x-user-id': authStore.userId }
    });
    availableDataSources.value = response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data sources:', error);
  }
};

// Fetch available users for permission settings
const fetchUsers = async () => {
  try {
    const response = await api.get('/users', {
      headers: { 'x-user-id': authStore.userId }
    });
    availableUsers.value = response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

// Get fields for selected data source
const getDataSourceFields = computed(() => {
  const source = availableDataSources.value.find(s => s.id === chartConfig.dataSource);
  return source ? source.fields || [] : [];
});

// Add filter
const addFilter = () => {
  chartConfig.filters.push({
    field: '',
    operator: 'equals',
    value: ''
  });
};

// Remove filter
const removeFilter = (index) => {
  chartConfig.filters.splice(index, 1);
};

// Toggle user permission
const toggleUserPermission = (userId) => {
  const index = chartConfig.permissions.allowedUsers.indexOf(userId);
  if (index > -1) {
    chartConfig.permissions.allowedUsers.splice(index, 1);
  } else {
    chartConfig.permissions.allowedUsers.push(userId);
  }
};

// Toggle role permission
const toggleRolePermission = (role) => {
  const index = chartConfig.permissions.allowedRoles.indexOf(role);
  if (index > -1) {
    chartConfig.permissions.allowedRoles.splice(index, 1);
  } else {
    chartConfig.permissions.allowedRoles.push(role);
  }
};

// Preview chart
const previewChartConfig = async () => {
  if (!chartConfig.dataSource || !chartConfig.xAxis || !chartConfig.yAxis) return;
  
  loading.value = true;
  try {
    const response = await api.post('/charts/preview', chartConfig, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      renderPreviewChart(response.data.data);
    }
  } catch (error) {
    console.error('Failed to preview chart:', error);
  }
  loading.value = false;
};

// Render preview chart
const renderPreviewChart = (data) => {
  if (!chartPreview.value) return;
  
  if (!previewChart) {
    previewChart = echarts.init(chartPreview.value);
  }
  
  const option = {
    title: {
      text: chartConfig.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      show: chartConfig.styling.showLegend,
      bottom: 0
    },
    grid: {
      show: chartConfig.styling.showGrid,
      left: '3%',
      right: '4%',
      bottom: chartConfig.styling.showLegend ? '15%' : '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: chartConfig.yAxis,
      type: chartConfig.type,
      data: data.map(item => item.value),
      smooth: chartConfig.styling.smooth,
      itemStyle: {
        color: chartConfig.styling.colors[0]
      },
      areaStyle: chartConfig.type === 'area' ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: chartConfig.styling.colors[0] },
            { offset: 1, color: 'transparent' }
          ]
        }
      } : null
    }],
    color: chartConfig.styling.colors
  };
  
  previewChart.setOption(option);
};

// Save chart configuration
const saveChart = async () => {
  if (!chartConfig.title || !chartConfig.dataSource) {
    alert('请填写图表标题和选择数据源');
    return;
  }
  
  saving.value = true;
  try {
    const chartData = {
      title: chartConfig.title,
      description: chartConfig.description,
      type: chartConfig.type,
      dataSource: chartConfig.dataSource,
      xAxis: chartConfig.xAxis,
      yAxis: chartConfig.yAxis,
      aggregation: chartConfig.aggregation,
      timeRange: chartConfig.timeRange,
      filters: chartConfig.filters,
      permissions: chartConfig.permissions,
      styling: chartConfig.styling
    };

    let response;
    if (route.params.id) {
      // Update existing chart
      response = await api.put(`/charts/${route.params.id}`, chartData, {
        headers: { 'x-user-id': authStore.userId }
      });
    } else {
      // Create new chart
      response = await api.post('/charts', chartData, {
        headers: { 'x-user-id': authStore.userId }
      });
    }
    
    if (response.data.success) {
      alert('图表配置保存成功！');
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Failed to save chart:', error);
    alert('保存失败，请重试');
  }
  saving.value = false;
};

// Reset form
const resetForm = () => {
  Object.assign(chartConfig, {
    title: '新建图表',
    description: '',
    type: 'line',
    dataSource: '',
    xAxis: '',
    yAxis: '',
    aggregation: 'sum',
    timeRange: '30d',
    filters: [],
    permissions: {
      visibility: 'private',
      allowedUsers: [],
      allowedRoles: []
    },
    styling: {
      theme: 'default',
      colors: ['#38bdf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa'],
      showLegend: true,
      showGrid: true,
      smooth: true
    }
  });
};

// Load existing chart if editing
const loadExistingChart = async () => {
  if (route.params.id) {
    try {
      const response = await api.get(`/charts/${route.params.id}`, {
        headers: { 'x-user-id': authStore.userId }
      });
      
      if (response.data.success) {
        const chart = response.data.data;
        // Merge existing chart data with current config
        Object.assign(chartConfig, {
          title: chart.title,
          description: chart.description,
          type: chart.type,
          dataSource: chart.dataSource,
          xAxis: chart.xAxis,
          yAxis: chart.yAxis,
          aggregation: chart.aggregation,
          timeRange: chart.timeRange,
          filters: chart.filters || [],
          permissions: chart.permissions,
          styling: chart.styling
        });
      }
    } catch (error) {
      console.error('Failed to load chart:', error);
      notify('加载图表失败', 'error');
    }
  }
};

// Initialize
onMounted(async () => {
  await fetchDataSources();
  await fetchUsers();
  await loadExistingChart();
  
  // Watch for changes and auto-preview
  watch(() => [chartConfig.type, chartConfig.dataSource, chartConfig.xAxis, chartConfig.yAxis], () => {
    if (chartConfig.dataSource && chartConfig.xAxis && chartConfig.yAxis) {
      previewChartConfig();
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (previewChart) {
      previewChart.resize();
    }
  });
});

// Cleanup
onUnmounted(() => {
  if (previewChart) {
    previewChart.dispose();
    previewChart = null;
  }
});
</script>

<template>
  <div class="chart-builder-page">
    <nav class="glass">
      <div class="nav-content">
        <div class="left">
          <button @click="router.push('/')" class="back-btn">
            <ChevronLeft :size="20" />
            <span>返回控制台</span>
          </button>
        </div>
        <div class="logo">
          <BarChart2 :size="24" color="var(--primary)" />
          <span class="glow-text">{{ route.params.id ? '编辑图表' : '新建图表' }}</span>
        </div>
        <div class="right">
          <button @click="resetForm" class="ghost">
            <RefreshCw :size="18" />
          </button>
        </div>
      </div>
    </nav>

    <main>
      <div class="builder-container">
        <!-- Left Panel - Configuration -->
        <div class="config-panel glass">
          <div class="panel-header">
            <h2>图表配置</h2>
            <div class="header-actions">
              <button @click="saveChart" class="save-btn" :disabled="saving">
                <Save :size="16" v-if="!saving" />
                <RefreshCw :size="16" class="spinning" v-else />
                <span>保存配置</span>
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button 
              v-for="tab in ['basic', 'data', 'filters', 'permissions', 'styling']" 
              :key="tab"
              @click="activeTab = tab"
              class="tab-btn"
              :class="{ active: activeTab === tab }"
            >
              <component :is="{
                basic: BarChart2,
                data: Database,
                filters: Settings,
                permissions: Lock,
                styling: Palette
              }[tab]" :size="16" />
              <span>{{ { 
                basic: '基础设置',
                data: '数据源',
                filters: '过滤条件',
                permissions: '权限配置',
                styling: '样式设置'
              }[tab] }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Basic Settings -->
            <div v-if="activeTab === 'basic'" class="config-section">
              <div class="form-group">
                <label>图表标题</label>
                <input v-model="chartConfig.title" type="text" placeholder="输入图表标题" />
              </div>
              
              <div class="form-group">
                <label>图表描述</label>
                <textarea v-model="chartConfig.description" placeholder="输入图表描述（可选）" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label>图表类型</label>
                <div class="chart-type-grid">
                  <div 
                    v-for="type in chartTypes" 
                    :key="type.id"
                    @click="chartConfig.type = type.id"
                    class="chart-type-card"
                    :class="{ active: chartConfig.type === type.id }"
                  >
                    <component :is="type.icon" :size="24" />
                    <span>{{ type.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Source -->
            <div v-if="activeTab === 'data'" class="config-section">
              <div class="form-group">
                <label>数据源</label>
                <select v-model="chartConfig.dataSource">
                  <option value="">选择数据源</option>
                  <option v-for="source in availableDataSources" :key="source.id" :value="source.id">
                    {{ source.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group" v-if="chartConfig.dataSource">
                <label>X轴字段</label>
                <select v-model="chartConfig.xAxis">
                  <option value="">选择X轴字段</option>
                  <option v-for="field in getDataSourceFields" :key="field" :value="field">
                    {{ field }}
                  </option>
                </select>
              </div>
              
              <div class="form-group" v-if="chartConfig.dataSource">
                <label>Y轴字段</label>
                <select v-model="chartConfig.yAxis">
                  <option value="">选择Y轴字段</option>
                  <option v-for="field in getDataSourceFields" :key="field" :value="field">
                    {{ field }}
                  </option>
                </select>
              </div>
              
              <div class="form-group" v-if="chartConfig.dataSource">
                <label>聚合方式</label>
                <select v-model="chartConfig.aggregation">
                  <option v-for="method in aggregationMethods" :key="method.id" :value="method.id">
                    {{ method.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group" v-if="chartConfig.dataSource">
                <label>时间范围</label>
                <select v-model="chartConfig.timeRange">
                  <option v-for="range in timeRanges" :key="range.id" :value="range.id">
                    {{ range.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Filters -->
            <div v-if="activeTab === 'filters'" class="config-section">
              <div class="filters-header">
                <h4>数据过滤条件</h4>
                <button @click="addFilter" class="add-filter-btn">
                  <Plus :size="14" />
                  <span>添加条件</span>
                </button>
              </div>
              
              <div v-if="chartConfig.filters.length === 0" class="empty-filters">
                <p>暂无过滤条件</p>
              </div>
              
              <div v-else class="filters-list">
                <div v-for="(filter, index) in chartConfig.filters" :key="index" class="filter-item">
                  <select v-model="filter.field">
                    <option value="">选择字段</option>
                    <option v-for="field in getDataSourceFields" :key="field" :value="field">
                      {{ field }}
                    </option>
                  </select>
                  
                  <select v-model="filter.operator">
                    <option value="equals">等于</option>
                    <option value="not_equals">不等于</option>
                    <option value="contains">包含</option>
                    <option value="greater">大于</option>
                    <option value="less">小于</option>
                  </select>
                  
                  <input v-model="filter.value" type="text" placeholder="值" />
                  
                  <button @click="removeFilter(index)" class="remove-filter-btn">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Permissions -->
            <div v-if="activeTab === 'permissions'" class="config-section">
              <div class="form-group">
                <label>可见性</label>
                <div class="visibility-options">
                  <label class="radio-option">
                    <input v-model="chartConfig.permissions.visibility" type="radio" value="private" />
                    <span class="option-label">
                      <Lock :size="16" />
                      <div>
                        <strong>私有</strong>
                        <small>仅自己可见</small>
                      </div>
                    </span>
                  </label>
                  
                  <label class="radio-option">
                    <input v-model="chartConfig.permissions.visibility" type="radio" value="shared" />
                    <span class="option-label">
                      <Users :size="16" />
                      <div>
                        <strong>共享</strong>
                        <small>指定用户或角色可见</small>
                      </div>
                    </span>
                  </label>
                </div>
              </div>
              
              <div v-if="chartConfig.permissions.visibility === 'shared'" class="permission-details">
                <div class="permission-section">
                  <h4>允许的用户</h4>
                  <div class="user-list">
                    <label v-for="user in availableUsers" :key="user.id" class="user-checkbox">
                      <input 
                        type="checkbox" 
                        :checked="chartConfig.permissions.allowedUsers.includes(user.id)"
                        @change="toggleUserPermission(user.id)"
                      />
                      <span>{{ user.username }}</span>
                    </label>
                  </div>
                </div>
                
                <div class="permission-section">
                  <h4>允许的角色</h4>
                  <div class="role-list">
                    <label v-for="role in availableRoles" :key="role" class="role-checkbox">
                      <input 
                        type="checkbox" 
                        :checked="chartConfig.permissions.allowedRoles.includes(role)"
                        @change="toggleRolePermission(role)"
                      />
                      <span>{{ role === 'admin' ? '管理员' : '普通用户' }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Styling -->
            <div v-if="activeTab === 'styling'" class="config-section">
              <div class="form-group">
                <label>颜色主题</label>
                <div class="color-palette">
                  <div 
                    v-for="(color, index) in chartConfig.styling.colors" 
                    :key="index"
                    class="color-input"
                  >
                    <input 
                      v-model="chartConfig.styling.colors[index]" 
                      type="color" 
                    />
                    <span>{{ color }}</span>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label>显示选项</label>
                <div class="checkbox-group">
                  <label class="checkbox-option">
                    <input v-model="chartConfig.styling.showLegend" type="checkbox" />
                    <span>显示图例</span>
                  </label>
                  
                  <label class="checkbox-option">
                    <input v-model="chartConfig.styling.showGrid" type="checkbox" />
                    <span>显示网格</span>
                  </label>
                  
                  <label v-if="chartConfig.type === 'line'" class="checkbox-option">
                    <input v-model="chartConfig.styling.smooth" type="checkbox" />
                    <span>平滑曲线</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel - Preview -->
        <div class="preview-panel glass">
          <div class="panel-header">
            <h2>实时预览</h2>
            <button @click="previewChartConfig" class="preview-btn" :disabled="loading">
              <Eye v-if="!loading" :size="16" />
              <RefreshCw v-else :size="16" class="spinning" />
              <span>{{ loading ? '加载中...' : '刷新预览' }}</span>
            </button>
          </div>
          
          <div class="preview-container">
            <div v-if="!chartConfig.dataSource || !chartConfig.xAxis || !chartConfig.yAxis" class="preview-placeholder">
              <BarChart2 :size="48" opacity="0.3" />
              <p>请选择数据源并配置X轴、Y轴字段以预览图表</p>
            </div>
            
            <div v-else ref="chartPreview" class="chart-preview"></div>
          </div>
          
          <div class="preview-info">
            <div class="info-item">
              <span class="label">类型:</span>
              <span class="value">{{ chartTypes.find(t => t.id === chartConfig.type)?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">数据源:</span>
              <span class="value">{{ availableDataSources.find(s => s.id === chartConfig.dataSource)?.name || '未选择' }}</span>
            </div>
            <div class="info-item">
              <span class="label">权限:</span>
              <span class="value">
                {{ chartConfig.permissions.visibility === 'private' ? '私有' : 
                   chartConfig.permissions.visibility === 'shared' ? '共享' : '公开' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chart-builder-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 100;
  border-bottom: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.back-btn {
  color: var(--text-dim);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  color: var(--primary);
  text-shadow: 0 0 10px var(--primary-glow);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  letter-spacing: 2px;
  color: var(--primary);
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.builder-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: calc(100vh - 120px);
}

.config-panel,
.preview-panel {
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn,
.preview-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn:hover:not(:disabled),
.preview-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #0f172a;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.save-btn:disabled,
.preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text-dim);
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: rgba(56, 189, 248, 0.05);
}

.tab-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  color: white;
  padding: 0.8rem;
  border-radius: 6px;
  font-family: inherit;
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.chart-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-dim);
}

.chart-type-card:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.chart-type-card.active {
  border-color: var(--primary);
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h4 {
  margin: 0;
  color: var(--text);
}

.add-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.empty-filters {
  text-align: center;
  color: var(--text-dim);
  padding: 2rem;
}

.filters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-item select,
.filter-item input {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.remove-filter-btn {
  color: #ef4444;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  opacity: 0.7;
}

.remove-filter-btn:hover {
  opacity: 1;
}

.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.radio-option:hover {
  border-color: var(--primary);
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.option-label strong {
  display: block;
  color: var(--text);
}

.option-label small {
  color: var(--text-dim);
  font-size: 0.8rem;
}

.permission-details {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.permission-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-size: 0.9rem;
}

.user-list,
.role-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-checkbox,
.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  cursor: pointer;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  border-radius: 4px;
}

.color-input input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  min-height: 400px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-dim);
  text-align: center;
  flex: 1;
}

.chart-preview {
  flex: 1;
  min-height: 350px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 0.8rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  color: var(--text-dim);
}

.info-item .value {
  color: var(--text);
  font-weight: 500;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .builder-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  
  .config-panel,
  .preview-panel {
    height: auto;
  }
}
</style>