<template>
  <a-layout class="layout-container">
    <!-- 顶部导航栏 -->
    <a-layout-header class="header">
      <div class="header-container">
        <!-- 左侧部分：Logo和导航菜单 -->
        <div class="left-section">
          <!-- Logo -->
          <div class="logo">
            <img src="@/assets/images/logo.svg" alt="Logo" height="32" />
            <span class="logo-text">户外徒步平台</span>
          </div>

          <!-- 导航菜单 -->
          <div class="nav-menu">
            <div class="menu-items">
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('home') }"
                @click="selectMenuItem('home')"
              >
                <icon-home class="menu-icon" />
                <span>首页</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('map') }"
                @click="selectMenuItem('map')"
              >
                <icon-location class="menu-icon" />
                <span>地图</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('dashboard') }"
                @click="selectMenuItem('dashboard')"
              >
                <icon-dashboard class="menu-icon" />
                <span>路线</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('articles') }"
                @click="selectMenuItem('articles')"
              >
                <icon-file class="menu-icon" />
                <span>资讯</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('forum') }"
                @click="selectMenuItem('forum')"
              >
                <icon-common class="menu-icon" />
                <span>交流</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('message') }"
                @click="selectMenuItem('message')"
              >
                <icon-message class="menu-icon" />
                <span>消息</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: selectedKeys.includes('ai-assistant') }"
                @click="selectMenuItem('ai-assistant')"
              >
                <icon-robot class="menu-icon" />
                <span>AI助手</span>
              </div>
              <div
                class="menu-item"
                v-if="userStore.user?.isAdmin"
                :class="{ active: selectedKeys.includes('admin') }"
                @click="selectMenuItem('admin')"
              >
                <icon-settings class="menu-icon" />
                <span>管理</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧用户操作区 -->
        <div class="user-actions">
          <a-space>
            <!-- 未登录时显示登录按钮 -->
            <template v-if="!userStore.isLoggedIn">
              <a-button type="primary" @click="handleLogin">
                <template #icon><icon-user /></template>
                登录
              </a-button>
            </template>

            <!-- 已登录时显示用户下拉菜单 -->
            <template v-else>
              <a-dropdown trigger="click">
                <a-button type="text" class="user-dropdown-button">
                  <!-- 使用自定义头像 -->
                  <div class="nav-avatar">
                    <template v-if="userStore.user?.avatar">
                      <img
                        :src="userStore.user.avatar"
                        class="nav-avatar-image"
                        @error="handleNavImageError"
                        v-if="!showNavDefaultAvatar"
                      />
                      <div v-else class="nav-avatar-text">
                        {{
                          userStore.user?.username
                            ?.substring(0, 1)
                            .toUpperCase()
                        }}
                      </div>
                    </template>
                    <div v-else class="nav-avatar-text">
                      {{
                        userStore.user?.username?.substring(0, 1).toUpperCase()
                      }}
                    </div>
                  </div>
                  <span class="ml-2">{{ userStore.user?.username }}</span>
                  <icon-down class="ml-1" />
                </a-button>
                <template #content>
                  <a-doption @click="selectMenuItem('profile')">
                    <template #icon><icon-user /></template>
                    个人中心
                  </a-doption>
                  <a-divider style="margin: 4px 0" />
                  <a-doption @click="handleLogout">
                    <template #icon><icon-export /></template>
                    退出登录
                  </a-doption>
                </template>
              </a-dropdown>
            </template>
          </a-space>
        </div>
      </div>
    </a-layout-header>

    <!-- 内容区域 -->
    <a-layout-content class="content">
      <slot></slot>
    </a-layout-content>

    <!-- 底部区域 -->
    <a-layout-footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <a-space size="large">
            <a href="#">关于我们</a>
            <a href="#">帮助中心</a>
            <a href="#">隐私政策</a>
          </a-space>
        </div>
        <div class="copyright">
          © {{ new Date().getFullYear() }} 户外徒步平台
        </div>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts">
export default {
  name: "DefaultLayout",
};
</script>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../stores/user.store";
import {
  IconHome,
  IconDashboard,
  IconMessage,
  IconUser,
  IconNotification,
  IconSettings,
  IconLocation,
  IconCommon,
  IconDown,
  IconExport,
  IconRobot,
  IconApps,
  IconFile,
} from "@arco-design/web-vue/es/icon";

// 路由
const router = useRouter();
const route = useRoute();

// 用户状态
const userStore = useUserStore();

// 头像key，用于强制重新渲染头像组件
const avatarKey = ref(Date.now());

// 计算头像URL
const avatarUrl = computed(() => {
  // 每次计算时都检查用户信息
  if (!userStore.user) {
    console.log("导航栏: 用户信息不存在");
    return "";
  }

  const avatarSrc = userStore.user.avatar || "";
  console.log("导航栏头像URL计算:", avatarSrc);

  // 检测URL是否有效
  if (avatarSrc && !avatarSrc.startsWith("http")) {
    console.warn("导航栏: 头像URL格式可能不正确:", avatarSrc);
  }

  // 强制重新渲染头像
  nextTick(() => {
    avatarKey.value = Date.now();
  });

  // 添加时间戳防止缓存问题
  return avatarSrc ? `${avatarSrc}?t=${Date.now()}` : "";
});

// 当前选中的菜单项
const selectedKeys = ref(["home"]);

// 根据路由路径设置激活的菜单项
const updateSelectedMenuByRoute = (path: string) => {
  if (path.includes("/home")) {
    selectedKeys.value = ["home"];
  } else if (path.includes("/map")) {
    selectedKeys.value = ["map"];
  } else if (path.includes("/dashboard")) {
    selectedKeys.value = ["dashboard"];
  } else if (path.includes("/message")) {
    selectedKeys.value = ["message"];
  } else if (path.includes("/forum")) {
    selectedKeys.value = ["forum"];
  } else if (path.includes("/profile")) {
    selectedKeys.value = ["profile"];
  } else if (path.includes("/ai-assistant")) {
    selectedKeys.value = ["ai-assistant"];
  } else if (path.includes("/admin")) {
    selectedKeys.value = ["admin"];
  } else if (path.includes("/articles")) {
    selectedKeys.value = ["articles"];
  }
};

// 监听路由变化，更新菜单激活状态
watch(
  () => route.path,
  (newPath) => {
    updateSelectedMenuByRoute(newPath);
  }
);

// 初始化时根据当前路由设置激活菜单
onMounted(() => {
  updateSelectedMenuByRoute(route.path);
});

// 处理菜单项选择
const selectMenuItem = (key: string) => {
  selectedKeys.value = [key];
  // 根据不同菜单项导航到不同页面
  switch (key) {
    case "home":
      router.push("/home");
      break;
    case "dashboard":
      router.push("/dashboard");
      break;
    case "message":
      router.push("/message");
      break;
    case "map":
      router.push("/map");
      break;
    case "forum":
      router.push("/forum");
      break;
    case "profile":
      router.push("/profile");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "ai-assistant":
      router.push("/ai-assistant");
      break;
    case "admin":
      router.push("/admin");
      break;
    case "articles":
      router.push("/articles");
      break;
  }
};

// 处理登录按钮点击
const handleLogin = () => {
  router.push("/auth/login");
};

// 处理退出登录
const handleLogout = () => {
  userStore.logout();
  router.push("/auth/login");
};

// 控制导航头像显示
const showNavDefaultAvatar = ref(false);

// 处理导航头像加载失败
const handleNavImageError = (e: Event) => {
  console.error("导航栏头像加载失败:", e);
  console.log("加载失败的头像URL:", userStore.user?.avatar);

  // 改为显示默认头像
  showNavDefaultAvatar.value = true;
};

// 监听用户信息变化
watch(
  () => userStore.user,
  (newUser) => {
    console.log("导航栏: 用户信息已更新", newUser?.avatar);

    // 如果有新头像，尝试再次加载图片
    if (newUser?.avatar) {
      // 重置显示状态，尝试加载头像
      showNavDefaultAvatar.value = false;
    }
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.header {
  position: fixed;
  width: 100%;
  padding: 0;
  z-index: 100;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  max-width: 1400px;
  margin: 0 auto;
}

.left-section {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 40px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nav-menu {
  height: 100%;
}

.menu-items {
  display: flex;
  height: 100%;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 60px;
  cursor: pointer;
  transition: all 0.3s;
  color: #333;
}

.menu-item:hover {
  color: #165dff;
  background-color: rgba(22, 93, 255, 0.05);
}

.menu-item.active {
  color: #165dff;
  border-bottom: 2px solid #165dff;
}

.menu-icon {
  margin-right: 5px;
}

.user-dropdown-button {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-dropdown-button:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* 导航栏自定义头像 */
.nav-avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  overflow: hidden;
  background-color: #3370ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 16px;
  background-color: #3370ff;
}

.content {
  padding: 80px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 60px - 100px); /* 减去header和footer的高度 */
}

.footer {
  background-color: #f5f5f5;
  padding: 20px;
  height: 100px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-links a {
  color: #555;
  text-decoration: none;
}

.copyright {
  color: #999;
  font-size: 14px;
}

.ml-1 {
  margin-left: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.user-actions {
  align-self: flex-end;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    height: auto;
    padding: 10px;
  }

  .left-section {
    width: 100%;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .logo {
    margin-right: 0;
  }

  .menu-items {
    gap: 10px;
  }

  .menu-item {
    padding: 0 10px;
    height: 40px;
  }

  .user-actions {
    align-self: flex-end;
  }
}
</style>