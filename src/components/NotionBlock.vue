<script setup>
import { defineProps, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ExternalLink, List, Loader2 } from 'lucide-vue-next';
import { useAuthStore, api } from '../stores/auth';

const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
});

const router = useRouter();
const authStore = useAuthStore();

const dbResults = ref([]);
const dbLoading = ref(false);

const fetchDbData = async () => {
  if (props.block.type !== 'child_database') return;
  
  dbLoading.value = true;
  try {
    const response = await api.get(`/notion/database/${props.block.id}/preview`, {
      headers: { 'x-user-id': authStore.userId }
    });
    if (response.data.success) {
      dbResults.value = response.data.results.slice(0, 10);
    }
  } catch (error) {
    console.error('Fetch inline db data error:', error);
  } finally {
    dbLoading.value = false;
  }
};

const getPageTitle = (page) => {
  if (!page || !page.properties) return '未命名';
  // 查找类型为 title 的属性
  const titleProp = Object.values(page.properties).find(p => p.type === 'title');
  if (titleProp && titleProp.title && titleProp.title.length > 0) {
    return titleProp.title.map(t => t.plain_text).join('');
  }
  return '未命名';
};

const goToPage = (id, type = 'page') => {
  if (!id) return;
  if (type === 'database') {
    // 跳转到数据库表格视图
    router.push(`/data/${id}`);
  } else {
    // 统一跳转到工作区详情页面
    router.push(`/workspace/page/${id}`);
  }
};

const renderRichText = (richText) => {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => {
    let content = t.plain_text || '';
    if (!content) return '';
    
    if (t.annotations) {
      if (t.annotations.bold) content = `<strong>${content}</strong>`;
      if (t.annotations.italic) content = `<em>${content}</em>`;
      if (t.annotations.strikethrough) content = `<del>${content}</del>`;
      if (t.annotations.underline) content = `<u>${content}</u>`;
      if (t.annotations.code) content = `<code>${content}</code>`;
      if (t.annotations.color && t.annotations.color !== 'default') {
        content = `<span style="color: ${t.annotations.color}">${content}</span>`;
      }
    }
    
    if (t.href) content = `<a href="${t.href}" target="_blank" class="notion-link">${content}</a>`;
    return content;
  }).join('');
};

const getFileUrl = (blockData) => {
  if (!blockData) return '';
  const url = blockData.type === 'external' ? blockData.external.url : blockData.file.url;
  return url.trim().replace(/^[`'"]|[`'"]$/g, '');
};

const getImageUrl = (image) => getFileUrl(image);

onMounted(() => {
  if (props.block.type === 'child_database') {
    fetchDbData();
  }
});
</script>

<template>
  <div class="notion-block" :class="[block.type, { 'has-children': block.children?.length > 0 }]">
    <!-- Heading 1 -->
    <h1 v-if="block.type === 'heading_1'" v-html="renderRichText(block.heading_1.rich_text)"></h1>
    
    <!-- Heading 2 -->
    <h2 v-else-if="block.type === 'heading_2'" v-html="renderRichText(block.heading_2.rich_text)"></h2>
    
    <!-- Heading 3 -->
    <h3 v-else-if="block.type === 'heading_3'" v-html="renderRichText(block.heading_3.rich_text)"></h3>
    
    <!-- Heading 4 -->
    <h4 v-else-if="block.type === 'heading_4'" v-html="renderRichText(block.heading_4.rich_text)"></h4>
    
    <!-- Heading 5 -->
    <h5 v-else-if="block.type === 'heading_5'" v-html="renderRichText(block.heading_5.rich_text)"></h5>
    
    <!-- Heading 6 -->
    <h6 v-else-if="block.type === 'heading_6'" v-html="renderRichText(block.heading_6.rich_text)"></h6>
    
    <!-- Paragraph -->
    <p v-else-if="block.type === 'paragraph'" v-html="renderRichText(block.paragraph.rich_text)"></p>
    
    <!-- Bulleted List Item -->
    <div v-else-if="block.type === 'bulleted_list_item'" class="list-item">
      <span class="bullet">•</span>
      <div class="item-content">
        <span v-html="renderRichText(block.bulleted_list_item.rich_text)"></span>
      </div>
    </div>

    <!-- Numbered List Item -->
    <div v-else-if="block.type === 'numbered_list_item'" class="list-item">
      <span class="bullet">1.</span>
      <div class="item-content">
        <span v-html="renderRichText(block.numbered_list_item.rich_text)"></span>
      </div>
    </div>

    <!-- Code -->
    <pre v-else-if="block.type === 'code'" class="code-block">
      <code>{{ block.code.rich_text.map(t => t.plain_text).join('') }}</code>
      <span class="lang-badge">{{ block.code.language }}</span>
    </pre>

    <!-- To Do -->
    <div v-else-if="block.type === 'to_do'" class="todo-item">
      <input type="checkbox" :checked="block.to_do.checked" disabled />
      <span v-html="renderRichText(block.to_do.rich_text)" :class="{ checked: block.to_do.checked }"></span>
    </div>

    <!-- Quote -->
    <blockquote v-else-if="block.type === 'quote'" v-html="renderRichText(block.quote.rich_text)"></blockquote>

    <!-- Toggle -->
    <details v-else-if="block.type === 'toggle'" class="toggle-block">
      <summary v-html="renderRichText(block.toggle.rich_text)"></summary>
    </details>

    <!-- Image -->
    <div v-else-if="block.type === 'image'" class="image-block">
      <img :src="getImageUrl(block.image)" alt="Notion Image" @error="(e) => e.target.style.display='none'" />
      <p v-if="block.image.caption && block.image.caption.length > 0" class="caption" v-html="renderRichText(block.image.caption)"></p>
    </div>

    <!-- Table -->
    <div v-else-if="block.type === 'table'" class="table-wrapper">
      <table class="notion-table">
        <tbody>
          <tr 
            v-for="(row, rowIndex) in block.children" 
            :key="row.id" 
            :class="{ 'header-row': block.table.has_column_header && rowIndex === 0 }"
          >
            <td 
              v-for="(cell, cellIndex) in row.table_row?.cells" 
              :key="cellIndex" 
              v-html="renderRichText(cell)"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Callout -->
    <div v-else-if="block.type === 'callout'" class="callout-block" :style="{ backgroundColor: block.callout.color === 'default' ? 'rgba(56, 189, 248, 0.05)' : block.callout.color }">
      <div class="callout-icon" v-if="block.callout.icon">
        <span v-if="block.callout.icon.type === 'emoji'">{{ block.callout.icon.emoji }}</span>
        <img v-else-if="block.callout.icon.type === 'external'" :src="block.callout.icon.external.url" class="icon-img" />
      </div>
      <div class="callout-content" v-html="renderRichText(block.callout.rich_text)"></div>
    </div>

    <!-- Bookmark -->
    <a v-else-if="block.type === 'bookmark'" :href="block.bookmark.url" target="_blank" class="bookmark-block glass">
      <div class="bookmark-content">
        <div class="bookmark-url">{{ block.bookmark.url }}</div>
      </div>
      <div class="bookmark-icon">
        <ExternalLink :size="16" />
      </div>
    </a>

    <!-- Child Page (Recursively Rendered if synced) -->
    <div 
      v-else-if="block.type === 'child_page'" 
      class="child-page-block clickable"
      @click="goToPage(block.id, 'page')"
    >
      <div class="child-page-header">
        <span class="icon">📄</span>
        <span class="title">{{ block.child_page.title }}</span>
      </div>
    </div>

    <!-- Child Database -->
    <div 
      v-else-if="block.type === 'child_database'" 
      class="child-database-block"
    >
      <div class="child-database-header clickable" @click="goToPage(block.id, 'database')">
        <span class="icon">🗂️</span>
        <span class="title">{{ block.child_database.title }}</span>
      </div>
      
      <div class="child-database-preview glass">
        <div v-if="dbLoading" class="preview-loading">
          <Loader2 :size="16" class="spinning" />
          <span>正在获取数据...</span>
        </div>
        <div v-else-if="dbResults.length > 0" class="preview-list">
          <div 
            v-for="item in dbResults" 
            :key="item.id" 
            class="preview-item clickable"
            @click="goToPage(item.id, 'page')"
          >
            <span class="icon">�</span>
            <span class="item-name">{{ getPageTitle(item) }}</span>
          </div>
          <div v-if="dbResults.length >= 10" class="preview-more" @click="goToPage(block.id, 'database')">
            查看更多...
          </div>
        </div>
        <div v-else class="preview-empty">
          暂无数据记录
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr v-else-if="block.type === 'divider'" class="notion-divider" />

    <!-- Column List -->
    <div v-else-if="block.type === 'column_list'" class="column-list">
      <NotionBlock 
        v-for="child in block.children" 
        :key="child.id" 
        :block="child" 
        :level="level + 1"
      />
    </div>

    <!-- Column -->
    <div v-else-if="block.type === 'column'" class="column-block">
      <NotionBlock 
        v-for="child in block.children" 
        :key="child.id" 
        :block="child" 
        :level="level + 1"
      />
    </div>

    <!-- Synced Block -->
    <div v-else-if="block.type === 'synced_block'" class="synced-block">
      <NotionBlock 
        v-for="child in block.children" 
        :key="child.id" 
        :block="child" 
        :level="level + 1"
      />
    </div>

    <!-- Video -->
    <div v-else-if="block.type === 'video'" class="video-block">
      <video v-if="getFileUrl(block.video).endsWith('.mp4')" :src="getFileUrl(block.video)" controls></video>
      <div v-else class="video-placeholder glass">
        <span class="icon">🎥</span>
        <a :href="getFileUrl(block.video)" target="_blank" class="notion-link">查看视频资源</a>
      </div>
      <p v-if="block.video.caption && block.video.caption.length > 0" class="caption" v-html="renderRichText(block.video.caption)"></p>
    </div>

    <!-- File / PDF / Audio -->
    <a v-else-if="['file', 'pdf', 'audio'].includes(block.type)" :href="getFileUrl(block[block.type])" target="_blank" class="file-block glass">
      <div class="file-info">
        <span class="icon">
          <template v-if="block.type === 'audio'">🎵</template>
          <template v-else-if="block.type === 'pdf'">📕</template>
          <template v-else>📎</template>
        </span>
        <span class="title">{{ block.type.toUpperCase() }} 文件</span>
      </div>
      <ExternalLink :size="16" />
    </a>

    <!-- Link to Page -->
    <div 
      v-else-if="block.type === 'link_to_page'" 
      class="child-page-block clickable"
      @click="goToPage(
        block.link_to_page.page_id || block.link_to_page.database_id, 
        block.link_to_page.type === 'database_id' ? 'database' : 'page'
      )"
    >
      <div class="child-page-header">
        <span class="icon">🔗</span>
        <span class="title">链接到页面</span>
      </div>
    </div>

    <!-- Equation -->
    <div v-else-if="block.type === 'equation'" class="equation-block">
      <div class="equation-content">
        {{ block.equation.expression }}
      </div>
    </div>

    <!-- Embed -->
    <div v-else-if="block.type === 'embed'" class="embed-block glass">
      <iframe :src="block.embed.url" frameborder="0" allowfullscreen></iframe>
      <div class="embed-caption" v-if="block.embed.caption" v-html="renderRichText(block.embed.caption)"></div>
    </div>

    <!-- Table of Contents -->
    <div v-else-if="block.type === 'table_of_contents'" class="toc-block glass">
      <div class="toc-header">
        <span class="icon">📑</span>
        <span>页面目录</span>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div v-else-if="block.type === 'breadcrumb'" class="breadcrumb-block">
      <span class="icon">🧭</span>
      <span>导航路径</span>
    </div>

    <!-- Fallback for unsupported types -->
    <div v-else-if="!['table_row', 'template'].includes(block.type)" class="unsupported-block">
      <span class="type-tag">[{{ block.type }}]</span>
      <span>暂不支持渲染该类型的块</span>
    </div>

    <!-- Recursive children rendering -->
    <div 
      v-if="block.children && block.children.length > 0 && !['table', 'column_list', 'column', 'synced_block'].includes(block.type)" 
      class="nested-blocks" 
      :class="{ 'is-toggle-content': block.type === 'toggle', 'is-template': block.type === 'template' }"
    >
      <NotionBlock 
        v-for="child in block.children" 
        :key="child.id" 
        :block="child" 
        :level="level + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.notion-block {
  margin-bottom: 0.5rem;
  width: 100%;
}

h1 { font-size: 1.8rem; margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; color: var(--primary); }
h2 { font-size: 1.5rem; margin-top: 1.5rem; color: var(--primary); opacity: 0.9; }
h3 { font-size: 1.25rem; margin-top: 1.2rem; color: var(--primary); opacity: 0.8; }
h4 { font-size: 1.15rem; margin-top: 1.1rem; color: var(--primary); opacity: 0.75; }
h5 { font-size: 1.05rem; margin-top: 1rem; color: var(--primary); opacity: 0.7; }
h6 { font-size: 1rem; margin-top: 0.9rem; color: var(--primary); opacity: 0.65; }
p { font-size: 1rem; margin-bottom: 0.5rem; min-height: 1.2em; }

.list-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
}

.bullet {
  color: var(--primary);
  font-weight: bold;
  flex-shrink: 0;
}

.nested-blocks {
  margin-left: 1.5rem;
  margin-top: 0.2rem;
  border-left: 1px solid rgba(56, 189, 248, 0.2);
  padding-left: 1rem;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  padding: 1.2rem;
  border-radius: 8px;
  font-family: 'Fira Code', monospace;
  position: relative;
  overflow-x: auto;
  border: 1px solid var(--border);
  margin: 1rem 0;
}

.lang-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  color: var(--primary);
  text-transform: uppercase;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
}

.todo-item .checked {
  text-decoration: line-through;
  opacity: 0.5;
}

blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 1.5rem;
  font-style: italic;
  margin: 1rem 0;
  color: var(--text-dim);
  background: rgba(56, 189, 248, 0.05);
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.toggle-block summary {
  cursor: pointer;
  font-weight: bold;
  color: var(--primary);
  outline: none;
  padding: 0.2rem 0;
}

.toggle-block summary:hover {
  opacity: 0.8;
}

.table-wrapper {
  margin: 1.5rem 0;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.notion-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.notion-table td {
  border: 1px solid var(--border);
  padding: 0.8rem 1rem;
  color: var(--text);
}

.header-row {
  background: rgba(56, 189, 248, 0.1);
}

.header-row td {
  font-weight: bold;
  color: var(--primary);
}

.callout-block {
  display: flex;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.callout-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.callout-content {
  flex: 1;
  color: var(--text);
}

.bookmark-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-decoration: none;
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.bookmark-block:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.bookmark-content {
  flex: 1;
  min-width: 0;
}

.bookmark-url {
  font-size: 0.8rem;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-icon {
  color: var(--text-dim);
  margin-left: 1rem;
}

.image-block {
  margin: 1.5rem 0;
  text-align: center;
}

.image-block img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.child-page-block, .child-database-block {
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  margin: 0.3rem 0;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: var(--primary);
  transform: translateX(4px);
}

.child-page-header, .child-database-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.child-page-header .title, .child-database-header .title {
  font-weight: 500;
  color: var(--primary);
}

.child-database-preview {
  margin-top: 0.5rem;
  margin-left: 1.5rem;
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid rgba(56, 189, 248, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.preview-loading, .preview-empty {
  padding: 0.8rem;
  font-size: 0.85rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-list {
  display: flex;
  flex-direction: column;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.preview-item:hover {
  background: rgba(56, 189, 248, 0.1);
}

.item-name {
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-more {
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  color: var(--primary);
  cursor: pointer;
  text-align: right;
  opacity: 0.8;
}

.preview-more:hover {
  opacity: 1;
  text-decoration: underline;
}

.notion-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

.column-list {
  display: flex;
  gap: 1.5rem;
  margin: 1rem 0;
  width: 100%;
}

@media (max-width: 768px) {
  .column-list {
    flex-direction: column;
    gap: 1rem;
  }
}

.column-block {
  flex: 1;
  min-width: 0;
}

.video-block {
  margin: 1.5rem 0;
  width: 100%;
}

.video-block video {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.video-placeholder {
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
}

.file-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-decoration: none;
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.file-block:hover {
  border-color: var(--primary);
  background: rgba(56, 189, 248, 0.05);
  transform: translateY(-2px);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-info .icon {
  font-size: 1.5rem;
}

.file-info .title {
  font-weight: 500;
  color: var(--text);
}

.synced-block {
  border-left: 2px solid var(--primary);
  padding-left: 1rem;
  margin: 1rem 0;
  opacity: 0.9;
}

.equation-block {
  text-align: center;
  padding: 1rem 0;
  font-family: 'Fira Code', monospace;
  color: var(--primary);
  font-size: 1.1rem;
}

.embed-block {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.embed-block iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.embed-caption {
  padding: 0.8rem;
  font-size: 0.8rem;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
}

.toc-block, .breadcrumb-block {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 0.9rem;
}

.toc-header {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.is-template {
  border-left-style: dashed;
}

.unsupported-block {
  font-size: 0.75rem;
  color: var(--text-dim);
  opacity: 0.4;
  font-style: italic;
  padding: 0.1rem 0;
}

.type-tag {
  color: var(--primary);
  margin-right: 0.5rem;
}

:deep(.notion-link) {
  color: var(--primary);
  text-decoration: underline;
}

:deep(.notion-link:hover) {
  color: white;
}
</style>
