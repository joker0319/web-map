import { request } from '@/utils/request';
import type { LoginRequest, LoginResponse, UserInfo, RegisterRequest } from '@/types/auth';

/**
 * 认证相关API服务
 */
class AuthService {
  /**
   * 用户登录
   * @param loginData 登录数据
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    return request({
      url: 'http://localhost:3000/api/auth/login',
      method: 'POST',
      data: loginData
    });
  }

  /**
   * 用户注册
   * @param registerData 注册数据
   */
  async register(registerData: RegisterRequest): Promise<void> {
    return request({
      url: 'http://localhost:3000/api/auth/register',
      method: 'POST',
      data: registerData
    });
  }

  /**
   * 用户注销
   */
  async logout(): Promise<void> {
    return request({
      url: 'http://localhost:3000/api/auth/logout',
      method: 'POST'
    });
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo> {
    return request({
      url: 'http://localhost:3000/api/auth/me',
      method: 'GET'
    });
  }

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return request({
      url: 'http://localhost:3000/api/auth/refresh-token',
      method: 'POST',
      data: { refreshToken }
    });
  }
}

export const authService = new AuthService(); 