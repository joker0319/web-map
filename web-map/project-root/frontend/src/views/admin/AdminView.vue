<template>
  <DefaultLayout>
    <div v-if="userStore.user?.isAdmin" class="admin-container">
      <!-- 顶部导航菜单 -->
      <div class="top-menu-container">
        <a-card class="admin-top-menu-card">
          <a-menu
            mode="horizontal"
            :selected-keys="[activeTab]"
            @menu-item-click="onMenuItemClick"
            style="border: none; width: 100%"
          >
            <a-menu-item key="posts">
              <template #icon><icon-file /></template>
              帖子管理
            </a-menu-item>
            <a-menu-item key="users">
              <template #icon><icon-user /></template>
              用户管理
            </a-menu-item>
            <a-menu-item key="routes">
              <template #icon><icon-location /></template>
              路线管理
            </a-menu-item>
          </a-menu>
        </a-card>
      </div>

      <!-- 内容区域 -->
      <a-card class="admin-content-card">
        <!-- 帖子管理 -->
        <div v-if="activeTab === 'posts'">
          <h2 class="admin-title">帖子管理</h2>

          <div class="table-operations">
            <a-space>
              <a-input-search
                v-model="postsSearchQuery"
                placeholder="搜索帖子标题"
                style="width: 240px"
                @search="handlePostsSearch"
              />
              <a-button
                v-if="postsTotal > postsPageSize"
                type="primary"
                @click="goToPostsPage(2)"
              >
                查看第2页(剩余{{ postsTotal - postsPageSize }}条)
              </a-button>
            </a-space>
          </div>

          <a-table
            :loading="postsLoading"
            :columns="postsColumns"
            :data="postsData"
            :pagination="{
              total: postsTotal,
              current: postsCurrentPage,
              pageSize: postsPageSize,
              showTotal: true,
              showPageSize: true,
              pageSizeOptions: [10, 20, 50, 100],
              pageSizeChangeResetCurrent: true,
            }"
            @page-change="handlePostsPageChange"
            @page-size-change="handlePostsPageSizeChange"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === '已发布' ? 'green' : 'gray'">
                {{ record.status }}
              </a-tag>
            </template>
            <template #operation="{ record }">
              <a-space>
                <a-popconfirm
                  content="确定要删除这个帖子吗？"
                  @ok="deletePost(record.id)"
                >
                  <a-button type="text" size="small" status="danger">
                    <icon-delete />
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </div>

        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'">
          <h2 class="admin-title">用户管理</h2>

          <div class="table-operations">
            <a-space>
              <a-input-search
                v-model="usersSearchQuery"
                placeholder="搜索用户名或邮箱"
                style="width: 240px"
                @search="handleUsersSearch"
              />
              <a-button
                v-if="usersTotal > usersPageSize"
                type="primary"
                @click="goToUsersPage(2)"
              >
                查看第2页(剩余{{ usersTotal - usersPageSize }}条)
              </a-button>
            </a-space>
          </div>
          <a-table
            :loading="usersLoading"
            :columns="usersColumns"
            :data="usersData"
            :pagination="{
              total: usersTotal,
              current: usersCurrentPage,
              pageSize: usersPageSize,
              showTotal: true,
              showPageSize: true,
              pageSizeOptions: [10, 20, 50, 100],
            }"
            @page-change="handleUsersPageChange"
            @page-size-change="handleUsersPageSizeChange"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === '正常' ? 'green' : 'red'">
                {{ record.status }}
              </a-tag>
            </template>
            <template #isAdmin="{ record }">
              <a-tag :color="record.isAdmin ? 'arcoblue' : 'gray'">
                {{ record.isAdmin ? "是" : "否" }}
              </a-tag>
            </template>
            <template #operation="{ record }">
              <a-space>
                <a-button
                  type="text"
                  size="small"
                  @click="viewUserDetail(record.id)"
                >
                  <icon-eye />
                </a-button>
                <a-popconfirm
                  content="确定要删除这个用户吗？"
                  @ok="deleteUser(record.id)"
                >
                  <a-button type="text" size="small" status="danger">
                    <icon-delete />
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </div>

        <!-- 路线管理 -->
        <div v-if="activeTab === 'routes'">
          <h2 class="admin-title">路线管理</h2>

          <!-- 模拟数据提示条 -->
          <a-alert
            v-if="routesDataSource === 'mock'"
            type="info"
            closable
            title="使用模拟数据"
            content="由于数据库连接问题，当前显示的是模拟数据。"
            style="margin-bottom: 16px"
          >
            <template #action>
              <a-button type="primary" size="mini" @click="() => loadRoutes()">
                尝试重新连接
              </a-button>
            </template>
          </a-alert>

          <div class="table-operations">
            <a-space>
              <a-input-search
                v-model="routesSearchQuery"
                placeholder="搜索路线名称"
                style="width: 240px"
                @search="handleRoutesSearch"
              />
              <a-button
                v-if="routesTotal > routesPageSize"
                type="primary"
                @click="goToRoutesPage(2)"
              >
                查看第2页(剩余{{ routesTotal - routesPageSize }}条)
              </a-button>
              <a-button
                v-if="routesLoadError"
                type="outline"
                status="warning"
                @click="() => loadRoutes()"
              >
                <template #icon><icon-refresh /></template>
                重新加载
              </a-button>
            </a-space>
          </div>

          <!-- 错误提示区域 -->
          <a-alert
            v-if="routesLoadError"
            type="warning"
            closable
            :title="'加载失败 (已尝试' + routesRetryCount + '次)'"
            :content="
              routesErrorMessage || '服务器返回错误，请检查网络连接或联系管理员'
            "
            style="margin-bottom: 16px"
          >
            <template #action>
              <a-space>
                <a-button
                  type="text"
                  @click="
                    () => {
                      console.log('打开帮助');
                      Message.info('请联系管理员检查后端服务');
                    }
                  "
                >
                  帮助
                </a-button>
                <a-button
                  type="primary"
                  size="mini"
                  @click="() => loadRoutes()"
                >
                  重试
                </a-button>
              </a-space>
            </template>
          </a-alert>

          <a-table
            :loading="routesLoading"
            :columns="routesColumns"
            :data="routesData"
            :pagination="{
              total: routesTotal,
              current: routesCurrentPage,
              pageSize: routesPageSize,
              showTotal: true,
              showPageSize: true,
              pageSizeOptions: [10, 20, 50, 100],
            }"
            @page-change="handleRoutesPageChange"
            @page-size-change="handleRoutesPageSizeChange"
          >
            <template #difficulty="{ record }">
              <a-tag :color="getDifficultyColor(record.difficulty)">
                {{ record.difficulty }}
              </a-tag>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === '已发布' ? 'green' : 'gray'">
                {{ record.status }}
              </a-tag>
            </template>
            <template #operation="{ record }">
              <a-space>
                <a-button
                  type="text"
                  size="small"
                  @click="viewRouteDetail(record.id)"
                >
                  <icon-eye />
                </a-button>
                <a-popconfirm
                  content="确定要删除这个路线吗？"
                  @ok="deleteRoute(record.id)"
                >
                  <a-button type="text" size="small" status="danger">
                    <icon-delete />
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </div>
      </a-card>
    </div>
    <div v-else class="no-permission">
      <a-result status="403" title="403" subtitle="抱歉，您没有权限访问此页面">
        <template #extra>
          <a-button type="primary" @click="router.push('/home')">
            返回首页
          </a-button>
        </template>
      </a-result>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import { useUserStore } from "../../stores/user.store";
import { useNotification } from "../../composables/useNotification";
import {
  adminService,
  type AdminPost,
  type AdminUser,
  type AdminRoute,
} from "../../services/admin.service";
import {
  IconFile,
  IconUser,
  IconLocation,
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
  IconRefresh,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";

defineOptions({
  name: "AdminView",
});

const router = useRouter();
const userStore = useUserStore();
const { showNotification } = useNotification();

// 当前选中的菜单项
const activeTab = ref("posts");

// 菜单点击事件处理
const onMenuItemClick = (key: string) => {
  console.log(`菜单项点击: ${key}`);
  activeTab.value = key;
  loadTabData(key);
};

// 根据标签加载数据
const loadTabData = (tab: string) => {
  console.log(`开始加载${tab}数据`);

  if (tab === "posts") {
    loadPosts();
  } else if (tab === "users") {
    console.log("调用loadUsers()函数");
    loadUsers();
  } else if (tab === "routes") {
    console.log("调用loadRoutes()函数");
    loadRoutes();
  } else {
    console.error(`未知的标签类型: ${tab}`);
  }
};

// 检查权限并初始化
onMounted(() => {
  console.log("管理页面已挂载");

  if (!userStore.user?.isAdmin) {
    console.warn("用户没有管理员权限");
    showNotification({
      title: "无权限",
      content: "您没有管理员权限",
      type: "error",
    });
  } else {
    console.log("用户具有管理员权限，开始初始化");

    // 设置初始标签并加载数据
    activeTab.value = "posts";
    loadPosts();

    // 预加载其他标签数据
    setTimeout(() => {
      console.log("预加载用户数据");
      loadUsers();
    }, 500);

    setTimeout(() => {
      console.log("预加载路线数据");
      loadRoutes();
    }, 1000);
  }
});

// =========== 帖子管理 ===========
const postsLoading = ref(false);
const postsData = ref<AdminPost[]>([]);
const postsTotal = ref(0);
const postsCurrentPage = ref(1);
const postsPageSize = ref(10);
const postsSearchQuery = ref("");

// 获取帖子列表
const loadPosts = async () => {
  postsLoading.value = true;
  try {
    console.log("开始加载帖子数据...");
    const result = await adminService.getPosts(
      postsCurrentPage.value,
      postsPageSize.value,
      postsSearchQuery.value
    );

    console.log("收到帖子数据响应:", result);

    // 直接使用返回的数据
    if (result && Array.isArray(result.data)) {
      postsData.value = result.data;
      postsTotal.value = result.total || 0;
      console.log(`帖子数据已加载，条数: ${postsData.value.length}`);

      // 打印第一条数据，用于调试
      if (postsData.value.length > 0) {
        console.log("第一条数据示例:", postsData.value[0]);
      }
    } else {
      console.error("返回数据格式不符合预期:", result);
      postsData.value = [];
      postsTotal.value = 0;
    }
  } catch (error) {
    console.error("加载帖子列表失败:", error);
    Message.error("加载帖子列表失败");
    postsData.value = [];
    postsTotal.value = 0;
  } finally {
    postsLoading.value = false;
  }
};

// 帖子分页变化
const handlePostsPageChange = (page: number) => {
  postsCurrentPage.value = page;
  loadPosts();
};

// 帖子每页条数变化
const handlePostsPageSizeChange = (pageSize: number) => {
  postsPageSize.value = pageSize;
  // 计算合适的页码，保持数据连续性
  const currentStart = (postsCurrentPage.value - 1) * postsPageSize.value + 1;
  postsCurrentPage.value = Math.max(1, Math.ceil(currentStart / pageSize));
  loadPosts();
};

// 帖子搜索
const handlePostsSearch = () => {
  postsCurrentPage.value = 1;
  loadPosts();
};

// 查看帖子详情
const viewPostDetail = (postId: number) => {
  router.push(`/forum/post/${postId}`);
};

// 删除帖子
const deletePost = async (postId: number) => {
  try {
    console.log(`请求删除帖子 ID: ${postId}`);
    const success = await adminService.deletePost(postId);

    console.log(`删除帖子结果: ${success}`);

    if (success) {
      // 从当前列表中移除该帖子（无需重新加载整个列表）
      postsData.value = postsData.value.filter((post) => post.id !== postId);

      // 显示成功消息
      Message.success("帖子删除成功");

      // 如果当前页面已空，且不是第一页，则加载前一页
      if (postsData.value.length === 0 && postsCurrentPage.value > 1) {
        postsCurrentPage.value--;
        loadPosts();
      } else if (postsData.value.length === 0) {
        // 如果是第一页且为空，重新加载
        loadPosts();
      }
    } else {
      Message.error("帖子删除失败");
    }
  } catch (error) {
    console.error("删除帖子失败:", error);
    Message.error("删除帖子过程中出现错误，请刷新页面查看最新状态");
  }
};

// 帖子表格列定义
const postsColumns = [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
  },
  {
    title: "标题",
    dataIndex: "title",
  },
  {
    title: "作者",
    dataIndex: "author.name",
    render: ({ record }: { record: any }) => {
      return record.author ? record.author.name : "未知";
    },
  },
  {
    title: "发布时间",
    dataIndex: "createTime",
    render: ({ record }: { record: any }) => {
      // 格式化日期
      if (!record.createTime) return "未知";
      const date = new Date(record.createTime);
      return date.toLocaleString();
    },
  },
  {
    title: "点赞数",
    dataIndex: "likes",
    width: 80,
  },
  {
    title: "评论数",
    dataIndex: "comments",
    width: 80,
  },
  {
    title: "状态",
    dataIndex: "status",
    slotName: "status",
    width: 100,
  },
  {
    title: "操作",
    width: 120,
    slotName: "operation",
  },
];

// =========== 用户管理 ===========
const usersLoading = ref(false);
const usersData = ref<AdminUser[]>([]);
const usersTotal = ref(0);
const usersCurrentPage = ref(1);
const usersPageSize = ref(10);
const usersSearchQuery = ref("");

// 获取用户列表 - 修复逻辑，确保数据正确加载
const loadUsers = async () => {
  console.log("开始加载用户列表...");
  console.log(
    `当前页码: ${usersCurrentPage.value}, 每页条数: ${usersPageSize.value}`
  );

  usersLoading.value = true;
  try {
    const result = await adminService.getUsers(
      usersCurrentPage.value,
      usersPageSize.value,
      usersSearchQuery.value
    );

    console.log("获取用户数据成功:", result);

    if (result && Array.isArray(result.data)) {
      usersData.value = result.data;
      usersTotal.value = result.total;
      console.log(
        `用户数据已加载，数量:${usersData.value.length}, 总数:${usersTotal.value}`
      );

      // 如果有数据，打印第一条用于调试
      if (usersData.value.length > 0) {
        console.log("第一个用户数据:", usersData.value[0]);
      }
    } else {
      console.error("用户数据格式不正确:", result);
      usersData.value = [];
      usersTotal.value = 0;
    }
  } catch (error) {
    console.error("加载用户列表失败:", error);
    Message.error("加载用户列表失败");
    usersData.value = [];
    usersTotal.value = 0;
  } finally {
    usersLoading.value = false;
  }
};

// 用户分页变化
const handleUsersPageChange = (page: number) => {
  usersCurrentPage.value = page;
  loadUsers();
};

// 用户每页条数变化
const handleUsersPageSizeChange = (pageSize: number) => {
  usersPageSize.value = pageSize;
  // 计算合适的页码，保持数据连续性
  const currentStart = (usersCurrentPage.value - 1) * usersPageSize.value + 1;
  usersCurrentPage.value = Math.max(1, Math.ceil(currentStart / pageSize));
  loadUsers();
};

// 用户搜索
const handleUsersSearch = () => {
  usersCurrentPage.value = 1;
  loadUsers();
};

// 查看用户详情
const viewUserDetail = (userId: number) => {
  router.push(`/users/${userId}`);
};

// 删除用户
const deleteUser = async (userId: number) => {
  try {
    console.log(`请求删除用户 ID: ${userId}`);
    const success = await adminService.deleteUser(userId);

    console.log(`删除用户结果: ${success}`);

    // 从当前列表中移除该用户（无需重新加载整个列表）
    usersData.value = usersData.value.filter((user) => user.id !== userId);

    // 显示成功消息
    Message.success("用户删除成功");

    // 如果当前页面已空，且不是第一页，则加载前一页
    if (usersData.value.length === 0 && usersCurrentPage.value > 1) {
      usersCurrentPage.value--;
      loadUsers();
    } else if (usersData.value.length === 0) {
      // 如果是第一页且为空，重新加载
      loadUsers();
    }
  } catch (error) {
    console.error("删除用户失败:", error);
    Message.error("删除用户过程中出现错误，请刷新页面查看最新状态");
  }
};

// 用户表格列定义
const usersColumns = [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
  },
  {
    title: "用户名",
    dataIndex: "username",
  },
  {
    title: "邮箱",
    dataIndex: "email",
  },
  {
    title: "注册时间",
    dataIndex: "createTime",
  },
  {
    title: "状态",
    dataIndex: "status",
    slotName: "status",
    width: 80,
  },
  {
    title: "管理员",
    dataIndex: "isAdmin",
    slotName: "isAdmin",
    width: 80,
  },
  {
    title: "操作",
    width: 120,
    slotName: "operation",
  },
];

// =========== 路线管理 ===========
const routesLoading = ref(false);
const routesData = ref<AdminRoute[]>([]);
const routesTotal = ref(0);
const routesCurrentPage = ref(1);
const routesPageSize = ref(10);
const routesSearchQuery = ref("");
const routesLoadError = ref(false);
const routesErrorMessage = ref("");
const routesRetryCount = ref(0);
const routesDataSource = ref<"database" | "mock">("database"); // 数据来源：真实数据库或模拟数据

// 获取路线列表 - 修复逻辑，确保数据正确加载
const loadRoutes = async (isRetry = false) => {
  // 重置错误状态
  if (!isRetry) {
    routesLoadError.value = false;
    routesErrorMessage.value = "";
  }

  console.log("开始加载路线列表...");
  console.log(
    `当前页码: ${routesCurrentPage.value}, 每页条数: ${routesPageSize.value}, 重试次数: ${routesRetryCount.value}`
  );

  routesLoading.value = true;
  try {
    const result = await adminService.getRoutes(
      routesCurrentPage.value,
      routesPageSize.value,
      routesSearchQuery.value
    );

    console.log("获取路线数据成功:", result);

    // 重置重试计数
    routesRetryCount.value = 0;

    // 检查数据来源
    if (result.isRealData === false) {
      routesDataSource.value = "mock";
      console.log("使用的是模拟数据");
    } else {
      routesDataSource.value = "database";
      console.log("使用的是真实数据库数据");
    }

    if (result && Array.isArray(result.data)) {
      routesData.value = result.data;
      routesTotal.value = result.total;
      console.log(
        `路线数据已加载，数量:${routesData.value.length}, 总数:${routesTotal.value}`
      );

      // 如果有数据，打印第一条用于调试
      if (routesData.value.length > 0) {
        console.log("第一条路线数据:", routesData.value[0]);
      }
    } else {
      console.error("路线数据格式不正确:", result);
      routesData.value = [];
      routesTotal.value = 0;

      // 显示友好的空数据提示
      routesLoadError.value = true;
      routesErrorMessage.value = "暂无路线数据，可能服务器返回了空数据";
    }
  } catch (error) {
    console.error("加载路线列表失败:", error);

    // 增强错误消息
    let errorMsg = "加载路线列表失败";
    if (error instanceof Error) {
      errorMsg += `: ${error.message}`;
    }

    Message.error(errorMsg);
    routesData.value = [];
    routesTotal.value = 0;

    // 设置错误状态
    routesLoadError.value = true;
    routesErrorMessage.value = errorMsg;

    // 自动重试逻辑 (最多重试3次)
    if (routesRetryCount.value < 3) {
      routesRetryCount.value++;
      console.log(`将在3秒后进行第${routesRetryCount.value}次重试...`);
      setTimeout(() => {
        loadRoutes(true);
      }, 3000);
    }
  } finally {
    routesLoading.value = false;
  }
};

// 路线分页变化
const handleRoutesPageChange = (page: number) => {
  routesCurrentPage.value = page;
  loadRoutes();
};

// 路线每页条数变化
const handleRoutesPageSizeChange = (pageSize: number) => {
  routesPageSize.value = pageSize;
  // 计算合适的页码，保持数据连续性
  const currentStart = (routesCurrentPage.value - 1) * routesPageSize.value + 1;
  routesCurrentPage.value = Math.max(1, Math.ceil(currentStart / pageSize));
  loadRoutes();
};

// 路线搜索
const handleRoutesSearch = () => {
  routesCurrentPage.value = 1;
  loadRoutes();
};

// 查看路线详情
const viewRouteDetail = (routeId: number) => {
  router.push(`/hiking-routes/${routeId}`);
};

// 删除路线
const deleteRoute = async (routeId: number) => {
  try {
    console.log(`请求删除路线 ID: ${routeId}`);
    const success = await adminService.deleteRoute(routeId);

    console.log(`删除路线结果: ${success}`);

    // 从当前列表中移除该路线（无需重新加载整个列表）
    routesData.value = routesData.value.filter((route) => route.id !== routeId);

    // 显示成功消息
    Message.success("路线删除成功");

    // 如果当前页面已空，且不是第一页，则加载前一页
    if (routesData.value.length === 0 && routesCurrentPage.value > 1) {
      routesCurrentPage.value--;
      loadRoutes();
    } else if (routesData.value.length === 0) {
      // 如果是第一页且为空，重新加载
      loadRoutes();
    }
  } catch (error) {
    console.error("删除路线失败:", error);
    Message.error("删除路线过程中出现错误，请刷新页面查看最新状态");
  }
};

// 获取难度对应的颜色
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case "简单":
      return "green";
    case "中等":
      return "orange";
    case "困难":
      return "red";
    default:
      return "gray";
  }
};

// 路线表格列定义
const routesColumns = [
  {
    title: "ID",
    dataIndex: "id",
    width: 70,
  },
  {
    title: "路线名称",
    dataIndex: "name",
  },
  {
    title: "难度",
    dataIndex: "difficulty",
    slotName: "difficulty",
    width: 80,
  },
  {
    title: "长度(km)",
    dataIndex: "length",
    width: 100,
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
  },
  {
    title: "状态",
    dataIndex: "status",
    slotName: "status",
    width: 80,
  },
  {
    title: "操作",
    width: 120,
    slotName: "operation",
  },
];

// 添加直接跳转到指定用户页的方法
const goToUsersPage = (page: number) => {
  console.log(`直接跳转到用户管理第${page}页`);
  usersCurrentPage.value = page;
  loadUsers();
};

// 添加直接跳转到指定路线页的方法
const goToRoutesPage = (page: number) => {
  console.log(`直接跳转到路线管理第${page}页`);
  routesCurrentPage.value = page;
  loadRoutes();
};

// 添加帖子管理中的跳转到第二页按钮
const goToPostsPage = (page: number) => {
  console.log(`直接跳转到帖子管理第${page}页`);
  postsCurrentPage.value = page;
  loadPosts();
};
</script>

<style scoped>
.admin-container {
  padding: 20px 0;
}

.top-menu-container {
  margin-bottom: 16px;
}

.admin-top-menu-card,
.admin-content-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.admin-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 20px;
  color: #1d2129;
}

.section-title {
  margin-top: 20px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #1d2129;
}

.table-operations {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}

.no-permission {
  padding: 40px 0;
}
</style> 