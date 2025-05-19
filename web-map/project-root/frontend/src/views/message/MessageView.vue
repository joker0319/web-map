<template>
  <DefaultLayout>
    <div class="message-container">
      <!-- 页面标题 -->
      <div class="message-header">
        <div class="title-area">
          <h1 class="page-title">我的消息</h1>
          <p class="page-desc">您的帖子收到的所有点赞和评论通知</p>
        </div>
        <div class="action-area">
          <a-space>
            <a-button @click="markAllAsRead" :disabled="!hasUnread">
              <template #icon><icon-check /></template>
              全部标为已读
            </a-button>
            <a-dropdown @select="handleTypeChange">
              <a-button>
                {{ getTypeLabel(messageType) }}
                <template #icon><icon-down /></template>
              </a-button>
              <template #content>
                <a-doption value="all">全部消息</a-doption>
                <a-doption value="like">点赞通知</a-doption>
                <a-doption value="comment">评论通知</a-doption>
                <a-doption value="unread">未读消息</a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="message-content">
        <a-spin :loading="loading" style="width: 100%">
          <template v-if="filteredMessages.length > 0">
            <a-list :bordered="false" class="message-list">
              <a-list-item
                v-for="message in filteredMessages"
                :key="message.id"
                class="message-item"
                :class="{ unread: !message.isRead }"
              >
                <div class="message-dot" v-if="!message.isRead"></div>
                <div
                  class="message-wrapper"
                  @click="viewMessageDetail(message)"
                >
                  <div class="message-avatar">
                    <a-avatar :size="40" :image-url="message.sender.avatar" />
                  </div>
                  <div class="message-main">
                    <div class="message-info">
                      <span class="message-sender">{{
                        message.sender.name
                      }}</span>
                      <span class="message-time">{{
                        formatDate(message.createdAt)
                      }}</span>
                    </div>
                    <div class="message-content-text">
                      <span
                        v-if="message.type === 'like'"
                        class="message-action"
                      >
                        <icon-thumb-up class="icon-like" /> 赞了你的帖子
                      </span>
                      <span
                        v-else-if="message.type === 'comment'"
                        class="message-action"
                      >
                        <icon-message class="icon-comment" /> 评论了你的帖子
                      </span>
                      <span class="message-post-title"
                        >《{{ message.post.title }}》</span
                      >
                    </div>
                    <div
                      class="message-detail"
                      v-if="message.type === 'comment'"
                    >
                      <div class="comment-content">
                        {{ message.content }}
                      </div>
                    </div>
                  </div>
                  <div class="message-actions">
                    <a-button
                      type="text"
                      @click.stop="markAsRead(message)"
                      v-if="!message.isRead"
                    >
                      标为已读
                    </a-button>
                    <a-button
                      type="text"
                      status="danger"
                      @click.stop="deleteMessage(message)"
                    >
                      <template #icon><icon-delete /></template>
                    </a-button>
                  </div>
                </div>
              </a-list-item>
            </a-list>
          </template>

          <template v-else>
            <div class="empty-state">
              <a-empty description="暂无相关消息" />
            </div>
          </template>

          <!-- 加载更多 -->
          <div
            class="load-more"
            v-if="hasMoreMessages && filteredMessages.length > 0"
          >
            <a-button
              type="text"
              @click="loadMoreMessages"
              :loading="loadingMore"
            >
              {{ loadingMore ? "加载中..." : "加载更多消息" }}
              <template #icon><icon-down /></template>
            </a-button>
          </div>
        </a-spin>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconThumbUp,
  IconMessage,
  IconDown,
  IconCheck,
  IconDelete,
} from "@arco-design/web-vue/es/icon";
import {
  messageService,
  type Message as MessageType,
} from "../../services/message.service";
import { useUserStore } from "../../stores/user.store";

const router = useRouter();
const userStore = useUserStore();

// 状态
const loading = ref(false);
const loadingMore = ref(false);
const hasMoreMessages = ref(true);
const messageType = ref("all"); // all, like, comment, unread
const messages = ref<MessageType[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);

// 过滤消息
const filteredMessages = computed(() => {
  // 检查messages数组是否有效
  if (!messages.value || !Array.isArray(messages.value)) {
    console.warn("消息数组无效:", messages.value);
    return [];
  }

  return messages.value;
});

// 是否有未读消息
const hasUnread = computed(() => {
  return messages.value.some((msg) => !msg.isRead);
});

// 获取消息类型标签
const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    all: "全部消息",
    like: "点赞通知",
    comment: "评论通知",
    unread: "未读消息",
  };
  return types[type] || "全部消息";
};

// 处理消息类型切换
const handleTypeChange = (type: string) => {
  messageType.value = type;
  console.log(`切换消息类型: ${type}`);

  // 重置页码并重新加载数据
  currentPage.value = 1;
  loadMessages();
};

// 加载消息
const loadMessages = async () => {
  try {
    loading.value = true;

    console.log(
      `加载消息，类型: ${messageType.value}, 页码: ${currentPage.value}`
    );

    // 添加更多调试日志
    console.log("开始请求消息数据...");

    // 从API获取数据
    const data = await messageService.getMessages(
      messageType.value,
      currentPage.value,
      pageSize.value
    );

    console.log("收到消息数据:", data);
    console.log(
      "消息数据类型:",
      typeof data,
      Array.isArray(data),
      "数量:",
      data?.length || 0
    );

    // 验证数据是否有效
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("没有获取到消息数据");
      if (currentPage.value === 1) {
        // 如果是第一页且没有数据，显示提示
        Message.info("暂无消息");
      }
      hasMoreMessages.value = false;
      loading.value = false;
      return;
    }

    // 如果是第一页，替换消息列表，否则添加到列表末尾
    if (currentPage.value === 1) {
      messages.value = data;
    } else {
      messages.value = [...messages.value, ...data];
    }

    // 判断是否还有更多消息
    hasMoreMessages.value = data.length === pageSize.value;

    console.log(
      `成功加载${data.length}条消息，消息列表现有${messages.value.length}条`
    );
  } catch (error) {
    console.error("加载消息失败:", error);
    Message.error("加载消息失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载更多消息
const loadMoreMessages = async () => {
  if (loadingMore.value) return;

  try {
    loadingMore.value = true;
    currentPage.value += 1;

    console.log(`加载更多消息，页码: ${currentPage.value}`);
    const data = await messageService.getMessages(
      messageType.value,
      currentPage.value,
      pageSize.value
    );

    // 添加到列表末尾
    messages.value = [...messages.value, ...data];

    // 判断是否还有更多消息
    hasMoreMessages.value = data.length === pageSize.value;

    console.log(`成功加载更多${data.length}条消息`);
  } catch (error) {
    console.error("加载更多消息失败:", error);
    Message.error("加载更多消息失败，请稍后重试");
  } finally {
    loadingMore.value = false;
  }
};

// 查看消息详情
const viewMessageDetail = async (message: MessageType) => {
  try {
    // 如果消息未读，自动标记为已读
    if (!message.isRead) {
      console.log(`自动标记消息已读，ID: ${message.id}`);
      const success = await messageService.markAsRead(message.id);

      if (success) {
        message.isRead = true;
        console.log("消息已自动标记为已读");
      } else {
        console.error("自动标记消息已读失败");
      }
    }

    // 跳转到对应的帖子页面
    Message.info(`查看帖子《${message.post.title}》`);
    // 实际跳转到帖子详情页
    router.push(`/forum/post/${message.post.id}`);
  } catch (error) {
    console.error("处理消息详情时出错:", error);
    // 出错时仍然跳转到帖子页面
    router.push(`/forum/post/${message.post.id}`);
  }
};

// 标记单条消息为已读
const markAsRead = async (message: MessageType) => {
  try {
    console.log(`标记消息已读，ID: ${message.id}`);

    // 调用API将消息标记为已读
    const success = await messageService.markAsRead(message.id);

    if (success) {
      // 更新本地状态
      message.isRead = true;
      Message.success("已标记为已读");
    } else {
      Message.error("标记已读失败，请稍后重试");
    }
  } catch (error) {
    console.error("标记消息已读失败:", error);
    Message.error("标记已读失败，请稍后重试");
  }
};

// 标记所有消息为已读
const markAllAsRead = async () => {
  try {
    console.log("标记所有消息为已读");

    // 调用API将所有消息标记为已读
    const success = await messageService.markAllAsRead();

    if (success) {
      // 更新本地状态
      messages.value.forEach((msg) => {
        msg.isRead = true;
      });
      Message.success("已全部标记为已读");
    } else {
      Message.error("标记全部已读失败，请稍后重试");
    }
  } catch (error) {
    console.error("标记所有消息已读失败:", error);
    Message.error("标记全部已读失败，请稍后重试");
  }
};

// 删除消息
const deleteMessage = async (message: MessageType) => {
  try {
    console.log(`删除消息，ID: ${message.id}`);

    // 调用API删除消息
    const success = await messageService.deleteMessage(message.id);

    if (success) {
      // 从列表中移除消息
      const index = messages.value.findIndex((item) => item.id === message.id);
      if (index !== -1) {
        messages.value.splice(index, 1);
        Message.success("消息已删除");
      }
    } else {
      Message.error("删除消息失败，请稍后重试");
    }
  } catch (error) {
    console.error("删除消息失败:", error);
    Message.error("删除消息失败，请稍后重试");
  }
};

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

// 初始化
onMounted(() => {
  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    Message.warning("请先登录后查看消息");
    router.push("/auth/login");
    return;
  }

  // 加载消息
  loadMessages();
});
</script>

<style scoped>
.message-container {
  padding: 20px 0;
  max-width: 1400px;
  margin: 0 auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-area {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d2129;
}

.page-desc {
  font-size: 14px;
  color: #4e5969;
  max-width: 800px;
}

.message-content {
  margin-top: 20px;
}

.message-list {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-item {
  position: relative;
  padding: 16px 20px;
  transition: background-color 0.3s;
  border-bottom: 1px solid #f2f3f5;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item:hover {
  background-color: #f9f9fa;
}

.message-item.unread {
  background-color: #f2f8ff;
}

.message-item.unread:hover {
  background-color: #e8f3ff;
}

.message-dot {
  position: absolute;
  top: 24px;
  left: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #165dff;
}

.message-wrapper {
  display: flex;
  width: 100%;
  cursor: pointer;
}

.message-avatar {
  margin-right: 16px;
  flex-shrink: 0;
}

.message-main {
  flex: 1;
  overflow: hidden;
}

.message-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-sender {
  font-weight: 500;
  font-size: 15px;
  color: #1d2129;
}

.message-time {
  font-size: 13px;
  color: #86909c;
}

.message-content-text {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 8px;
}

.message-action {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
}

.icon-like,
.icon-comment {
  margin-right: 4px;
}

.icon-like {
  color: #f53f3f;
}

.icon-comment {
  color: #165dff;
}

.message-post-title {
  color: #1d2129;
  font-weight: 500;
}

.message-detail {
  margin-top: 8px;
}

.comment-content {
  background-color: #f7f8fa;
  padding: 10px 12px;
  border-radius: 4px;
  color: #4e5969;
  font-size: 14px;
  line-height: 1.6;
}

.message-actions {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.load-more {
  text-align: center;
  margin: 20px 0;
}
</style> 