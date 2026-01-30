<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, api } from '../stores/auth';
import TechCard from '../components/TechCard.vue';
import TechToast from '../components/TechToast.vue';
import { 
  FileText, 
  ChevronLeft, 
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { databaseId, pageId } = route.params;

const blocks = ref([]);
const loading = ref(true);
const synced = ref(true);
const syncMessage = ref('');
const notifications = ref([]);

const notify = (message, type = 'success') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const fetchPageDetail = async () => {
  loading.value = true;
  synced.value = true;
  try {
    const response = await api.get(`/data/${databaseId}/page/${pageId}`, {
      headers: { 'x-user-id': authStore.userId }
    });
    
    if (response.data.success) {
      if (response.data.synced) {
        blocks.value = response.data.data;
      } else {
        synced.value = false;
        syncMessage.value = response.data.message;
      }
    } else {
      notify(response.data.message || '获取详情失败', 'error');
    }
  } catch (error) {
    console.error('Fetch detail error:', error);
    notify('获取页面详情失败', 'error');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push(`/data/${databaseId}`);
};

// 递归渲染块的辅助函数
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
    }
    
    if (t.href) content = `<a href="${t.href}" target="_blank" class="notion-link">${content}</a>`;
    return content;
  }).join('');
};

const getImageUrl = (image) => {
  if (!image) return '';
  const url = image.type === 'external' ? image.external.url : image.file.url;
  // 清理可能存在的首尾空格或引号
  return url.trim().replace(/^[`'"]|[`'"]$/g, '');
};

onMounted(fetchPageDetail);
</script>

<template>
  <div class="page-detail-container">
    <main>
      <header class="detail-header">
        <button @click="goBack" class="back-btn ghost">
          <ChevronLeft :size="20" />
          <span>返回列表</span>
        </button>
        <div class="title-section">
          <FileText :size="24" color="var(--primary)" />
          <h1>页面详情分析</h1>
        </div>
      </header>

      <TechCard class="content-card glass">
        <div v-if="loading" class="loading-state">
          <RefreshCw :size="48" class="spinning" color="var(--primary)" />
          <p>正在从数据库读取节点结构...</p>
        </div>
        
        <div v-else-if="!synced" class="unsynced-state">
          <AlertTriangle :size="48" color="#f59e0b" />
          <h2>页面尚未同步</h2>
          <p>{{ syncMessage }}</p>
          <button @click="goBack" class="primary-btn">返回列表并同步</button>
        </div>

        <div v-else class="notion-content">
          <div v-if="blocks.length === 0" class="empty-state">
            <p>该页面没有可显示的内容块</p>
          </div>

          <div v-for="block in blocks" :key="block.id" class="notion-block" :class="block.type">
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
                <!-- 递归渲染子块 -->
                <div v-if="block.children && block.children.length > 0" class="nested-blocks">
                  <div v-for="child in block.children" :key="child.id" class="notion-block" :class="child.type">
                     <p v-if="child.type === 'paragraph'" v-html="renderRichText(child.paragraph.rich_text)"></p>
                     <div v-else-if="child.type === 'bulleted_list_item'" class="list-item">
                        <span class="bullet">•</span>
                        <span v-html="renderRichText(child.bulleted_list_item.rich_text)"></span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Numbered List Item -->
            <div v-else-if="block.type === 'numbered_list_item'" class="list-item">
              <span class="bullet">1.</span>
              <div class="item-content">
                <span v-html="renderRichText(block.numbered_list_item.rich_text)"></span>
                <div v-if="block.children && block.children.length > 0" class="nested-blocks">
                  <div v-for="child in block.children" :key="child.id" class="notion-block" :class="child.type">
                    <p v-if="child.type === 'paragraph'" v-html="renderRichText(child.paragraph.rich_text)"></p>
                    <div v-else-if="child.type === 'numbered_list_item'" class="list-item">
                      <span class="bullet">1.</span>
                      <span v-html="renderRichText(child.numbered_list_item.rich_text)"></span>
                    </div>
                  </div>
                </div>
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
              <div v-if="block.children && block.children.length > 0" class="nested-blocks">
                <div v-for="child in block.children" :key="child.id" class="notion-block" :class="child.type">
                  <p v-if="child.type === 'paragraph'" v-html="renderRichText(child.paragraph.rich_text)"></p>
                  <div v-else-if="child.type === 'bulleted_list_item'" class="list-item">
                    <span class="bullet">•</span>
                    <span v-html="renderRichText(child.bulleted_list_item.rich_text)"></span>
                  </div>
                </div>
              </div>
            </details>

            <!-- Image -->
            <div v-else-if="block.type === 'image'" class="image-block">
              <img :src="getImageUrl(block.image)" alt="Notion Image" @error="(e) => e.target.style.display='none'" />
              <p v-if="block.image.caption && block.image.caption.length > 0" class="caption" v-html="renderRichText(block.image.caption)"></p>
            </div>

            <!-- Fallback for unsupported types -->
            <div v-else class="unsupported-block">
              <span class="type-tag">[{{ block.type }}]</span>
              <span>暂不支持渲染该类型的块</span>
            </div>
          </div>
        </div>
      </TechCard>
    </main>

    <div class="notifications-container">
      <TechToast 
        v-for="n in notifications" 
        :key="n.id"
        :message="n.message"
        :type="n.type"
        @close="removeNotification(n.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.page-detail-container {
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-dim);
}

.back-btn:hover {
  color: var(--primary);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h1 {
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.content-card {
  padding: 3rem;
  min-height: 500px;
}

.notion-content {
  color: var(--text);
  line-height: 1.6;
}

.notion-block {
  margin-bottom: 1rem;
}

h1 { font-size: 2rem; margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; color: var(--primary); }
h2 { font-size: 1.5rem; margin-top: 1.5rem; color: var(--primary); opacity: 0.9; }
h3 { font-size: 1.25rem; margin-top: 1.2rem; color: var(--primary); opacity: 0.8; }
p { font-size: 1rem; margin-bottom: 0.8rem; }

.list-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.bullet {
  color: var(--primary);
  font-weight: bold;
}

.nested-blocks {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  border-left: 1px solid var(--border);
  padding-left: 1rem;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  position: relative;
  overflow-x: auto;
  border: 1px solid var(--border);
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
  margin-bottom: 0.5rem;
}

.todo-item .checked {
  text-decoration: line-through;
  opacity: 0.5;
}

blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 1.5rem;
  font-style: italic;
  margin: 1.5rem 0;
  color: var(--text-dim);
}

.toggle-block summary {
  cursor: pointer;
  font-weight: bold;
  color: var(--primary);
  outline: none;
}

.image-block {
  margin: 2rem 0;
  text-align: center;
}

.image-block img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.caption {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-top: 0.5rem;
}

.unsupported-block {
  font-size: 0.8rem;
  color: var(--text-dim);
  opacity: 0.5;
  font-style: italic;
}

.type-tag {
  color: var(--primary);
  margin-right: 0.5rem;
}

.loading-state, .unsynced-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1.5rem;
  color: var(--text-dim);
}

.unsynced-state h2 {
  color: white;
  margin: 0;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

:deep(.notion-link) {
  color: var(--primary);
  text-decoration: underline;
}

:deep(.notion-link:hover) {
  color: white;
}
</style>
