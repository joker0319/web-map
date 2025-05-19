<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1 class="settings-title">账号设置</h1>
    </div>

    <a-card class="settings-card">
      <a-tabs default-active-key="1">
        <a-tab-pane key="1" title="基本信息">
          <a-form :model="settingsForm" layout="vertical">
            <a-form-item field="password" label="修改密码">
              <a-input-password
                v-model="settingsForm.password"
                placeholder="输入新密码"
              />
            </a-form-item>
            <a-form-item field="confirmPassword" label="确认密码">
              <a-input-password
                v-model="settingsForm.confirmPassword"
                placeholder="再次输入新密码"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="updatePassword"
                >保存更改</a-button
              >
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="2" title="通知设置">
          <a-form :model="notificationSettings" layout="vertical">
            <a-form-item>
              <a-space direction="vertical" style="width: 100%">
                <a-checkbox v-model="notificationSettings.email"
                  >接收邮件通知</a-checkbox
                >
                <a-checkbox v-model="notificationSettings.system"
                  >接收系统通知</a-checkbox
                >
              </a-space>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="updateNotificationSettings"
                >保存设置</a-button
              >
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useNotification } from "../../composables/useNotification";

const { showNotification } = useNotification();

const settingsForm = reactive({
  password: "",
  confirmPassword: "",
});

const notificationSettings = reactive({
  email: true,
  system: true,
});

const updatePassword = () => {
  if (settingsForm.password !== settingsForm.confirmPassword) {
    showNotification({
      title: "错误",
      content: "两次输入的密码不一致",
      type: "error",
    });
    return;
  }

  // TODO: 实现密码更新逻辑
  showNotification({
    title: "成功",
    content: "密码已更新",
    type: "success",
  });

  // 清空表单
  settingsForm.password = "";
  settingsForm.confirmPassword = "";
};

const updateNotificationSettings = () => {
  // TODO: 实现通知设置更新逻辑
  showNotification({
    title: "成功",
    content: "通知设置已更新",
    type: "success",
  });
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
}

.settings-card {
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
</style>
