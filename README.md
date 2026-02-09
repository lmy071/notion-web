# Notion Web Manager

一个基于 Notion API 的 Web 管理界面，用于便捷地管理 Notion 博客、页面和内容。

## ✨ 特性

- **📝 博客管理** - 获取、搜索、创建、编辑和删除博客文章
- **📄 页面管理** - 查看和创建 Notion 页面
- **🧩 块内容查看** - 查看页面中的块结构内容
- **🔍 数据库查询** - 支持 Notion 数据库查询功能
- **🎨 现代化界面** - 基于 Vue 3 + Tailwind CSS 的美观界面
- **📱 响应式设计** - 支持各种设备尺寸

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- Notion Integration Token

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_NOTION_API_KEY=your_notion_integration_token
VITE_NOTION_ROOT_PAGE_ID=your_root_page_id
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
notion-web/
├── src/
│   ├── api/            # Notion API 调用封装
│   │   ├── blog.js    # 博客相关 API
│   │   ├── page.js    # 页面相关 API
│   │   └── notion.js  # 基础 API 方法
│   ├── components/    # 可复用组件
│   ├── views/         # 页面视图
│   │   ├── Blog.vue       # 博客列表页
│   │   ├── BlogEditor.vue # 博客编辑器
│   │   ├── PageList.vue   # 页面列表
│   │   ├── Block.vue      # 块内容展示
│   │   └── Database.vue   # 数据库查询
│   ├── stores/        # Pinia 状态管理
│   │   └── notion.js  # Notion 数据状态
│   ├── utils/         # 工具函数
│   │   └── constants.js  # 常量定义
│   ├── router/        # Vue Router 配置
│   ├── App.vue        # 根组件
│   └── main.js        # 应用入口
├── public/            # 静态资源
├── index.html         # HTML 入口
├── vite.config.js     # Vite 配置
└── package.json       # 项目依赖
```

## 🔑 主要功能

### 博客管理 (`/blog`)

- 查看所有博客文章列表
- 搜索博客文章
- 创建新博客文章
- 编辑现有文章
- 删除文章

### 页面管理 (`/pages`)

- 查看 Notion 页面层级结构
- 创建新页面
- 删除页面

### 块内容查看 (`/block/:id`)

- 查看页面的块结构
- 展示各种类型的块内容

### 数据库查询 (`/database`)

- 执行 Notion 数据库查询
- 展示数据库内容

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由管理**: [Vue Router](https://router.vuejs.org/)
- **样式框架**: [Tailwind CSS](https://tailwindcss.com/)
- **API 集成**: [Notion API](https://developers.notion.com/)

## 📦 主要依赖

- `vue` - MVVM 框架
- `vue-router` - 路由管理
- `pinia` - 状态管理
- `axios` - HTTP 客户端
- `tailwindcss` - 原子化 CSS 框架
- `@notionhq/client` - Notion 官方 SDK

## 🤝 贡献指南

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- [Notion API](https://developers.notion.com/) - 提供强大的内容管理能力
- [Vue.js 团队](https://vuejs.org/) - 提供优秀的前端框架
- [Tailwind CSS](https://tailwindcss.com/) - 提供美观的样式解决方案
