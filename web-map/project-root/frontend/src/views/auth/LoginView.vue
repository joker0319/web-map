<template>
  <div
    class="login-container flex justify-center items-center min-h-screen bg-gray-100"
  >
    <a-card class="login-card w-full max-w-md shadow-lg rounded-lg">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">系统登录</h1>
        <p class="text-gray-500 mt-2">请输入您的账号和密码</p>
      </div>

      <a-form
        :model="loginForm"
        :rules="rules"
        @submit="handleSubmit"
        layout="vertical"
        ref="formRef"
      >
        <a-form-item field="username" label="用户名">
          <a-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :max-length="20"
            allow-clear
          >
            <template #prefix>
              <icon-user />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="password" label="密码">
          <a-input-password
            v-model="loginForm.password"
            placeholder="请输入密码"
            :max-length="30"
            allow-clear
          >
            <template #prefix>
              <icon-lock />
            </template>
          </a-input-password>
        </a-form-item>

        <div class="flex justify-between mb-4">
          <a-checkbox v-model="loginForm.rememberMe"> 记住我 </a-checkbox>
          <a-link>忘记密码？</a-link>
        </div>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            long
            :loading="loading"
            class="bg-blue-600"
          >
            登录
          </a-button>
        </a-form-item>

        <div v-if="loginError" class="mt-4">
          <a-alert type="error" :content="loginError" />
        </div>

        <div class="text-center mt-4">
          <span class="text-gray-600">还没有账号？</span>
          <a-link @click="router.push('/auth/register')">立即注册</a-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";
import { useLoading } from "../../composables/useLoading";
import { useNotification } from "../../composables/useNotification";

// 使用自定义组合式API
const { login } = useAuth();
const { startLoading, endLoading } = useLoading();
const { showNotification } = useNotification();
const router = useRouter();

// 表单引用
const formRef = ref(null);

// 表单数据
const loginForm = reactive({
  username: "",
  password: "",
  rememberMe: false,
});

// 登录状态
const loading = ref(false);
const loginError = ref("");

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名" },
    { minLength: 3, message: "用户名长度不能小于3个字符" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { minLength: 6, message: "密码长度不能小于6个字符" },
  ],
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单验证
    await (formRef.value as any).validate();

    // 开始登录
    loginError.value = "";
    loading.value = true;
    startLoading("登录中...");

    // 调用登录API (使用username字段，与后端一致)
    await login({
      username: loginForm.username, // 使用username而不是email
      password: loginForm.password,
      rememberMe: loginForm.rememberMe,
    });

    // 仅保留跳转逻辑（如果需要）
    // router.push("/home");
  } catch (error: any) {
    // 处理登录错误
    loginError.value = error.message || "登录失败，请检查用户名和密码";

    showNotification({
      title: "登录失败",
      content: loginError.value,
      type: "error",
    });
  } finally {
    loading.value = false;
    endLoading();
  }
};
</script>

<style scoped>
.login-container {
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  padding: 20px;
}
</style> 