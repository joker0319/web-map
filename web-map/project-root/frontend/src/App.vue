<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useUserStore } from "./stores/user.store";
import { userService } from "./services/user.service";

const userStore = useUserStore();

onMounted(async () => {
  // 从本地存储初始化用户状态
  userStore.initFromStorage();

  // 如果有令牌但没有用户信息，自动获取用户信息
  if (userStore.token && !userStore.user) {
    try {
      console.log("正在获取用户信息...");
      const response = await userService.getUserProfile();
      console.log("App.vue - 获取用户信息响应:", response);

      // 处理不同的响应结构
      let userData;
      if (response && response.success && response.data) {
        userData = response.data;
        console.log("App.vue - 从response.data提取用户数据:", userData);
      } else if (response && response.id && response.username) {
        userData = response;
        console.log("App.vue - 直接使用response作为用户数据:", userData);
      } else {
        console.error("App.vue - 无法识别的响应格式:", response);
        throw new Error("未知的响应格式");
      }

      // 确保userData不为undefined后再使用
      if (!userData) {
        console.error("App.vue - 无法从响应中提取用户数据");
        throw new Error("无法获取用户数据");
      }

      // 构造用户对象并更新store
      const userForStore = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        bio: userData.bio || null,
        isAdmin: userData.is_admin || userData.isAdmin || false,
      };

      console.log("App.vue - 准备更新的用户数据:", userForStore);
      userStore.setUserInfo(userForStore);

      console.log("用户信息获取并更新成功:", userStore.user);
    } catch (error) {
      console.error("自动获取用户信息失败:", error);
      // 如果获取失败可能是令牌无效，清除令牌
      userStore.logout();
    }
  }
});
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

#app,
.app-container {
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
