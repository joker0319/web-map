import { request } from '../utils/request';

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000';

export const userService = {
  /**
   * 更新用户资料（包括头像）
   */
  async updateProfile(formData: FormData) {
    console.log("更新个人资料请求开始");
    const response = await request({
      url: `${API_BASE_URL}/api/users/profile`,
      method: 'PUT',
      data: formData,
      headers: {
        // 不要手动设置 Content-Type，让浏览器自动设置为 multipart/form-data
      }
    });
    console.log("更新个人资料请求完成:", response);
    return response;
  },

  /**
   * 获取用户资料
   */
  async getUserProfile() {
    console.log("获取用户资料请求开始");
    const response = await request({
      url: `${API_BASE_URL}/api/users/profile`,
      method: 'GET'
    });
    console.log("获取用户资料请求完成:", response);
    return response;
  },

  /**
   * 上传头像
   * 注意：头像上传通过a-upload组件直接处理，这里不需要额外方法
   */
};
