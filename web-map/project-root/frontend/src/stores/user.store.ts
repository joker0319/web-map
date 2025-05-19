import { defineStore } from 'pinia';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isAdmin: boolean;
}

interface UserState {
  user: User | null;
  token: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: localStorage.getItem('auth_token') || null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  
  actions: {
    setUserInfo(user: User) {
      if (!user) {
        console.error("setUserInfo: 传入的用户数据为空!");
        return;
      }
      
      try {
        console.log("setUserInfo: 设置用户信息:", JSON.stringify(user));
        
        // 检查必须的字段
        if (user.id === undefined || !user.username) {
          console.error("setUserInfo: 用户数据缺少必要字段!", user);
          return;
        }
        
        // 深度克隆对象，避免引用问题
        this.user = JSON.parse(JSON.stringify(user));
        
        // 确保isAdmin字段存在
        if (this.user && this.user.isAdmin === undefined) {
          this.user.isAdmin = false;
        }
        
        // 更新localStorage
        localStorage.setItem('user_info', JSON.stringify(this.user));
        console.log("setUserInfo: 用户信息已更新到store和localStorage:", this.user);
      } catch (error) {
        console.error("setUserInfo: 更新用户信息时发生错误:", error);
      }
    },
    
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('auth_token', token);
    },
    
    login(token: string, user: any) {
      if (user.is_admin !== undefined && user.isAdmin === undefined) {
        user.isAdmin = !!user.is_admin;
      }
      
      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      console.log("登录后用户数据:", this.user);
    },
    
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    },
    
    clearUser() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('auth_token');
    },
    
    updateUser(userData: Partial<User>) {
      if (this.user) {
        this.user = {
          ...this.user,
          ...userData
        } as User;
      }
    },
    
    initFromStorage() {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user_info');
      
      if (token) {
        this.token = token;
        
        if (userStr && userStr !== "undefined" && userStr !== "null") {
          try {
            const user = JSON.parse(userStr);
            console.log("从本地存储加载的原始用户数据:", user);
            
            // 确保处理is_admin字段
            if (user.is_admin !== undefined && user.isAdmin === undefined) {
              user.isAdmin = !!user.is_admin;
            }
            
            // 使用完整替换而非引用赋值
            this.user = {...user};
            
            console.log("从存储恢复的用户数据:", this.user);
            
            // 再次检查头像
            if (user.avatar) {
              console.log("从存储恢复的头像URL:", user.avatar);
            } else {
              console.warn("存储中的头像URL为空");
            }
          } catch (e) {
            console.error('解析用户信息失败', e);
            localStorage.removeItem('user_info');
          }
        }
        
        if (!this.user) {
          console.log('令牌存在但用户信息无效，建议重新获取用户信息');
        }
      }
    }
  }
}); 