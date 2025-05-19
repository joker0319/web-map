<template>
  <div
    class="register-container flex justify-center items-center min-h-screen bg-gray-100"
  >
    <a-card class="register-card w-full max-w-md shadow-lg rounded-lg">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">用户注册</h1>
        <p class="text-gray-500 mt-2">请填写以下信息完成注册</p>
      </div>

      <a-form
        :model="registerForm"
        :rules="rules"
        @submit="handleSubmit"
        layout="vertical"
        ref="formRef"
      >
        <a-form-item field="username" label="用户名">
          <a-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :max-length="20"
            allow-clear
          >
            <template #prefix>
              <icon-user />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="email" label="邮箱">
          <a-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            allow-clear
          >
            <template #prefix>
              <icon-email />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="password" label="密码">
          <a-input-password
            v-model="registerForm.password"
            placeholder="请输入密码"
            :max-length="30"
            allow-clear
          >
            <template #prefix>
              <icon-lock />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item field="confirmPassword" label="确认密码">
          <a-input-password
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            :max-length="30"
            allow-clear
          >
            <template #prefix>
              <icon-lock />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            long
            :loading="loading"
            class="bg-green-600"
          >
            注册
          </a-button>
        </a-form-item>

        <div v-if="registerError" class="mt-4">
          <a-alert type="error" :content="registerError" />
        </div>

        <div class="text-center mt-4">
          <span class="text-gray-600">已有账号？</span>
          <a-link @click="router.push('/auth/login')">立即登录</a-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useNotification } from "../../composables/useNotification";
import { authService } from "../../services/auth.service";

// 使用组合式API
const router = useRouter();
const { showNotification } = useNotification();

// 表单引用
const formRef = ref(null);

// 表单数据
const registerForm = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

// 注册状态
const loading = ref(false);
const registerError = ref("");

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名" },
    { minLength: 3, message: "用户名长度不能小于3个字符" },
  ],
  email: [
    { required: true, message: "请输入邮箱" },
    { type: "email", message: "请输入有效的邮箱地址" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { minLength: 6, message: "密码长度不能小于6个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码" },
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (value !== registerForm.password) {
          callback("两次输入的密码不一致");
        } else {
          callback();
        }
      },
    },
  ],
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单验证
    await (formRef.value as any).validate();

    // 开始注册
    registerError.value = "";
    loading.value = true;

    // 调用注册API
    await authService.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    });

    showNotification({
      title: "注册成功",
      content: "您已成功注册，请登录系统",
      type: "success",
    });

    // 注册成功，跳转至登录页
    router.push("/auth/login");
  } catch (error: any) {
    // 处理注册错误
    registerError.value = error.message || "注册失败，请检查输入信息";

    showNotification({
      title: "注册失败",
      content: registerError.value,
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-card {
  padding: 20px;
}
</style> 