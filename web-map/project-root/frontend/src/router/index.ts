import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import NotFound from '@/views/NotFound.vue';

// 使用异步组件加载主页和地图页
const HomeView = () => import('@/views/home/HomeView.vue');
const MapView = () => import('@/views/map/MapView.vue');
const DashboardView = () => import('@/views/dashboard/DashboardView.vue');
const ForumView = () => import('@/views/forum/ForumView.vue');
const MessageView = () => import('@/views/message/MessageView.vue');
const ProfileView = () => import('@/views/profile/ProfileView.vue');
const SettingsView = () => import('@/views/profile/SettingView.vue');
const ArticlesView = () => import('@/views/articles/ArticlesView.vue');

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: RegisterView,
    meta: {
      requiresAuth: false,
      title: '注册'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: false,
      title: '主页'
    }
  },
  {
    path: '/map',
    name: 'Map',
    component: MapView,
    meta: {
      requiresAuth: false,
      title: '户外徒步地图'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: false,
      title: '徒步路线'
    }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: ArticlesView,
    meta: {
      requiresAuth: false,
      title: '徒步资讯'
    }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: ForumView,
    meta: {
      requiresAuth: false,
      title: '徒步交流论坛'
    }
  },
  {
    path: '/message',
    name: 'Message',
    component: MessageView,
    meta: {
      requiresAuth: false,
      title: '我的消息'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
      title: '个人中心'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      requiresAuth: true,
      title: '账号设置'
    }
  },
  {
    path: '/ai-assistant',
    name: 'ai-assistant',
    component: () => import('../views/assistant/AiAssistantView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin/AdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '管理中心'
    }
  },
  {
    path: '/forum/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/forum/PostDetailView.vue'),
    meta: {
      requiresAuth: false,
      title: '帖子详情'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      requiresAuth: false,
      title: '页面未找到'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || '应用系统';
  
  // 检查路由是否需要认证或管理员权限
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  
  if (requiresAuth || requiresAdmin) {
    // 获取用户状态
    const userStore = useUserStore();
    
    if (!userStore.isLoggedIn) {
      // 用户未登录，重定向到登录页
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      });
    } else if (requiresAdmin && !userStore.user?.isAdmin) {
      // 需要管理员权限但用户不是管理员
      next({ path: '/home' });
    } else {
      // 用户已登录且权限满足要求，允许访问
      next();
    }
  } else {
    // 不需要认证的路由，直接访问
    next();
  }
});

export default router; 