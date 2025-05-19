<template>
  <DefaultLayout>
    <div class="ai-assistant-container">
      <a-card class="chat-card">
        <div class="chat-header">
          <h2><icon-robot /> AI户外助手</h2>
          <p class="subtitle">
            您的智能徒步向导，随时为您提供路线推荐和天气建议
          </p>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'message-item',
              message.type === 'user' ? 'user-message' : 'assistant-message',
            ]"
          >
            <a-avatar
              :style="{
                backgroundColor:
                  message.type === 'user' ? '#165DFF' : '#00B42A',
              }"
            >
              <icon-user v-if="message.type === 'user'" />
              <icon-robot v-else />
            </a-avatar>
            <div class="message-content">
              <div class="message-bubble">{{ message.content }}</div>
              <span class="message-time">{{ message.time }}</span>
            </div>
          </div>

          <div v-if="isLoading" class="loading-message">
            <a-spin />
            <span class="ml-2">正在思考...</span>
          </div>
        </div>

        <div class="chat-footer">
          <a-input-search
            v-model="userInput"
            placeholder="询问路线推荐、天气建议或户外装备..."
            search-button
            allow-clear
            @search="sendMessage"
            @press-enter="sendMessage"
          >
            <template #button-icon>
              <icon-send />
            </template>
          </a-input-search>

          <div class="quick-questions">
            <a-space>
              <!-- <a-tag
                checkable
                size="medium"
                @click="quickAsk('推荐杭州周边的徒步路线')"
                >推荐杭州周边的徒步路线</a-tag
              >
              <a-tag
                checkable
                size="medium"
                @click="quickAsk('明天北京的天气适合徒步吗')"
                >明天北京的天气适合徒步吗</a-tag
              >
              <a-tag checkable size="medium" @click="quickAsk('徒步装备清单')"
                >徒步装备清单</a-tag
              > -->
            </a-space>
          </div>
        </div>
      </a-card>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import { IconRobot, IconUser, IconSend } from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import { aiService } from "../../services/ai.service";

type MessageType = {
  content: string;
  type: "user" | "assistant";
  time: string;
};

const userInput = ref("");
const messages = ref<MessageType[]>([]);
const isLoading = ref(false);
const chatBodyRef = ref<HTMLElement | null>(null);
const chatHistory = ref<Array<[string, string]>>([]);

// 初始化欢迎消息
onMounted(() => {
  addMessage(
    "您好！我是您的户外助手。我可以帮您推荐徒步路线、提供天气建议或者回答关于户外活动的问题。请问有什么可以帮您的吗？",
    "assistant"
  );
});

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const userMessage = userInput.value;
  userInput.value = "";

  // 添加用户消息
  addMessage(userMessage, "user");

  // 显示加载状态
  isLoading.value = true;

  // 滚动到底部
  await scrollToBottom();

  try {
    // 调用智谱AI接口获取回复
    const response = await aiService.sendMessage(
      userMessage,
      chatHistory.value
    );

    // 添加助手回复
    addMessage(response, "assistant");

    // 更新对话历史记录
    chatHistory.value.push([userMessage, response]);

    // 如果历史记录过长，保留最近的10轮对话
    if (chatHistory.value.length > 10) {
      chatHistory.value = chatHistory.value.slice(
        chatHistory.value.length - 10
      );
    }
  } catch (error) {
    console.error("AI回复出错:", error);
    Message.error("获取AI回复时出错，请稍后再试");

    // 添加错误提示消息
    addMessage("抱歉，我暂时无法回答您的问题，请稍后再试。", "assistant");
  } finally {
    isLoading.value = false;
    // 再次滚动到底部
    scrollToBottom();
  }
};

// 快速提问
const quickAsk = (question: string) => {
  userInput.value = question;
  sendMessage();
};

// 添加消息到列表
const addMessage = (content: string, type: "user" | "assistant") => {
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  messages.value.push({
    content,
    type,
    time: timeString,
  });
};

// 滚动到对话底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
  }
};
</script>

<style scoped>
.ai-assistant-container {
  padding: 20px;
  height: calc(100vh - 160px);
  display: flex;
  justify-content: center;
}

.chat-card {
  width: 100%;
  max-width: 900px;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  text-align: center;
  flex-shrink: 0;
}

.subtitle {
  color: #86909c;
  margin-top: 4px;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
  max-height: calc(100vh - 320px);
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
  margin-bottom: 8px;
}

.user-message {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.assistant-message {
  align-self: flex-start;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 40px);
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.user-message .message-bubble {
  background-color: #165dff;
  color: white;
  border-top-right-radius: 2px;
}

.assistant-message .message-bubble {
  background-color: #f2f3f5;
  color: #333;
  border-top-left-radius: 2px;
}

.message-time {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  align-self: flex-end;
}

.loading-message {
  display: flex;
  align-items: center;
  color: #86909c;
  padding: 8px 16px;
}

.chat-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.quick-questions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-2 {
  margin-left: 8px;
}
</style> 