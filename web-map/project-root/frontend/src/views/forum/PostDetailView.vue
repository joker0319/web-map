<template>
  <DefaultLayout>
    <div class="post-detail-container">
      <a-spin :loading="loading">
        <!-- 返回按钮 -->
        <div class="back-link">
          <a-button type="text" @click="goBack">
            <template #icon><icon-left /></template>
            返回论坛
          </a-button>
        </div>

        <!-- 帖子内容 -->
        <a-card v-if="post" class="post-card">
          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta">
            <div class="author-info">
              <a-avatar :size="36" :image-url="post.author.avatar" />
              <div class="author-detail">
                <div class="author-name">{{ post.author.name }}</div>
                <div class="post-time">{{ formatDate(post.createdAt) }}</div>
              </div>
            </div>

            <div class="post-location" v-if="post.location">
              <icon-location />
              <span>{{ post.location }}</span>
            </div>
          </div>

          <!-- 帖子内容 -->
          <div class="post-content">
            {{ post.content }}
          </div>

          <!-- 帖子图片 -->
          <div class="post-images" v-if="post.images && post.images.length">
            <a-image-preview-group infinite>
              <a-row :gutter="[16, 16]">
                <a-col
                  :span="8"
                  v-for="(image, index) in post.images"
                  :key="index"
                >
                  <a-image :src="image" width="100%" :preview-visible="false" />
                </a-col>
              </a-row>
            </a-image-preview-group>
          </div>

          <!-- 点赞和评论 -->
          <div class="post-actions">
            <a-button
              type="outline"
              shape="round"
              :status="post.isLiked ? 'success' : 'normal'"
              @click="debouncedToggleLike"
              :loading="likingPost"
              class="like-button"
              :class="{ liked: post.isLiked }"
            >
              <template #icon>
                <icon-thumb-up
                  :style="{ color: post.isLiked ? '#165DFF' : 'inherit' }"
                />
              </template>
              {{ post.isLiked ? "已点赞" : "点赞" }} ({{ post.likes || 0 }})
            </a-button>

            <a-button type="outline" shape="round" @click="scrollToComments">
              <template #icon>
                <icon-message />
              </template>
              评论 ({{ post.comments || 0 }})
            </a-button>
          </div>
        </a-card>

        <!-- 评论区 -->
        <div class="comments-section" id="comments-section" v-if="post">
          <h2 class="section-title">评论 ({{ post.comments }})</h2>

          <!-- 评论输入框 -->
          <div class="comment-input" v-if="userStore.isLoggedIn">
            <a-avatar :size="36" :image-url="userStore.user?.avatar" />
            <div class="input-container">
              <a-textarea
                v-model="newComment"
                placeholder="写下你的评论..."
                :auto-size="{ minRows: 2, maxRows: 5 }"
              />
              <div class="input-actions">
                <a-button
                  type="primary"
                  @click="addComment"
                  :disabled="!newComment.trim()"
                  :loading="submittingComment"
                >
                  发布评论
                </a-button>
              </div>
            </div>
          </div>

          <div class="login-to-comment" v-else>
            <a-button type="primary" @click="goToLogin">登录后评论</a-button>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <a-spin :loading="loadingComments">
              <!-- 评论列表 -->
              <div
                class="comment-item"
                v-for="comment in comments"
                :key="comment.id"
              >
                <div class="comment-main">
                  <a-avatar :size="36" :image-url="comment.author.avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{
                        comment.author.name
                      }}</span>
                      <span class="comment-time">{{
                        formatDate(comment.createdAt)
                      }}</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>

                    <div class="comment-actions">
                      <a-button
                        type="text"
                        size="small"
                        @click="showReplyInput(comment.id)"
                      >
                        <template #icon><icon-message /></template>
                        回复
                      </a-button>
                      <a-button
                        v-if="userStore.user?.id === comment.author.id"
                        type="text"
                        size="small"
                        @click="deleteComment(comment.id)"
                      >
                        <template #icon><icon-delete /></template>
                        删除
                      </a-button>
                    </div>

                    <!-- 回复输入框 -->
                    <div class="reply-input" v-if="replyingTo === comment.id">
                      <a-textarea
                        v-model="replyContent"
                        placeholder="回复评论..."
                        :auto-size="{ minRows: 2, maxRows: 3 }"
                      />
                      <div class="input-actions">
                        <a-button
                          type="primary"
                          size="small"
                          @click="addReply(comment.id)"
                          :disabled="!replyContent.trim()"
                          :loading="submittingReply"
                        >
                          发布回复
                        </a-button>
                        <a-button
                          type="outline"
                          size="small"
                          @click="cancelReply"
                        >
                          取消
                        </a-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 回复列表 -->
                <div
                  class="replies-list"
                  v-if="comment.replies && comment.replies.length > 0"
                >
                  <div
                    class="reply-item"
                    v-for="reply in comment.replies"
                    :key="reply.id"
                  >
                    <a-avatar :size="28" :image-url="reply.author.avatar" />
                    <div class="reply-content">
                      <div class="reply-header">
                        <span class="reply-author">{{
                          reply.author.name
                        }}</span>
                        <span class="reply-time">{{
                          formatDate(reply.createdAt)
                        }}</span>
                      </div>
                      <div class="reply-text">{{ reply.content }}</div>

                      <div class="reply-actions">
                        <a-button
                          type="text"
                          size="mini"
                          @click="showReplyInput(comment.id, reply.author.name)"
                        >
                          <template #icon><icon-message /></template>
                          回复
                        </a-button>
                        <a-button
                          v-if="userStore.user?.id === reply.author.id"
                          type="text"
                          size="mini"
                          @click="deleteComment(reply.id)"
                        >
                          <template #icon><icon-delete /></template>
                          删除
                        </a-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多 -->
              <div class="load-more" v-if="hasMoreComments">
                <a-button
                  type="text"
                  @click="loadMoreComments"
                  :loading="loadingMoreComments"
                >
                  加载更多评论
                </a-button>
              </div>
            </a-spin>
          </div>
        </div>
      </a-spin>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
  forumService,
  type Post,
  type Comment,
} from "../../services/forum.service";
import { useUserStore } from "../../stores/user.store";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconLeft,
  IconThumbUp,
  IconMessage,
  IconLocation,
  IconDelete,
} from "@arco-design/web-vue/es/icon";
import { debounce } from "../../utils/debounce";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 状态
const loading = ref(true);
const post = ref<Post | null>(null);
const comments = ref<Comment[]>([]);
const loadingComments = ref(false);
const loadingMoreComments = ref(false);
const hasMoreComments = ref(false);
const likingPost = ref(false);
const newComment = ref("");
const submittingComment = ref(false);
const replyingTo = ref<number | null>(null);
const replyContent = ref("");
const submittingReply = ref(false);
const commentPage = ref(1);

// 获取帖子ID
const postId = computed(() => Number(route.params.id));

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

// 返回论坛
const goBack = () => {
  router.push("/forum");
};

// 前往登录
const goToLogin = () => {
  router.push({ path: "/auth/login", query: { redirect: route.fullPath } });
};

// 滚动到评论区
const scrollToComments = () => {
  const commentsSection = document.getElementById("comments-section");
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: "smooth" });
  }
};

// 切换点赞状态
const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    Message.warning("请先登录后才能点赞");
    goToLogin();
    return;
  }

  if (!post.value || likingPost.value) return;

  try {
    // 预先更新UI状态，让用户立即看到反馈
    const oldIsLiked = post.value.isLiked;
    const oldLikesCount = post.value.likes;

    console.log(
      `点赞操作前状态 - postId: ${post.value.id}, 是否已点赞: ${oldIsLiked}, 点赞数: ${oldLikesCount}`
    );

    // 乐观更新UI，立即给用户反馈
    post.value.isLiked = !oldIsLiked;
    post.value.likes = oldIsLiked
      ? Math.max(0, oldLikesCount - 1)
      : oldLikesCount + 1;

    likingPost.value = true;

    // 发送API请求
    console.log(`发送点赞请求 - postId: ${post.value.id}`);
    const result = await forumService.toggleLike(post.value.id);
    console.log("点赞操作结果:", result);

    if (result && typeof result === "object") {
      // 使用服务器返回的实际状态更新UI
      console.log(
        `服务器返回数据 - 点赞数: ${result.likes}, 是否已点赞: ${result.isLiked}`
      );

      // 确保result.likes是数字
      const serverLikes =
        typeof result.likes === "number" ? result.likes : oldLikesCount;

      // 更新UI状态
      post.value.isLiked = !!result.isLiked; // 确保是布尔值
      post.value.likes = serverLikes;

      // 显示用户操作反馈
      if (post.value.isLiked) {
        Message.success("点赞成功");
      } else {
        Message.info("已取消点赞");
      }
    } else {
      console.error("点赞操作失败：服务器返回数据无效", result);
      // 请求失败或返回数据无效，回滚到之前的状态
      post.value.isLiked = oldIsLiked;
      post.value.likes = oldLikesCount;
      Message.error("点赞失败，请稍后重试");
    }
  } catch (error) {
    console.error("点赞操作出现异常:", error);

    // 异常情况下，回滚到原始状态
    if (post.value) {
      // 获取当前状态
      const currentIsLiked = post.value.isLiked;
      const currentLikes = post.value.likes;

      // 回滚状态
      post.value.isLiked = !currentIsLiked;
      post.value.likes = currentIsLiked
        ? Math.max(0, currentLikes - 1) // 如果当前是已点赞，回滚为未点赞
        : currentLikes + 1; // 如果当前是未点赞，回滚为已点赞

      Message.error("点赞失败，请稍后重试");
    }
  } finally {
    likingPost.value = false;
  }
};

// 使用防抖包装点赞函数
const debouncedToggleLike = debounce(toggleLike, 300);

// 加载帖子详情
const loadPostDetail = async () => {
  try {
    loading.value = true;
    console.log("正在获取帖子详情，ID:", postId.value);
    const result = await forumService.getPostDetail(postId.value);
    console.log("获取到帖子详情结果:", result);

    if (result) {
      post.value = result;
    } else {
      Message.error("帖子不存在或已删除");
      router.push("/forum");
    }
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    Message.error("获取帖子详情失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载评论
const loadComments = async (page = 1, size = 10) => {
  if (!post.value) return;

  try {
    if (page === 1) {
      loadingComments.value = true;
    } else {
      loadingMoreComments.value = true;
    }

    console.log("开始加载评论，帖子ID:", post.value.id);
    const result = await forumService.getComments(post.value.id);
    console.log("获取到评论数据:", result);

    if (page === 1) {
      comments.value = result;
    } else {
      comments.value = [...comments.value, ...result];
    }

    hasMoreComments.value = result.length === size;
    commentPage.value = page;
  } catch (error) {
    console.error("获取评论失败:", error);
    Message.error("获取评论失败，请稍后重试");
  } finally {
    loadingComments.value = false;
    loadingMoreComments.value = false;
  }
};

// 加载更多评论
const loadMoreComments = () => {
  loadComments(commentPage.value + 1);
};

// 添加评论
const addComment = async () => {
  if (!userStore.isLoggedIn) {
    Message.warning("请先登录");
    goToLogin();
    return;
  }

  if (!post.value || !newComment.value.trim() || submittingComment.value)
    return;

  try {
    submittingComment.value = true;
    console.log("正在添加评论:", newComment.value);
    const result = await forumService.addComment(
      post.value.id,
      newComment.value
    );
    console.log("添加评论结果:", result);

    if (result) {
      comments.value.unshift(result);
      newComment.value = "";

      // 更新帖子评论数
      if (post.value) {
        post.value.comments += 1;
      }

      Message.success("评论发布成功");
    }
  } catch (error) {
    console.error("发布评论失败:", error);
    Message.error("发布评论失败，请稍后重试");
  } finally {
    submittingComment.value = false;
  }
};

// 显示回复输入框
const showReplyInput = (commentId: number, replyToName?: string) => {
  if (!userStore.isLoggedIn) {
    Message.warning("请先登录");
    goToLogin();
    return;
  }

  replyingTo.value = commentId;
  replyContent.value = replyToName ? `回复 @${replyToName}：` : "";
};

// 取消回复
const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = "";
};

// 添加回复
const addReply = async (commentId: number) => {
  if (!userStore.isLoggedIn) {
    Message.warning("请先登录");
    goToLogin();
    return;
  }

  if (!post.value || !replyContent.value.trim() || submittingReply.value)
    return;

  try {
    submittingReply.value = true;
    console.log(`添加回复到评论 ${commentId}:`, replyContent.value);
    const result = await forumService.addComment(
      post.value.id,
      replyContent.value,
      commentId
    );
    console.log("添加回复结果:", result);

    if (result) {
      // 找到对应的评论并添加回复
      const commentIndex = comments.value.findIndex((c) => c.id === commentId);
      if (commentIndex !== -1) {
        if (!comments.value[commentIndex].replies) {
          comments.value[commentIndex].replies = [];
        }
        comments.value[commentIndex].replies!.push(result);
      }

      replyContent.value = "";
      replyingTo.value = null;

      // 更新帖子评论数
      if (post.value) {
        post.value.comments += 1;
      }

      Message.success("回复发布成功");
    } else {
      console.warn("回复添加失败，未能获取响应");
      Message.error("回复发布失败，请稍后重试");
    }
  } catch (error) {
    console.error("发布回复失败:", error);
    Message.error("发布回复失败，请稍后重试");
  } finally {
    submittingReply.value = false;
  }
};

// 删除评论
const deleteComment = async (commentId: number) => {
  if (!post.value) return;

  if (!window.confirm("确定要删除这条评论吗？")) {
    return;
  }

  try {
    console.log(`正在删除评论 ${commentId}`);
    const result = await forumService.deleteComment(post.value.id, commentId);
    console.log("删除评论结果:", result);

    if (result) {
      // 如果是顶级评论
      const commentIndex = comments.value.findIndex((c) => c.id === commentId);
      if (commentIndex !== -1) {
        // 获取被删除的评论及其回复的总数
        const deletedCount =
          1 + (comments.value[commentIndex].replies?.length || 0);
        comments.value.splice(commentIndex, 1);

        // 更新帖子评论数
        if (post.value) {
          post.value.comments -= deletedCount;
        }
      } else {
        // 如果是回复
        for (let i = 0; i < comments.value.length; i++) {
          const comment = comments.value[i];
          if (comment.replies) {
            const replyIndex = comment.replies.findIndex(
              (r) => r.id === commentId
            );
            if (replyIndex !== -1) {
              comment.replies.splice(replyIndex, 1);

              // 更新帖子评论数
              if (post.value) {
                post.value.comments -= 1;
              }

              break;
            }
          }
        }
      }

      Message.success("评论删除成功");
    } else {
      console.warn("评论删除失败，未能获取响应");
      Message.error("评论删除失败，请稍后重试");
    }
  } catch (error) {
    console.error("删除评论失败:", error);
    Message.error("删除评论失败，请稍后重试");
  }
};

onMounted(() => {
  loadPostDetail();
  loadComments();
});

watch(
  () => route.params.id,
  () => {
    loadPostDetail();
    loadComments();
  }
);
</script>

<style scoped>
.post-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.back-link {
  margin-bottom: 20px;
}

.post-card {
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.post-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1d2129;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-detail {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #1d2129;
}

.post-time {
  font-size: 14px;
  color: #86909c;
}

.post-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4e5969;
  font-size: 14px;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #1d2129;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.post-images {
  margin-bottom: 24px;
}

.post-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}

.comments-section {
  margin-top: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1d2129;
}

.comment-input {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
}

.input-container {
  flex: 1;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.login-to-comment {
  text-align: center;
  margin: 30px 0;
}

.comments-list {
  margin-top: 24px;
}

.comment-item {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e6eb;
}

.comment-main {
  display: flex;
  gap: 16px;
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
  font-weight: 600;
  color: #1d2129;
}

.comment-time {
  font-size: 13px;
  color: #86909c;
}

.comment-text {
  margin-bottom: 12px;
  color: #1d2129;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.reply-input {
  margin-top: 16px;
}

.replies-list {
  margin-top: 16px;
  margin-left: 52px;
}

.reply-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e5e6eb;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.reply-author {
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}

.reply-time {
  font-size: 12px;
  color: #86909c;
}

.reply-text {
  margin-bottom: 8px;
  color: #1d2129;
  font-size: 14px;
  white-space: pre-wrap;
}

.reply-actions {
  display: flex;
  gap: 12px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.like-button {
  transition: all 0.3s ease;
}

.like-button.liked {
  background-color: rgba(22, 93, 255, 0.1);
  border-color: #165dff;
  color: #165dff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .post-title {
    font-size: 22px;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .post-content {
    font-size: 15px;
  }

  .comment-input {
    flex-direction: column;
    gap: 12px;
  }
}
</style> 