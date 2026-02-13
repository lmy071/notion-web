# Notion Web Manager - Notion 数据可视化与管理平台

一个基于 Vue 3 的现代化 Notion 数据管理平台，支持数据可视化、图表管理、用户权限控制等功能。

## ✨ 核心功能

### 📊 数据可视化
- **图表管理**: 创建、编辑、删除各种类型的图表
- **动态图表**: 支持折线图、柱状图、饼图、散点图等多种图表类型
- **实时预览**: 配置图表参数时实时预览效果
- **数据聚合**: 支持求和、平均值、计数、最大值、最小值等聚合方式
- **时间筛选**: 支持最近7天、30天、90天、1年等时间范围

### 🎨 图表构建器
- **可视化配置**: 直观的图表配置界面
- **数据源选择**: 支持多种数据表（消费记录、购物清单等）
- **字段映射**: 灵活配置X轴、Y轴、聚合方式
- **样式定制**: 自定义图表颜色、样式、主题
- **权限设置**: 私有、共享、公开三种权限级别

### 📱 现代化界面
- **响应式设计**: 完美适配桌面端、平板、手机
- **直观操作**: 拖拽式图表配置，简单易用
- **实时反馈**: 操作结果即时显示
- **优雅动画**: 流畅的页面切换和交互动画

### 🔐 用户认证
- **简单认证**: 基于用户ID的认证机制
- **权限控制**: 图表级别的访问权限管理
- **个人中心**: 用户个人信息和配置管理

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- 后端服务 (notion-sync) 已启动

### 安装依赖

```bash
npm install
```

### 配置代理（开发环境）

`vite.config.js` 已配置代理到后端服务：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📁 项目结构

```
notion-web/
├── src/
│   ├── views/            # 页面视图
│   │   ├── ChartsManagementView.vue    # 图表管理页面
│   │   ├── ChartBuilderView.vue        # 图表构建器
│   │   ├── DashboardView.vue           # 数据仪表板
│   │   ├── ConsumptionRecordsView.vue  # 消费记录
│   │   ├── DataPreviewView.vue         # 数据预览
│   │   ├── LoginView.vue               # 登录页面
│   │   └── ProfileView.vue             # 个人中心
│   ├── components/     # 可复用组件
│   │   ├── Navbar.vue                # 导航栏
│   │   ├── TechCard.vue              # 卡片组件
│   │   ├── TechModal.vue             # 模态框
│   │   └── TechToast.vue             # 提示消息
│   ├── stores/         # 状态管理
│   │   ├── auth.js                   # 用户认证状态
│   │   └── notification.js           # 通知状态
│   ├── utils/          # 工具函数
│   │   ├── api.js                    # API 客户端
│   │   ├── constants.js              # 常量定义
│   │   └── date.js                   # 日期工具
│   ├── router/         # 路由配置
│   │   └── index.js                  # 路由定义
│   ├── App.vue         # 根组件
│   └── main.js         # 应用入口
├── public/             # 静态资源
├── index.html          # HTML 入口
├── vite.config.js      # Vite 配置
└── package.json        # 项目依赖
```

## 🔧 技术栈

### 前端框架
- **Vue 3**: 渐进式 JavaScript 框架
- **Composition API**: Vue 3 的现代化组件编写方式
- **Vite**: 快速的构建工具和开发服务器

### 状态管理
- **Pinia**: Vue 官方状态管理库
- **持久化**: 用户认证状态持久化存储

### UI 和样式
- **Tailwind CSS**: 原子化 CSS 框架（通过 CDN 引入）
- **Lucide Icons**: 优雅的图标库
- **自定义组件**: 统一的 UI 组件库

### 图表和数据可视化
- **ECharts 6**: 强大的数据可视化库
- **动态渲染**: 基于配置实时生成图表
- **响应式**: 图表自适应容器大小

### HTTP 客户端
- **Axios**: 基于 Promise 的 HTTP 客户端
- **拦截器**: 统一的请求和响应处理
- **错误处理**: 统一的错误提示机制

## 📊 图表功能详解

### 图表配置选项

#### 基本配置
```javascript
{
  title: '图表标题',
  description: '图表描述',
  type: 'line', // line, bar, pie, scatter
  dataSource: 'xiao_fei_ji_lu_2',
  xAxis: 'xiao_fei_ri_qi',
  yAxis: 'jin_e',
  aggregation: 'sum', // sum, avg, count, max, min
  timeRange: '30d' // 7d, 30d, 90d, 1y
}
```

#### 权限配置
```javascript
{
  permissions: {
    visibility: 'private', // private, shared, public
    allowedUsers: [1, 2, 3], // 允许访问的用户ID
    allowedRoles: ['admin', 'user'] // 允许访问的角色
  }
}
```

#### 样式配置
```javascript
{
  styling: {
    color: '#3B82F6',
    theme: 'light', // light, dark
    showLegend: true,
    showGrid: true
  }
}
```

### 支持的图表类型

1. **折线图 (line)**
   - 适合展示趋势变化
   - 支持多条线对比
   - 可配置平滑曲线

2. **柱状图 (bar)**
   - 适合对比不同类别的数据
   - 支持横向和纵向
   - 可配置堆叠效果

3. **饼图 (pie)**
   - 适合展示占比关系
   - 支持环形图变体
   - 可配置标签显示

4. **散点图 (scatter)**
   - 适合展示相关性
   - 支持气泡图效果
   - 可配置点的大小和颜色

### 数据聚合方式

- **求和 (sum)**: 计算总和，适合财务数据
- **平均值 (avg)**: 计算平均数，适合分析趋势
- **计数 (count)**: 统计数量，适合频次分析
- **最大值 (max)**: 找出最大值，适合峰值分析
- **最小值 (min)**: 找出最小值，适合谷值分析

## 🎨 组件设计

### 图表管理组件
- **列表展示**: 卡片式布局，显示图表缩略图
- **搜索筛选**: 支持按标题、类型、创建时间筛选
- **批量操作**: 支持批量删除、权限修改
- **排序功能**: 按创建时间、更新时间排序

### 图表构建器组件
- **步骤引导**: 分步骤的图表配置流程
- **实时预览**: 配置变更即时反映在预览中
- **配置验证**: 表单验证确保配置正确性
- **保存草稿**: 支持保存未完成的配置

### 数据展示组件
- **响应式图表**: 自适应不同屏幕尺寸
- **交互式提示**: 鼠标悬停显示详细数据
- **加载状态**: 优雅的加载动画
- **错误处理**: 友好的错误提示

## 🔄 数据流

### 图表数据获取流程
1. 用户选择数据源和配置参数
2. 前端发送配置到 `/api/charts/preview`
3. 后端生成 SQL 查询并执行
4. 返回聚合后的数据给前端
5. 前端使用 ECharts 渲染图表

### 图表保存流程
1. 用户完成图表配置
2. 点击保存按钮
3. 前端发送完整配置到 `/api/charts`
4. 后端验证权限并保存到数据库
5. 返回保存结果和图表 ID

## 🛡️ 错误处理

### 前端错误处理
```javascript
try {
  const response = await api.post('/charts/preview', config);
  // 处理成功响应
} catch (error) {
  // 显示错误提示
  showToast(error.response?.data?.message || '请求失败');
}
```

### 表单验证
- **必填字段**: 标题、类型、数据源等必填验证
- **格式验证**: 时间范围格式、数字范围验证
- **权限验证**: 用户是否有权限访问数据源

## 📱 响应式设计

### 断点设置
- **移动端**: < 768px
- **平板端**: 768px - 1024px
- **桌面端**: > 1024px

### 适配策略
- **图表自适应**: 使用 ECharts 的 resize 功能
- **布局调整**: 移动端采用单列布局
- **交互优化**: 移动端使用更大的点击区域

## 🔧 开发指南

### 添加新的图表类型
1. 在 `ChartBuilderView.vue` 中添加新的类型选项
2. 更新 ECharts 配置生成逻辑
3. 添加对应的图标和预览效果

### 自定义主题
1. 修改 `styling` 配置项的处理逻辑
2. 更新 ECharts 的主题配置
3. 添加主题切换功能

### 扩展数据源
1. 在后端添加新的数据表支持
2. 更新前端的下拉选项
3. 添加对应的数据字段映射

## 📈 性能优化

### 图表渲染优化
- **懒加载**: 只在需要时渲染图表
- **防抖**: 配置变更时添加防抖处理
- **缓存**: 缓存相同配置的图表数据

### 数据获取优化
- **分页**: 大量数据时分页获取
- **防抖**: 搜索输入添加防抖
- **缓存**: 缓存常用的数据配置

## 🧪 测试建议

### 单元测试
- 测试图表配置生成逻辑
- 测试数据格式转换函数
- 测试权限验证逻辑

### 集成测试
- 测试完整的图表创建流程
- 测试数据获取和渲染
- 测试权限控制功能

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 优秀的前端框架
- [ECharts](https://echarts.apache.org/) - 强大的数据可视化库
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Pinia](https://pinia.vuejs.org/) - 优雅的状态管理
- [Axios](https://axios-http.com/) - 可靠的 HTTP 客户端

---

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**