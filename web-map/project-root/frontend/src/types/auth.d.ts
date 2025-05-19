// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserInfo;
}

// 用户信息接口
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
} 