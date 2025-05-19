<template>
  <DefaultLayout>
    <!-- 页面标题 -->
    <div class="articles-header">
      <div class="title-area">
        <h1 class="page-title">徒步资讯</h1>
        <p class="page-desc">
          精选户外徒步相关的资讯文章，包括装备指南、徒步技巧、安全知识和户外经验分享
        </p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <a-row :gutter="[16, 16]" align="center">
        <a-col :span="8">
          <a-input-search
            placeholder="搜索文章标题、内容"
            allow-clear
            v-model="searchQuery"
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="5">
          <a-select
            placeholder="文章分类"
            v-model="categoryFilter"
            allow-clear
            @change="applyFilters"
          >
            <a-option value="equipment">装备指南</a-option>
            <a-option value="safety">安全知识</a-option>
            <a-option value="skills">徒步技巧</a-option>
            <a-option value="destination">目的地推荐</a-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            placeholder="发布时间"
            v-model="timeFilter"
            allow-clear
            @change="applyFilters"
          >
            <a-option value="week">最近一周</a-option>
            <a-option value="month">最近一月</a-option>
            <a-option value="year">最近一年</a-option>
          </a-select>
        </a-col>
      </a-row>
    </div>

    <!-- 文章列表 -->
    <a-divider style="margin: 16px 0" />

    <div class="articles-container">
      <a-row :gutter="[24, 24]">
        <a-col :span="8" v-for="article in filteredArticles" :key="article.id">
          <a-card
            class="article-card"
            hoverable
            @click="viewArticleDetail(article.id)"
          >
            <template #cover>
              <div
                class="article-image"
                :style="{ backgroundImage: `url(${article.image})` }"
              >
                <div
                  class="article-category"
                  :class="getCategoryClass(article.category)"
                >
                  {{ article.category }}
                </div>
              </div>
            </template>
            <a-card-meta :title="article.title">
              <template #description>
                <p class="article-summary">{{ article.summary }}</p>
                <div class="article-meta">
                  <span class="article-date">{{
                    formatDate(article.created_at)
                  }}</span>
                  <span class="article-views">{{ article.views }}次阅读</span>
                </div>
              </template>
            </a-card-meta>

            <div class="article-footer">
              <div class="article-author">
                <a-avatar :size="24" :src="article.authorAvatar || ''">
                  {{ article.author ? article.author.substring(0, 1) : "用户" }}
                </a-avatar>
                <span>{{ article.author || "匿名用户" }}</span>
              </div>
              <a-button
                type="primary"
                shape="round"
                @click.stop="openArticleDetail(article)"
              >
                阅读全文
                <template #icon><icon-right /></template>
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMoreArticles">
        <a-button type="text" @click="loadMoreArticles" :loading="loading">
          加载更多文章
          <template #icon><icon-down /></template>
        </a-button>
      </div>
    </div>

    <!-- 文章详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      :title="selectedArticle?.title"
      :footer="false"
      :maskClosable="true"
      width="700px"
    >
      <div v-if="selectedArticle" class="article-detail-modal">
        <!-- 文章图片 -->
        <div
          class="article-detail-image"
          :style="{ backgroundImage: `url(${selectedArticle.image})` }"
        >
          <div
            class="article-category"
            :class="getCategoryClass(selectedArticle.category)"
          >
            {{ selectedArticle.category }}
          </div>
        </div>

        <!-- 文章基本信息 -->
        <div class="article-detail-info">
          <div class="info-row">
            <div class="info-item author">
              <a-avatar :size="24" :src="selectedArticle.authorAvatar || ''">
                {{
                  selectedArticle.author
                    ? selectedArticle.author.substring(0, 1)
                    : "用户"
                }}
              </a-avatar>
              <span>{{ selectedArticle.author || "匿名用户" }}</span>
            </div>
            <div class="info-item date">
              <icon-clock-circle class="info-icon" />
              <span>{{ formatDate(selectedArticle.created_at) }}</span>
            </div>
            <div class="info-item views">
              <icon-eye class="info-icon" />
              <span>{{ selectedArticle.views }}次阅读</span>
            </div>
          </div>
        </div>

        <!-- 文章内容 -->
        <a-divider>文章内容</a-divider>
        <div class="article-content">
          <p>{{ selectedArticle.content || selectedArticle.summary }}</p>
        </div>
      </div>
    </a-modal>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconClockCircle,
  IconEye,
  IconRight,
  IconDown,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import {
  ArticlesService,
  Article,
  ArticleFilter,
} from "../../services/articles.service";

// 筛选和搜索状态
const searchQuery = ref("");
const categoryFilter = ref("");
const timeFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(6);
const hasMoreArticles = ref(true);
const loading = ref(false);
const totalArticles = ref(0);

// 文章数据
const allArticles = ref<Article[]>([]);

// 添加弹窗状态管理
const detailVisible = ref(false);
const selectedArticle = ref<Article | null>(null);

// 计算筛选后的文章
const filteredArticles = computed(() => {
  return allArticles.value;
});

// 处理搜索
async function handleSearch() {
  console.log("执行搜索:", searchQuery.value);
  await loadArticles(true);
}

// 应用筛选
async function applyFilters() {
  console.log("应用筛选条件:", {
    搜索: searchQuery.value,
    分类: categoryFilter.value,
    时间: timeFilter.value,
  });

  await loadArticles(true);
}

// 获取分类标签颜色
function getCategoryClass(category: string): string {
  if (category.includes("装备")) return "equipment";
  if (category.includes("安全")) return "safety";
  if (category.includes("技巧")) return "skills";
  if (category.includes("目的地")) return "destination";
  return "default";
}

// 打开文章详情弹窗
function openArticleDetail(article: Article) {
  selectedArticle.value = article;
  detailVisible.value = true;
}

// 查看文章详情
async function viewArticleDetail(id: number) {
  try {
    loading.value = true;
    const response = await ArticlesService.getArticleById(id);
    // 直接使用response，它已经是文章对象了
    const article = response;

    if (article) {
      openArticleDetail(article);
    } else {
      Message.error("未找到文章详情");
    }
  } catch (error) {
    console.error("获取文章详情失败:", error);
    Message.error("获取文章详情失败");
  } finally {
    loading.value = false;
  }
}

// 加载更多文章
async function loadMoreArticles() {
  currentPage.value++;
  await loadArticles(false);
}

// 加载文章数据
async function loadArticles(reset: boolean = false) {
  try {
    loading.value = true;

    if (reset) {
      currentPage.value = 1;
    }

    // 计算偏移量
    const offset = (currentPage.value - 1) * pageSize.value;

    // 构建筛选条件
    const filters: ArticleFilter = {};
    if (categoryFilter.value) {
      filters.category = categoryFilter.value;
    }
    if (timeFilter.value) {
      filters.timeFilter = timeFilter.value as any;
    }
    if (searchQuery.value) {
      filters.searchQuery = searchQuery.value;
    }

    // 获取文章数据
    const response = await ArticlesService.getArticles(
      pageSize.value,
      offset,
      filters
    );
    // 直接使用response，它已经是文章数组了
    const articles = response;

    if (reset) {
      allArticles.value = articles;
    } else {
      allArticles.value = [...allArticles.value, ...articles];
    }

    // 更新是否有更多文章
    hasMoreArticles.value = articles.length === pageSize.value;

    if (articles.length === 0 && currentPage.value === 1) {
      Message.info("没有符合条件的文章，请尝试其他筛选条件");
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
    Message.error("获取文章列表失败");
  } finally {
    loading.value = false;
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

onMounted(async () => {
  // 加载文章数据
  await loadArticles();
});
</script>

<style scoped>
.articles-header {
  padding: 40px 0;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d2129;
}

.page-desc {
  font-size: 16px;
  color: #4e5969;
  max-width: 700px;
  margin: 0 auto;
}

.filter-section {
  margin-bottom: 20px;
}

.articles-container {
  margin-top: 20px;
  margin-bottom: 60px;
}

.article-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.article-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.article-category {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.equipment {
  background-color: #3dd2b4;
}

.safety {
  background-color: #f4664a;
}

.skills {
  background-color: #7265e3;
}

.destination {
  background-color: #4080ff;
}

.default {
  background-color: #86909c;
}

.article-summary {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  color: #86909c;
  font-size: 12px;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  border-top: 1px solid #f2f3f5;
  padding-top: 16px;
}

.article-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4e5969;
}

.load-more {
  text-align: center;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .filter-section :deep(.arco-col) {
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-desc {
    font-size: 14px;
  }
}

/* 添加弹窗样式 */
.article-detail-modal {
  padding: 0;
}

.article-detail-image {
  height: 280px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 8px;
  margin-bottom: 20px;
}

.article-detail-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 8px;
  gap: 4px;
}

.article-content {
  line-height: 1.8;
  color: #4e5969;
  text-align: justify;
  margin-bottom: 20px;
  white-space: pre-line;
}
</style> 