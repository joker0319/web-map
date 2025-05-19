<template>
  <DefaultLayout>
    <div class="forum-container">
      <!-- 页面标题 -->
      <div class="forum-header">
        <div class="title-area">
          <h1 class="page-title">徒步交流论坛</h1>
          <p class="page-desc">
            分享您的徒步经验、路线推荐、装备心得，与其他户外爱好者交流讨论
          </p>
        </div>
        <div class="action-area">
          <a-button type="primary" size="large" @click="showPostModal">
            <template #icon><icon-edit /></template>
            发布新帖子
          </a-button>
        </div>
      </div>

      <!-- 筛选和搜索 -->
      <div class="filter-section">
        <a-row :gutter="[16, 16]" align="center">
          <a-col :span="12">
            <a-input-search
              placeholder="搜索帖子标题、内容或用户"
              allow-clear
              v-model="searchQuery"
              @search="handleSearch"
            />
          </a-col>
          <a-col :span="12" style="text-align: right">
            <a-radio-group
              type="button"
              v-model="sortType"
              @change="filterPosts"
            >
              <a-radio value="latest">最新发布</a-radio>
              <a-radio value="hottest">最热帖子</a-radio>
            </a-radio-group>
          </a-col>
        </a-row>
      </div>

      <!-- 帖子列表 -->
      <a-divider style="margin: 16px 0" />

      <div class="posts-container">
        <a-spin :loading="loading" style="width: 100%">
          <a-row :gutter="[24, 24]">
            <a-col :span="8" v-for="post in filteredPosts" :key="post.id">
              <a-card
                class="post-card"
                hoverable
                @click="viewPostDetail(post.id)"
              >
                <template #cover>
                  <div class="post-image-container">
                    <!-- 条件渲染：优先尝试Unsplash图片，失败时显示背景图 -->
                    <template v-if="post.images && post.images.length">
                      <img
                        :src="getUnsplashImageUrl(post)"
                        class="post-image-direct"
                        @error="handleImageError($event, post.id)"
                        alt="帖子图片"
                        data-error-handled="false"
                      />
                    </template>
                    <div
                      v-else
                      class="post-image"
                      :style="{
                        backgroundImage: getPostImageUrl(post),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }"
                    ></div>
                    <div class="post-badge" :class="getBadgeClass(post)">
                      {{ getBadgeText(post) }}
                    </div>
                  </div>
                </template>

                <a-card-meta :title="post.title">
                  <template #description>
                    <div class="post-info">
                      <div class="author-info">
                        <a-avatar :size="24" :image-url="post.author.avatar" />
                        <span class="author-name">{{ post.author.name }}</span>
                      </div>
                      <div class="post-time">
                        {{ formatDate(post.createdAt) }}
                      </div>
                    </div>
                    <p class="post-summary">{{ post.summary }}</p>
                    <div class="post-meta">
                      <div class="post-stats">
                        <span class="stat-item">
                          <icon-message class="icon" />
                          {{ post.comments }}
                        </span>
                        <span class="stat-item">
                          <icon-thumb-up
                            class="icon"
                            :style="{ color: post.isLiked ? '#165DFF' : '' }"
                          />
                          {{ post.likes }}
                        </span>
                      </div>
                    </div>
                  </template>
                </a-card-meta>

                <div class="post-footer">
                  <div class="post-extra-info">
                    <div class="location" v-if="post.location">
                      <icon-location />
                      <span>{{ post.location }}</span>
                    </div>
                    <div class="tags" v-if="post.tags && post.tags.length">
                      <template v-for="(tag, index) in post.tags" :key="index">
                        <a-tag :color="getTagColor(tag)">{{ tag }}</a-tag>
                      </template>
                    </div>
                  </div>
                  <a-button
                    type="primary"
                    shape="round"
                    @click.stop="viewPostDetail(post.id)"
                  >
                    查看详情
                    <template #icon><icon-right /></template>
                  </a-button>
                </div>
              </a-card>
            </a-col>
          </a-row>

          <div
            class="empty-state"
            v-if="filteredPosts.length === 0 && !loading"
          >
            <a-empty description="没有找到符合条件的帖子" />
          </div>

          <!-- 加载更多 -->
          <div
            class="load-more"
            v-if="hasMorePosts && filteredPosts.length > 0"
          >
            <a-button type="text" @click="loadMorePosts" :loading="loadingMore">
              {{ loadingMore ? "加载中..." : "加载更多帖子" }}
              <template #icon><icon-down /></template>
            </a-button>
          </div>
        </a-spin>
      </div>
    </div>

    <!-- 发帖抽屉 -->
    <a-drawer
      v-model:visible="postModalVisible"
      width="700px"
      title="发布新帖子"
      :footer="true"
      :unmount-on-close="false"
      :mask-closable="false"
      placement="right"
    >
      <a-form :model="postForm" layout="vertical" auto-label-width>
        <a-form-item
          field="title"
          label="标题"
          :rules="[{ required: true, message: '请输入帖子标题' }]"
          :validate-trigger="['change', 'blur']"
        >
          <a-input
            v-model="postForm.title"
            placeholder="请输入帖子标题（简短有吸引力的标题更容易获得关注）"
            allow-clear
            :max-length="100"
            show-word-limit
          >
            <template #prefix>
              <icon-edit />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          field="content"
          label="内容"
          :rules="[{ required: true, message: '请输入帖子内容' }]"
          :validate-trigger="['change', 'blur']"
        >
          <a-textarea
            v-model="postForm.content"
            placeholder="分享您的徒步经验或问题..."
            allow-clear
            :max-length="5000"
            show-word-limit
            :auto-size="{ minRows: 8, maxRows: 12 }"
          />
        </a-form-item>

        <a-form-item field="images" label="上传图片">
          <a-upload
            list-type="picture-card"
            :multiple="true"
            :limit="9"
            v-model:file-list="uploadImages"
            :custom-request="handleUpload"
            @change="handleImagesChange"
            :draggable="true"
            action="#"
          >
            <template #upload-button>
              <div>
                <icon-plus />
                <div style="margin-top: 10px">上传图片</div>
              </div>
            </template>
            <template #upload-tip>
              <div style="font-size: 12px; color: #86909c; margin-top: 8px">
                支持JPG、PNG格式，每张不超过5MB
              </div>
            </template>
          </a-upload>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="location" label="位置(可选)">
              <a-input
                v-model="postForm.location"
                placeholder="输入相关地点位置"
                allow-clear
              >
                <template #prefix>
                  <icon-location />
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="tags" label="标签(可选)">
              <a-select
                v-model="postForm.tags"
                placeholder="选择标签"
                multiple
                allow-create
                allow-clear
                allow-search
              >
                <a-option value="装备">装备</a-option>
                <a-option value="路线">路线</a-option>
                <a-option value="技巧">技巧</a-option>
                <a-option value="风景">风景</a-option>
                <a-option value="安全">安全</a-option>
                <a-option value="问答">问答</a-option>
                <a-option value="摄影">摄影</a-option>
                <a-option value="心得">心得</a-option>
                <a-option value="攻略">攻略</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <div class="post-guidelines">
          <a-alert>
            <template #icon>
              <icon-info-circle />
            </template>
            <template #message>
              <div class="guidelines-title">发帖小贴士</div>
            </template>
            <template #description>
              <ul class="guidelines-list">
                <li>清晰的标题和详细的内容能够获得更多回复</li>
                <li>添加实际照片可以让您的帖子更有吸引力</li>
                <li>添加准确的位置信息有助于其他用户找到相关路线</li>
                <li>选择合适的标签可以让帖子被更多相关用户看到</li>
              </ul>
            </template>
          </a-alert>
        </div>
      </a-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <a-button @click="cancelPost">取消</a-button>
          <a-button
            type="primary"
            :disabled="!isFormValid"
            :loading="submitting"
            @click="submitPost"
          >
            发布帖子
          </a-button>
        </div>
      </template>
    </a-drawer>

    <!-- 帖子详情抽屉 -->
    <a-drawer
      v-model:visible="postDetailVisible"
      width="700px"
      title="帖子详情"
      :footer="true"
      :unmount-on-close="false"
      :mask-closable="true"
      placement="right"
    >
      <div v-if="detailPost" class="post-detail">
        <!-- 帖子标题 -->
        <h1 class="post-detail-title">{{ detailPost.title }}</h1>

        <!-- 作者信息 -->
        <div class="post-detail-meta">
          <div class="author-info">
            <a-avatar :size="40" :image-url="detailPost.author.avatar" />
            <div class="author-detail">
              <div class="author-name">{{ detailPost.author.name }}</div>
              <div class="post-time">
                {{ formatDate(detailPost.createdAt) }}
              </div>
            </div>
          </div>

          <div v-if="detailPost.location" class="post-location">
            <icon-location />
            <span>{{ detailPost.location }}</span>
          </div>
        </div>

        <!-- 标签 -->
        <div class="post-tags" v-if="detailPost.tags && detailPost.tags.length">
          <a-tag
            v-for="(tag, index) in detailPost.tags"
            :key="index"
            :color="getTagColor(tag)"
          >
            {{ tag }}
          </a-tag>
        </div>

        <!-- 内容 -->
        <div class="post-detail-content">
          {{ detailPost.content }}
        </div>

        <!-- 图片 -->
        <div
          class="post-detail-images"
          v-if="detailPost.images && detailPost.images.length"
        >
          <a-image-preview-group infinite>
            <a-row :gutter="[16, 16]">
              <a-col
                :span="8"
                v-for="(image, index) in detailPost.images"
                :key="index"
              >
                <a-image :src="image" width="100%" :preview-visible="false" />
              </a-col>
            </a-row>
          </a-image-preview-group>
        </div>

        <!-- 评论区 -->
        <div class="post-detail-comments">
          <h3 class="comments-title">
            评论 ({{ detailPost.comments || 0 }})
            <a-divider style="margin: 16px 0" />
          </h3>

          <!-- 添加评论输入框 -->
          <div class="comment-input-area">
            <a-textarea
              v-model="newDetailComment"
              placeholder="写下你的评论..."
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
            <div class="comment-input-actions">
              <a-button type="primary" @click="submitDetailComment">
                <template #icon><icon-send /></template>
                发表评论
              </a-button>
            </div>
          </div>

          <a-spin :loading="postCommentsLoading">
            <div v-if="postComments.length === 0" class="empty-comments">
              <a-empty>
                <template #description>
                  <div class="empty-text">
                    <p>暂无评论</p>
                    <p class="empty-tip">成为第一个评论这篇帖子的人吧</p>
                  </div>
                </template>
                <template #image>
                  <icon-message style="font-size: 48px; color: #c9cdd4" />
                </template>
              </a-empty>
            </div>

            <div v-else class="comments-list">
              <div
                v-for="comment in postComments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-main">
                  <a-avatar :size="32" :image-url="comment.author.avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{
                        comment.author.name
                      }}</span>
                      <span class="comment-time">{{
                        formatDate(comment.createdAt)
                      }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </a-spin>
        </div>
      </div>

      <div v-else class="loading-placeholder">
        <a-spin />
        <p>加载中...</p>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; gap: 12px">
          <div class="drawer-footer-left">
            <a-button @click="openInNewTab" type="text">
              <template #icon>
                <icon-link />
              </template>
              在新标签页打开
            </a-button>
          </div>
          <div class="drawer-footer-right">
            <a-button @click="closePostDetail">关闭</a-button>
            <a-button
              type="primary"
              :disabled="!detailPost"
              :loading="likingPost"
              @click="togglePostLike"
            >
              <template #icon>
                <icon-thumb-up />
              </template>
              {{ detailPost?.isLiked ? "已点赞" : "点赞" }} ({{
                detailPost?.likes || 0
              }})
            </a-button>
          </div>
        </div>
      </template>
    </a-drawer>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconEdit,
  IconMessage,
  IconThumbUp,
  IconRight,
  IconDown,
  IconPlus,
  IconLocation,
  IconInfoCircle,
  IconSend,
  IconLink,
} from "@arco-design/web-vue/es/icon";
import { forumService, type Post } from "@/services/forum.service";

const router = useRouter();

// 状态
const loading = ref(false);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const searchQuery = ref("");
const sortType = ref("latest");
const currentPage = ref(1);
const postModalVisible = ref(false);
const uploadImages = ref([]);
const submitting = ref(false);
const postDetailVisible = ref(false);
const detailPost = ref<Post | null>(null);
const currentDetailPostId = ref<number | null>(null);
const postComments = ref<any[]>([]);
const postCommentsLoading = ref(false);
const likingPost = ref(false);
// 初始化为空数组，等待从数据库加载数据
const posts = ref<Post[]>([]);

// 帖子表单
const postForm = reactive({
  title: "",
  content: "",
  images: [] as string[],
  location: "",
  tags: [] as string[],
});

// 表单验证
const isFormValid = computed(() => {
  return postForm.title && postForm.content;
});

// 添加Base64编码的默认图片
const DEFAULT_IMAGE_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB/8AAEQgAyADIAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+t6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Z";

// 在适当位置添加更多本地图片Base64数据
const DEFAULT_IMAGES = [
  DEFAULT_IMAGE_BASE64, // 已定义的默认图片
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...", // 可添加更多Base64图片
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
];

// 过滤后的帖子
const filteredPosts = computed(() => {
  let result = [...posts.value];

  // 应用搜索查询
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query)
    );
  }

  // 应用排序
  if (sortType.value === "hottest") {
    result.sort((a, b) => b.likes - a.likes);
  } else {
    // 最新发布
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return result;
});

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return "刚刚";
  }
};

// 获取帖子标签颜色
const getTagColor = (tag: string) => {
  const colors = {
    装备: "blue",
    路线: "green",
    技巧: "purple",
    风景: "cyan",
    安全: "red",
    攻略: "orange",
    新手: "arcoblue",
    问答: "gold",
    一日游: "lime",
    高海拔: "magenta",
    选购: "blue",
    心得: "purple",
    摄影: "cyan",
    分享: "arcoblue",
  };
  return (colors as any)[tag] || "gray";
};

// 获取徽章类名
const getBadgeClass = (post: any) => {
  if (post.hot) return "hot";
  if (post.comments > 30) return "popular";
  if (new Date(post.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)
    return "new";
  return "normal";
};

// 获取徽章文本
const getBadgeText = (post: any) => {
  if (post.hot) return "热门";
  if (post.comments > 30) return "热评";
  if (new Date(post.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)
    return "新帖";
  return "";
};

// 获取帖子图片URL
const getPostImageUrl = (post: any) => {
  try {
    // 检查图片是否存在
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      const firstImage = post.images[0];
      console.log(`尝试处理帖子ID ${post.id} 的图片:`, firstImage);

      // 优先使用帖子中的图片URL
      if (typeof firstImage === "string") {
        // 如果是完整URL，直接使用
        if (firstImage.startsWith("http")) {
          console.log(`使用完整URL图片: ${firstImage.substring(0, 50)}...`);
          return `url(${firstImage})`;
        }

        // 如果是base64图片，直接使用
        if (firstImage.startsWith("data:image")) {
          console.log(`使用base64图片`);
          return `url(${firstImage})`;
        }

        // 如果是相对路径，加上基础URL
        if (firstImage.startsWith("/")) {
          const baseUrl = window.location.origin;
          const fullUrl = `${baseUrl}${firstImage}`;
          console.log(`使用相对路径图片: ${fullUrl.substring(0, 50)}...`);
          return `url(${fullUrl})`;
        }

        // 其他情况尝试作为相对路径处理
        if (firstImage.length > 0) {
          const baseUrl = window.location.origin;
          const fullUrl = `${baseUrl}/${firstImage}`;
          console.log(`使用无斜杠相对路径图片: ${fullUrl.substring(0, 50)}...`);
          return `url(${fullUrl})`;
        }
      }
    }

    // 使用基于帖子ID的默认图片
    const defaultImage = getDefaultImageForPost(post);
    console.log(`使用默认图片: ${defaultImage.substring(0, 50)}...`);
    return `url('${defaultImage}')`;
  } catch (error) {
    console.error("图片URL处理错误:", error);
    return `url('${DEFAULT_IMAGE_BASE64}')`;
  }
};

// 获取默认图片URL
const getDefaultImageForPost = (post: any) => {
  // 使用帖子ID决定默认图片
  const postId = post.id ? Number(post.id) : 0;
  const imageIndex = postId % 8 || 1; // 确保ID从1-8循环

  const unsplashImages: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1470&auto=format&fit=crop",
    2: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    3: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop",
    4: "https://images.unsplash.com/photo-1465311530779-5241f5a29892?q=80&w=1470&auto=format&fit=crop",
    5: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop",
    6: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop",
    7: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    8: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop",
  };

  return unsplashImages[imageIndex] || DEFAULT_IMAGE_BASE64;
};

// 获取Unsplash图片URL（优先使用数据库图片，其次使用Unsplash）
const getUnsplashImageUrl = (post: any) => {
  try {
    // 优先使用帖子中的图片
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      const firstImage = post.images[0];
      console.log(`帖子ID ${post.id} 的图片URL:`, firstImage);

      // 如果是完整URL，直接使用
      if (typeof firstImage === "string" && firstImage.startsWith("http")) {
        return firstImage;
      }

      // 如果是base64图片，直接使用
      if (
        typeof firstImage === "string" &&
        firstImage.startsWith("data:image")
      ) {
        return firstImage;
      }

      // 如果是相对路径
      if (typeof firstImage === "string" && firstImage.length > 0) {
        const baseUrl = window.location.origin;
        let imageUrl = "";

        // 尝试不同的URL格式，按可能性排序
        if (firstImage.startsWith("/uploads/")) {
          // 标准路径: /uploads/forum/xxx.jpg
          imageUrl = `${baseUrl}${firstImage}`;
        } else if (firstImage.startsWith("/api/uploads/")) {
          // API路径: /api/uploads/forum/xxx.jpg
          imageUrl = `${baseUrl}${firstImage}`;
        } else if (firstImage.startsWith("uploads/")) {
          // 无前导斜杠: uploads/forum/xxx.jpg
          imageUrl = `${baseUrl}/${firstImage}`;
        } else if (firstImage.includes("/")) {
          // 包含斜杠的其他路径
          imageUrl = `${baseUrl}/${
            firstImage.startsWith("/") ? firstImage.substring(1) : firstImage
          }`;
        } else {
          // 仅文件名
          imageUrl = `${baseUrl}/uploads/forum/${firstImage}`;
        }

        console.log(`使用图片URL: ${imageUrl}`);
        return imageUrl;
      }
    }

    // 回退到基于ID的默认图片
    return getDefaultImageForPost(post);
  } catch (error) {
    console.error(`获取图片URL出错 (帖子ID: ${post.id}):`, error);
    return getDefaultImageForPost(post);
  }
};

// 处理搜索
const handleSearch = async () => {
  try {
    loading.value = true;
    if (searchQuery.value) {
      const results = await forumService.searchPosts(
        searchQuery.value,
        sortType.value
      );
      posts.value = results;
    } else {
      await loadPosts();
    }
  } catch (error) {
    console.error("搜索失败:", error);
    Message.error("搜索失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 过滤帖子
const filterPosts = async () => {
  try {
    loading.value = true;
    await loadPosts();
  } catch (error) {
    console.error("过滤失败:", error);
    Message.error("获取数据失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载帖子数据 - 从数据库获取
const loadPosts = async () => {
  try {
    loading.value = true;
    console.log(`加载第${currentPage.value}页帖子，排序方式:${sortType.value}`);

    const data = await forumService.getPosts(currentPage.value, sortType.value);

    // 处理数据格式兼容性
    const formattedData = data.map((post) => {
      // 处理标签字符串转数组
      if (typeof post.tags === "string") {
        post.tags = post.tags.split(",").filter((tag) => tag.trim() !== "");
      }

      // 确保作者信息格式正确
      if (!post.author) {
        post.author = {
          id: 0,
          name: "未知用户",
          avatar: DEFAULT_IMAGE_BASE64,
        };
      }

      // 处理作者名称字段不一致
      if (!post.author.name && (post.author as any).user_name) {
        post.author.name = (post.author as any).user_name;
      }

      // 确保图片字段存在
      if (
        !post.images ||
        !Array.isArray(post.images) ||
        post.images.length === 0
      ) {
        post.images = [DEFAULT_IMAGE_BASE64];
      }

      // 确保isLiked字段存在
      if (post.isLiked === undefined) {
        post.isLiked = false;
      }

      return post;
    });

    posts.value = formattedData;
    hasMorePosts.value = data.length >= 10; // 假设每页10条数据

    console.log(`成功加载${data.length}条帖子`);
  } catch (error) {
    console.error("加载帖子失败:", error);
    Message.error("加载帖子失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载更多帖子
const loadMorePosts = async () => {
  try {
    loadingMore.value = true;
    currentPage.value += 1;

    const morePosts = await forumService.getPosts(
      currentPage.value,
      sortType.value
    );

    // 处理数据格式兼容性与loadPosts函数相同
    const formattedMorePosts = morePosts.map((post) => {
      // 处理标签
      if (typeof post.tags === "string") {
        post.tags = post.tags.split(",").filter((tag) => tag.trim() !== "");
      }

      // 作者信息
      if (!post.author) {
        post.author = {
          id: 0,
          name: "未知用户",
          avatar: DEFAULT_IMAGE_BASE64,
        };
      }

      if (!post.author.name && (post.author as any).user_name) {
        post.author.name = (post.author as any).user_name;
      }

      // 图片
      if (
        !post.images ||
        !Array.isArray(post.images) ||
        post.images.length === 0
      ) {
        post.images = [DEFAULT_IMAGE_BASE64];
      }

      // isLiked字段
      if (post.isLiked === undefined) {
        post.isLiked = false;
      }

      return post;
    });

    if (formattedMorePosts.length > 0) {
      posts.value = [...posts.value, ...formattedMorePosts];
      hasMorePosts.value = formattedMorePosts.length >= 10;
    } else {
      hasMorePosts.value = false;
    }
  } catch (error) {
    console.error("加载更多帖子失败:", error);
    Message.error("加载更多帖子失败，请稍后重试");
  } finally {
    loadingMore.value = false;
  }
};

// 查看帖子详情
const viewPostDetail = async (postId: number) => {
  try {
    console.log(`准备查看帖子详情，帖子ID: ${postId}`);
    loading.value = true;
    currentDetailPostId.value = postId;

    // 获取帖子详情
    console.log(`正在调用forumService.getPostDetail(${postId})`);
    const result = await forumService.getPostDetail(postId);
    console.log(`获取帖子详情结果:`, result);

    if (result) {
      console.log(`帖子详情获取成功，准备显示抽屉`);
      detailPost.value = result;

      // 确保帖子数据结构完整
      if (!Array.isArray(detailPost.value.images)) {
        console.log(`修正帖子图片数组，当前值:`, detailPost.value.images);
        detailPost.value.images = [];
      }

      if (!Array.isArray(detailPost.value.tags)) {
        console.log(`修正帖子标签数组，当前值:`, detailPost.value.tags);
        detailPost.value.tags = [];
      }

      if (detailPost.value.isLiked === undefined) {
        console.log(`修正帖子isLiked字段，设为默认值false`);
        detailPost.value.isLiked = false;
      }

      // 获取帖子评论
      console.log(`准备加载帖子评论`);
      await loadPostComments(postId);
      // 显示Modal
      postDetailVisible.value = true;
    } else {
      console.error(`获取帖子详情失败，forumService返回null`);
      Message.error("获取帖子详情失败");
    }
  } catch (error) {
    console.error("获取帖子详情失败，发生异常:", error);
    Message.error("获取帖子详情失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载评论
const loadPostComments = async (postId: number) => {
  try {
    console.log(`准备加载帖子评论，帖子ID: ${postId}`);
    postCommentsLoading.value = true;

    const result = await forumService.getComments(postId);
    console.log(`获取到评论数据:`, result);

    // 处理评论数据
    if (Array.isArray(result)) {
      console.log(`共获取到 ${result.length} 条评论`);
      postComments.value = result;
    } else {
      console.warn(`获取到的评论数据不是数组，而是:`, typeof result);
      postComments.value = [];
    }
  } catch (error) {
    console.error("获取评论失败，发生异常:", error);
    postComments.value = [];
  } finally {
    postCommentsLoading.value = false;
  }
};

// 显示发帖模态框
const showPostModal = () => {
  postModalVisible.value = true;
};

// 提交帖子
const submitPost = async () => {
  if (!isFormValid.value) return;

  try {
    submitting.value = true;
    Message.loading({ content: "正在发布帖子...", duration: 0 });

    // 检查上传组件状态
    console.log("===== 提交前检查图片状态 =====");
    console.log("上传组件状态:", uploadImages.value);

    // 获取已上传的图片URL
    let images: string[] = [];

    // 安全地处理上传图片
    if (Array.isArray(uploadImages.value)) {
      console.log("上传组件详情:");
      uploadImages.value.forEach((item, index) => {
        console.log(`图片 #${index}:`, {
          hasItem: !!item,
          type: typeof item,
          hasResponse: item?.response !== undefined,
          hasUrl: item?.url !== undefined,
          response: item?.response,
          url: item?.url,
        });
      });

      images = uploadImages.value
        .filter((item) => item && (item.response || item.url))
        .map((item) => {
          // 详细日志
          let sourceUrl = null;
          if (item.response) {
            sourceUrl = item.response;
            console.log(`从response获取URL: ${sourceUrl}`);
          } else if (item.url) {
            sourceUrl = item.url;
            console.log(`从url获取URL: ${sourceUrl}`);
          }
          return sourceUrl || "";
        })
        .filter((url) => url !== "");
    }

    console.log("准备上传的图片列表:", images);

    // 准备发送到后端的数据
    const postData = {
      title: postForm.title,
      content: postForm.content,
      location: postForm.location || "",
      tags: Array.isArray(postForm.tags) ? postForm.tags : [],
      images: images,
    };

    // 检查标签格式
    if (typeof postData.tags === "string") {
      postData.tags = postData.tags
        .split(",")
        .filter((tag) => tag.trim() !== "");
    }

    console.log("准备发送到后端的数据:", postData);
    console.log("认证状态检查:", {
      authToken: localStorage.getItem("auth_token"),
      tokenExists: !!localStorage.getItem("auth_token"),
    });

    // 调用后端API创建帖子
    const createdPost = await forumService.createPost(postData);

    console.log("调用API结果:", createdPost ? "成功" : "失败");

    if (createdPost) {
      console.log("后端创建帖子成功:", createdPost);

      // 将新帖子添加到列表前端
      posts.value = [createdPost, ...posts.value];

      // 重置表单
      postForm.title = "";
      postForm.content = "";
      postForm.images = [];
      postForm.location = "";
      postForm.tags = [];
      uploadImages.value = [];

      // 关闭模态框
      postModalVisible.value = false;

      Message.clear();
      Message.success("发布成功");
    } else {
      // 如果API调用失败，回退到本地模式
      console.warn("API调用失败，使用本地模式");

      // 创建本地帖子数据
      const newPost = {
        id: Date.now(), // 临时ID
        title: postForm.title,
        content: postForm.content,
        summary: postForm.content.substring(0, 100) + "...",
        createdAt: new Date().toISOString(),
        author: {
          id: 1,
          name: localStorage.getItem("user_name") || "当前用户",
          avatar: localStorage.getItem("user_avatar") || DEFAULT_IMAGE_BASE64,
        },
        location: postForm.location || "",
        tags: Array.isArray(postForm.tags) ? [...postForm.tags] : [],
        images: images.length > 0 ? images : [DEFAULT_IMAGE_BASE64],
        likes: 0,
        comments: 0,
        isLiked: false,
      };

      // 将新帖子添加到列表前端
      posts.value = [newPost, ...posts.value];

      // 重置表单
      postForm.title = "";
      postForm.content = "";
      postForm.images = [];
      postForm.location = "";
      postForm.tags = [];
      uploadImages.value = [];

      // 关闭模态框
      postModalVisible.value = false;

      Message.clear();
      Message.success("发布成功（本地模式）");
    }
  } catch (error) {
    console.error("发布帖子失败:", error);
    Message.clear();
    Message.error("发布失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
};

// 取消发帖
const cancelPost = () => {
  // 重置表单
  postForm.title = "";
  postForm.content = "";
  postForm.images = [];
  postForm.location = "";
  postForm.tags = [];
  uploadImages.value = [];

  postModalVisible.value = false;
};

// 处理图片上传
const handleUpload = async (options: any) => {
  try {
    console.log("===== 开始处理图片上传 =====");
    console.log("上传选项:", options);

    // 检查参数格式
    if (!options) {
      console.error("上传参数为空");
      if (typeof options?.onError === "function") {
        options.onError(new Error("上传参数错误"));
      }
      return;
    }

    // 调试输出完整选项对象结构
    console.log("上传选项详细结构:", JSON.stringify(options, null, 2));

    // ArcoDesign的上传组件可能将文件包装在fileItem中
    let file = options.file;

    // 如果没有直接的file属性，检查是否有fileItem属性
    if (!file) {
      // 检查fileItem结构
      if (options.fileItem) {
        if (options.fileItem.file) {
          file = options.fileItem.file;
          console.log("从fileItem.file中获取文件:", file.name);
        } else if (options.fileItem.originFile) {
          file = options.fileItem.originFile;
          console.log("从fileItem.originFile中获取文件:", file.name);
        }
      }

      // 如果options本身就是文件对象
      if (!file && options.name && options.type && options.size) {
        file = options;
        console.log("使用options本身作为文件对象:", file.name);
      }
    }

    const { onSuccess, onError } = options;

    // 检查file对象
    if (!file) {
      console.error("文件对象为空 - 检查上传参数结构:", options);
      if (typeof onError === "function") {
        onError(new Error("文件对象为空"));
      } else {
        Message.error("上传文件不能为空");
      }
      return;
    }

    console.log("文件信息:", {
      name: file.name || "未知文件名",
      size: (file.size || 0) + " bytes",
      type: file.type || "未知类型",
    });

    if (!file.type || !file.type.startsWith("image/")) {
      console.error("上传的不是图片文件:", file.type);
      Message.error("只能上传图片文件");
      if (typeof onError === "function") {
        onError(new Error("仅支持图片文件"));
      }
      return;
    }

    // 检查用户登录状态
    if (!localStorage.getItem("auth_token")) {
      console.error("用户未登录，无法上传图片");
      Message.error("请先登录后再上传图片");
      if (typeof onError === "function") {
        onError(new Error("用户未登录"));
      }
      return;
    }

    // 尝试使用后端API上传图片
    console.log("调用上传API");
    Message.loading({ content: "图片上传中...", duration: 0 });

    const imageUrl = await forumService.uploadImage(file);

    Message.clear();

    if (imageUrl) {
      // 后端上传成功
      console.log("上传成功，图片URL:", imageUrl);
      if (typeof onSuccess === "function") {
        onSuccess(imageUrl);
      }
      Message.success("图片上传成功");
    } else {
      // 后端上传失败，使用本地模式
      console.warn("后端图片上传失败，使用本地模式");
      Message.warning("服务器上传失败，使用本地模式");

      // 模拟上传
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟上传成功，返回Base64图片
      if (typeof onSuccess === "function") {
        onSuccess(DEFAULT_IMAGE_BASE64);
      }
    }
    console.log("===== 图片上传处理完成 =====");
  } catch (err: any) {
    console.error("上传图片失败:", err);
    Message.clear();
    Message.error(`上传失败: ${err.message || "未知错误"}`);
    if (options && typeof options.onError === "function") {
      options.onError(err);
    }
  }
};

// 处理图片变化
const handleImagesChange = (fileList: any[]) => {
  console.log("图片列表变化:", fileList);

  // 确保安全访问
  if (!Array.isArray(fileList)) {
    console.warn("文件列表不是数组:", fileList);
    postForm.images = [];
    return;
  }

  // 从文件列表中提取URL
  postForm.images = fileList
    .map((file: any) => {
      if (!file) return "";

      // 如果有response属性(已上传成功)，返回response
      if (file.response) return file.response;

      // 如果有url属性，返回url
      if (file.url) return file.url;

      // 否则返回空字符串
      return "";
    })
    .filter((url) => url !== "");

  console.log("处理后的图片URLs:", postForm.images);
};

// 处理图片加载错误 - 防止无限循环
const handleImageError = (event: Event, postId: number) => {
  const target = event.target as HTMLImageElement;

  // 防止循环重试
  if (target.dataset.errorHandled === "true") {
    return;
  }

  console.log(`图片加载失败，帖子ID: ${postId}，图片URL: ${target.src}`);

  // 标记已处理过错误
  target.dataset.errorHandled = "true";

  // 分析失败的URL格式
  const failedUrl = target.src;

  // 如果是相对路径可能存在服务端静态文件配置问题，尝试不同的路径格式
  if (failedUrl.includes("/uploads/forum/")) {
    const fileName = failedUrl.split("/").pop();
    console.log(`尝试使用不同路径格式加载图片: ${fileName}`);

    // 从全局变量中获取基础URL（如果有）
    const baseApiUrl = window.location.origin;

    // 尝试使用其他格式的URL
    if (!failedUrl.includes(baseApiUrl) && fileName) {
      // 尝试带基础URL的路径
      const newUrl = `${baseApiUrl}/api/uploads/forum/${fileName}`;
      console.log(`尝试新的URL: ${newUrl}`);
      target.src = newUrl;
      return;
    }
  }

  // 如果仍然加载失败，根据帖子ID使用对应的Unsplash图片
  const unsplashImages: Record<string, string> = {
    "1": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1470&auto=format&fit=crop",
    "2": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    "3": "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop",
    "4": "https://images.unsplash.com/photo-1465311530779-5241f5a29892?q=80&w=1470&auto=format&fit=crop",
    "5": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop",
    "6": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop",
    "7": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop",
    "8": "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop",
  };

  // 使用帖子ID的模数来选择Unsplash图片
  const imageIndex = postId % 8 || 1; // 确保ID从1-8循环
  target.src = unsplashImages[String(imageIndex)] || DEFAULT_IMAGE_BASE64;
  console.log(`已替换为Unsplash图片 index: ${imageIndex}`);
};

// 关闭详情Modal
const closePostDetail = () => {
  postDetailVisible.value = false;
};

// 点赞帖子
const togglePostLike = async () => {
  if (!detailPost.value) return;

  try {
    likingPost.value = true;
    const result = await forumService.toggleLike(detailPost.value.id);
    if (result) {
      detailPost.value.isLiked = result.isLiked;
      detailPost.value.likes = result.likes;

      // 同时更新列表中的点赞数据
      const postIndex = posts.value.findIndex(
        (p) => p.id === detailPost.value?.id
      );
      if (postIndex !== -1) {
        posts.value[postIndex].isLiked = result.isLiked;
        posts.value[postIndex].likes = result.likes;
      }
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
    Message.error("点赞失败，请稍后重试");
  } finally {
    likingPost.value = false;
  }
};

// 新增评论相关状态
const newDetailComment = ref("");

// 提交评论方法
const submitDetailComment = async () => {
  if (!newDetailComment.value.trim()) {
    Message.warning("评论内容不能为空");
    return;
  }

  try {
    console.log("提交评论:", newDetailComment.value);

    // 显示提交中的消息
    Message.loading("评论提交中...");

    // 检查后端API是否已实现
    const mockComment = {
      id: Date.now(),
      content: newDetailComment.value,
      createdAt: new Date().toISOString(),
      author: {
        id: 1,
        name: localStorage.getItem("user_name") || "当前用户",
        avatar: localStorage.getItem("user_avatar") || DEFAULT_IMAGE_BASE64,
      },
    };

    // 尝试调用后端API
    try {
      if (detailPost.value) {
        const result = await forumService.addComment(
          detailPost.value.id,
          newDetailComment.value
        );

        // 如果API调用成功，使用返回的评论
        if (result) {
          postComments.value.unshift(result);
          // 更新评论计数
          if (detailPost.value) {
            detailPost.value.comments = (detailPost.value.comments || 0) + 1;
          }

          // 清空输入框
          newDetailComment.value = "";
          Message.success("评论发布成功");
          return;
        }
      }
    } catch (error) {
      console.error("评论API调用失败:", error);
    }

    // 如果API调用失败，使用本地模拟数据
    postComments.value.unshift(mockComment);

    // 更新评论计数
    if (detailPost.value) {
      detailPost.value.comments = (detailPost.value.comments || 0) + 1;
    }

    // 清空输入框
    newDetailComment.value = "";
    Message.success("评论发布成功(本地模式)");
  } catch (error) {
    console.error("提交评论失败:", error);
    Message.error("评论提交失败，请稍后重试");
  }
};

// 在新标签页打开详情
const openInNewTab = () => {
  if (!detailPost.value) return;
  const postId = detailPost.value.id;
  window.open(`/forum/post/${postId}`, "_blank");
};

// 初始化
onMounted(() => {
  // 从后端加载真实数据
  loadPosts();

  const userData = localStorage.getItem("user_data");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log("用户权限检查:", {
        用户ID: user.id,
        是否管理员: user.isAdmin || user.is_admin,
        用户名: user.username,
      });
    } catch (e) {
      console.error("解析用户数据失败:", e);
    }
  }
});

// 定时刷新帖子列表
const refreshInterval = setInterval(() => {
  if (!postModalVisible.value) {
    // 不在编辑状态时刷新
    loadPosts();
  }
}, 60000); // 每分钟刷新一次

// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped>
.forum-container {
  padding: 20px 0;
  max-width: 1400px;
  margin: 0 auto;
}

.forum-header {
  padding: 40px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-area {
  margin-bottom: 20px;
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

.posts-container {
  margin-top: 20px;
  margin-bottom: 60px;
}

.post-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.post-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.post-image-direct {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-image-direct:hover {
  transform: scale(1.05);
}

.post-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.hot {
  background-color: #f53f3f;
}

.popular {
  background-color: #f59b42;
}

.new {
  background-color: #3dd2b4;
}

.normal {
  display: none;
}

.post-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  margin-top: 4px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 14px;
  color: #1d2129;
}

.post-time {
  font-size: 12px;
  color: #86909c;
}

.post-summary {
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

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #86909c;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  border-top: 1px solid #f2f3f5;
  padding-top: 16px;
}

.post-extra-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #4e5969;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.load-more {
  text-align: center;
  margin-top: 40px;
}

/* 新添加的发帖弹窗相关样式 */
.post-guidelines {
  margin-top: 20px;
}

.guidelines-title {
  font-weight: 600;
  font-size: 14px;
}

.guidelines-list {
  padding-left: 20px;
  margin: 8px 0 0;
}

.guidelines-list li {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 4px;
  color: #4e5969;
}

:deep(.arco-upload-list-item) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.arco-form-item-label-col) {
  font-weight: 500;
}

:deep(.arco-textarea-wrapper) {
  border-radius: 8px;
}

:deep(.arco-input-wrapper) {
  border-radius: 8px;
}

:deep(.arco-alert) {
  border-radius: 8px;
}

/* 抽屉样式优化 */
:deep(.arco-drawer-header) {
  border-bottom: 1px solid #f2f3f5;
  padding: 16px 24px;
}

:deep(.arco-drawer-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

:deep(.arco-drawer-body) {
  padding: 24px;
}

:deep(.arco-drawer-footer) {
  border-top: 1px solid #f2f3f5;
  padding: 16px 24px;
}

:deep(.arco-drawer-mask) {
  backdrop-filter: blur(2px);
}

/* 添加一些入场动画 */
:deep(.arco-drawer-slide-enter-active),
:deep(.arco-drawer-slide-leave-active) {
  transition: all 0.4s cubic-bezier(0.34, 0.69, 0.1, 1);
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

/* 帖子详情样式 */
.post-detail {
  padding: 0 16px;
}

.post-detail-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
}

.post-detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.post-detail-meta .author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-detail-meta .author-detail {
  display: flex;
  flex-direction: column;
}

.post-detail-meta .author-name {
  font-weight: 500;
  color: #1d2129;
}

.post-detail-meta .post-time {
  font-size: 13px;
  color: #86909c;
}

.post-detail-meta .post-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4e5969;
  font-size: 14px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.post-detail-content {
  font-size: 16px;
  line-height: 1.8;
  color: #1d2129;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.post-detail-images {
  margin-bottom: 32px;
}

.post-detail-comments {
  margin-top: 32px;
}

.post-detail-comments {
  margin-top: 32px;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
}

.empty-comments {
  padding: 40px 0;
  text-align: center;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f2f3f5;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
  color: #1d2129;
}

.comment-time {
  font-size: 13px;
  color: #86909c;
}

.comment-text {
  margin: 0 0 12px;
  color: #4e5969;
  line-height: 1.6;
}

.comment-replies {
  margin-left: 44px;
  margin-top: 12px;
  padding: 12px;
  background-color: #f7f8fa;
  border-radius: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.reply-author {
  font-weight: 500;
  font-size: 13px;
  color: #1d2129;
}

.reply-time {
  font-size: 12px;
  color: #86909c;
}

.reply-text {
  margin: 0;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.5;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #86909c;
}

/* 抽屉样式优化 */
:deep(.arco-drawer-header) {
  border-bottom: 1px solid #f2f3f5;
  padding: 16px 24px;
}

:deep(.arco-drawer-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

:deep(.arco-drawer-body) {
  padding: 24px 0;
}

:deep(.arco-drawer-footer) {
  border-top: 1px solid #f2f3f5;
  padding: 16px 24px;
}

:deep(.arco-drawer-mask) {
  backdrop-filter: blur(2px);
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

  .post-detail-title {
    font-size: 20px;
  }

  .post-detail-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .post-detail-content {
    font-size: 15px;
  }
}

/* 添加新的样式 */
.empty-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-tip {
  color: #86909c;
  font-size: 13px;
  margin-top: 4px;
}

/* 添加评论输入框样式 */
.comment-input-area {
  margin-bottom: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #f7f8fa;
}

.comment-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style> 