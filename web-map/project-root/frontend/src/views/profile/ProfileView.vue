<template>
  <DefaultLayout>
    <div class="profile-container">
      <!-- 居中显示的用户信息卡片 -->
      <a-card class="user-info-card">
        <div class="user-header">
          <!-- 使用div+img替代a-avatar -->
          <div class="custom-avatar">
            <template v-if="userStore.user?.avatar">
              <img
                :src="userStore.user.avatar"
                class="avatar-image"
                @error="
                  (e) => {
                    console.error('头像加载失败', e);
                    showDefaultAvatar = true;
                  }
                "
                v-show="!showDefaultAvatar"
              />
              <div v-show="showDefaultAvatar" class="avatar-text">
                {{ userStore.user?.username?.substring(0, 1).toUpperCase() }}
              </div>
            </template>
            <div v-else class="avatar-text">
              {{ userStore.user?.username?.substring(0, 1).toUpperCase() }}
            </div>
          </div>
          <h2 class="user-name">{{ userStore.user?.username }}</h2>
          <p class="user-email">{{ userStore.user?.email }}</p>
          <a-button
            type="primary"
            shape="round"
            size="medium"
            class="edit-button"
            @click="showEditDialog = true"
          >
            <template #icon><icon-edit /></template>
            编辑个人资料
          </a-button>
        </div>
      </a-card>
    </div>

    <!-- 添加编辑弹窗 -->
    <a-modal
      v-model:visible="showEditDialog"
      title="编辑个人资料"
      @cancel="showEditDialog = false"
      @before-ok="handleSaveProfile"
    >
      <a-form :model="profileForm" layout="vertical">
        <!-- 头像上传 -->
        <div class="avatar-upload text-center mb-4">
          <a-upload
            action="/api/upload"
            :show-file-list="false"
            :custom-request="customUploadRequest"
            accept="image/*"
          >
            <div class="avatar-wrapper">
              <a-avatar
                :size="120"
                :src="avatarPreview || userStore.user?.avatar"
                style="background-color: #3370ff; font-size: 40px"
              >
                <template v-if="!avatarPreview && !userStore.user?.avatar">
                  {{ userStore.user?.username?.substring(0, 1).toUpperCase() }}
                </template>
              </a-avatar>
              <div class="avatar-mask">
                <icon-camera />
                <div>更换头像</div>
              </div>
            </div>
          </a-upload>
        </div>

        <!-- 表单项 -->
        <a-form-item field="username" label="用户名">
          <a-input v-model="profileForm.username" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item field="email" label="邮箱">
          <a-input
            v-model="profileForm.email"
            placeholder="请输入邮箱"
            disabled
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user.store";
import { useNotification } from "../../composables/useNotification";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconUser,
  IconEdit,
  IconDashboard,
  IconHeart,
  IconSettings,
  IconCamera,
} from "@arco-design/web-vue/es/icon";
import { userService } from "../../services/user.service";

const router = useRouter();
const userStore = useUserStore();
const { showNotification } = useNotification();

const showEditDialog = ref(false);
const avatarPreview = ref("");
const showAvatarDebug = ref(false);
const avatarLoadStatus = ref("未测试");
const avatarKey = ref(Date.now());
const showDirectImage = ref(false);
const showDefaultAvatar = ref(false);

const profileForm = reactive({
  username: "",
  email: "",
  avatar: null as File | null,
});

const customUploadRequest = (options: any) => {
  console.log("上传选项:", options);

  // 正确获取文件对象: 使用 fileItem 属性获取文件
  if (!options || !options.fileItem) {
    console.error("找不到文件对象");
    return;
  }

  // 从fileItem中获取原始文件
  const file = options.fileItem.file;
  if (!file) {
    console.error("无效的文件对象");
    return;
  }

  profileForm.avatar = file;

  // 读取文件并预览
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  // 通知上传成功
  if (options.onSuccess) {
    options.onSuccess();
  }
};

const handleSaveProfile = async () => {
  try {
    // 确保username不为空
    if (!profileForm.username) {
      showNotification({
        title: "验证失败",
        content: "用户名不能为空",
        type: "error",
      });
      return false;
    }

    const formData = new FormData();
    // 确保添加用户名字段
    formData.append("username", profileForm.username);

    if (profileForm.avatar) {
      formData.append("avatar", profileForm.avatar);
    }

    console.log("发送的用户名:", profileForm.username); // 添加日志

    const response = await userService.updateProfile(formData);
    console.log("服务器响应:", response); // 打印完整响应

    // 从服务器响应中获取用户信息和头像URL
    if (response && response.data) {
      // 提取服务器返回的用户数据
      const { id, username, email, avatar, bio } = response.data;

      // 添加时间戳防止缓存
      const avatarWithTimestamp = avatar
        ? `${avatar}?t=${Date.now()}`
        : undefined;

      // 更新用户状态
      userStore.updateUser({
        id,
        username,
        email,
        avatar: avatarWithTimestamp,
        bio,
      });

      // 确保本地存储也更新
      localStorage.setItem("user_info", JSON.stringify(userStore.user));

      // 立即更新头像预览
      avatarPreview.value = avatar ? `${avatar}?t=${Date.now()}` : "";
    }

    // 成功提示和清理
    showNotification({
      title: "保存成功",
      content: "个人资料已更新",
      type: "success",
    });
    showEditDialog.value = false;

    // 不再使用页面刷新
  } catch (error: any) {
    showNotification({
      title: "保存失败",
      content: error.message || "个人资料更新失败",
      type: "error",
    });
  }
};

// 切换直接图片显示模式
const toggleDirectImage = () => {
  showDirectImage.value = !showDirectImage.value;
  console.log(
    `切换到${showDirectImage.value ? "原生img标签" : "Avatar组件"}显示头像`
  );
};

// 处理直接图片加载错误
const handleDirectImageError = (e: Event) => {
  console.error("原生img标签加载头像失败:", e);
  avatarLoadStatus.value = "原生img加载失败";
  // 显示调试信息
  showAvatarDebug.value = true;
};

onMounted(async () => {
  // 确保用户已登录
  if (!userStore.token) {
    router.push("/auth/login");
    return;
  }

  // 显示调试信息
  showAvatarDebug.value = true;

  // 尝试获取最新的用户资料
  try {
    console.log("加载用户资料...");
    const response = await userService.getUserProfile();
    console.log("ProfileView - 服务器响应完整结构:", response);

    // 检查响应结构并提取用户数据
    let userData;
    if (response && response.success && response.data) {
      userData = response.data;
      console.log("ProfileView - 标准响应结构，从response.data提取:", userData);
    } else if (response && response.id && response.username) {
      userData = response;
      console.log(
        "ProfileView - 直接响应结构，用户数据就是response:",
        userData
      );
    } else {
      console.error("ProfileView - 未知的响应结构:", response);
      throw new Error("获取用户数据失败");
    }

    // 确认用户数据是否有效
    if (!userData) {
      console.error("ProfileView - 无法从响应中提取用户数据");
      throw new Error("无法获取用户数据");
    }

    // 构造完整的用户对象
    const userForStore = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      bio: userData.bio || null,
      isAdmin: userStore.user?.isAdmin || false, // 保留管理员状态
    };

    console.log("ProfileView - 即将更新到store的用户对象:", userForStore);

    // 更新用户状态
    userStore.setUserInfo(userForStore);

    // 填充表单
    profileForm.username = userData.username;
    profileForm.email = userData.email;

    // 强制更新视图
    nextTick(() => {
      console.log(
        "ProfileView - 视图已更新，当前头像URL:",
        userStore.user?.avatar
      );
    });
  } catch (error) {
    console.error("获取用户信息失败", error);
    showNotification({
      title: "错误",
      content: "获取用户信息失败，请重新登录",
      type: "error",
    });
    router.push("/auth/login");
  }
});
</script>

<style scoped>
.profile-container {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.user-info-card {
  width: 100%;
  max-width: 1000px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.user-info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.user-name {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
}

.user-email {
  color: #86909c;
  margin-bottom: 24px;
  font-size: 16px;
}

.edit-button {
  padding: 0 24px;
  height: 40px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-bottom: 20px;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.avatar-upload {
  margin-bottom: 20px;
}

/* 自定义头像样式 */
.custom-avatar {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;
  background-color: #3370ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 48px;
  background-color: #3370ff;
}
</style>
