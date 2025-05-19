import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStorage } from '@vueuse/core';
import { useNotification } from './useNotification';
import { authService } from '@/services/auth.service';
import type { LoginRequest, LoginResponse } from '@/types/auth';

// 导入用户store时避免循环依赖
export function useAuth() {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // 用户状态
  const token = useStorage('auth_token', '');
  const refreshToken = useStorage('refresh_token', '');
  const isAuthenticated = computed(() => !!token.value);
  
  // 加载状态
  const isLoading = ref(false);
  
  /**
   * 登录方法
   */
  const login = async (username: string, password: string) => {
    isLoading.value = true;
    
    try {
      // 打印响应以检查结构
      const response = await authService.login(username, password);
      console.log("登录响应:", response);
      
      // 直接使用响应对象，不要尝试访问.data
      const userData = response.user;
      const tokenValue = response.token;
      
      if (!userData || !tokenValue) {
        throw new Error("登录响应格式无效");
      }
      
      // 延迟导入避免循环依赖
      const { useUserStore } = await import('@/stores/user.store');
      const userStore = useUserStore();
      
      // 正确存储用户信息和令牌
      userStore.login(tokenValue, userData);
      
      router.push("/home");
    } catch (error: any) {
      console.error("登录失败:", error);
      showNotification({
        title: "登录失败",
        content: error.message || "用户名或密码错误",
        type: "error"
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 注销方法
   */
  const logout = async () => {
    isLoading.value = true;
    
    try {
      // 调用注销API
      await authService.logout();
    } catch (error) {
      console.error('注销失败:', error);
    } finally {
      // 延迟导入避免循环依赖
      const { useUserStore } = await import('@/stores/user.store');
      const userStore = useUserStore();
      
      // 清除令牌和用户数据
      token.value = '';
      refreshToken.value = '';
      userStore.clearUser();
      
      // 重定向到登录页
      router.push('/auth/login');
      isLoading.value = false;
    }
  };
  
  /**
   * 检查认证状态
   */
  const checkAuth = async () => {
    if (!token.value) return false;
    
    try {
      const user = await authService.getCurrentUser();
      
      // 延迟导入避免循环依赖
      const { useUserStore } = await import('@/stores/user.store');
      const userStore = useUserStore();
      
      userStore.setUserInfo({
        ...user,
        id: Number(user.id)
      });
      return true;
    } catch (error) {
      console.error('验证令牌失败:', error);
      token.value = '';
      refreshToken.value = '';
      
      // 延迟导入避免循环依赖
      const { useUserStore } = await import('@/stores/user.store');
      const userStore = useUserStore();
      
      userStore.clearUser();
      return false;
    }
  };
  
  return {
    login,
    logout,
    checkAuth,
    isAuthenticated,
    isLoading
  };
} 