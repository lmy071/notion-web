<script setup>
import { defineProps } from 'vue';
import { ExternalLink } from 'lucide-vue-next';

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

const getImageUrl = (image) => {
  if (!image) return '';
  const url = image.type === 'external' ? image.external.url : image.file.url;
  return url.trim().replace(/^[`'"]|[`'"]$/g, '');
};
</script>

<template>
  <div class="notion-block" :class="[block.type, { 'has-children': block.children?.length > 0 }]">
    <!-- Heading 1 -->
    <h1 v-if="block.type === 'heading_1'" v-html="renderRichText(block.heading_1.rich_text)"></h1>
    
    <!-- Heading 2 -->
    <h2 v-else-if="block.type === 'heading_2'" v-html="renderRichText(block.heading_2.rich_text)"></h2>
    
    <!-- Heading 3 -->
    <h3 v-else-if="block.type === 'heading_3'" v-html="renderRichText(block.heading_3.rich_text)"></h3>
    
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
    <div v-else-if="block.type === 'child_page'" class="child-page-block">
      <div class="child-page-header">
        <span class="icon">📄</span>
        <span class="title">{{ block.child_page.title }}</span>
      </div>
    </div>

    <!-- Child Database -->
    <div v-else-if="block.type === 'child_database'" class="child-database-block">
      <div class="child-database-header">
        <span class="icon">🗂️</span>
        <span class="title">{{ block.child_database.title }}</span>
      </div>
    </div>

    <!-- Divider -->
    <hr v-else-if="block.type === 'divider'" class="notion-divider" />

    <!-- Fallback for unsupported types -->
    <div v-else-if="block.type !== 'table_row'" class="unsupported-block">
      <span class="type-tag">[{{ block.type }}]</span>
      <span>暂不支持渲染该类型的块</span>
    </div>

    <!-- Recursive children rendering -->
    <div 
      v-if="block.children && block.children.length > 0 && block.type !== 'table'" 
      class="nested-blocks" 
      :class="{ 'is-toggle-content': block.type === 'toggle' }"
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

.child-page-header, .child-database-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.child-page-header .title, .child-database-header .title {
  font-weight: 500;
  color: var(--primary);
}

.notion-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

.unsupported-block {
  font-size: 0.8rem;
  color: var(--text-dim);
  opacity: 0.5;
  font-style: italic;
  padding: 0.2rem 0;
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
