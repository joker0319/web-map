/**
 * API配置文件
 */

// API基础URL
export const API_BASE_URL = 'http://localhost:3000/api';

// API路径
export const API_PATHS = {
  // 徒步路线相关
  HIKING_ROUTES: {
    GET_ALL: `${API_BASE_URL}/hiking-routes`,
    GET_POPULAR: `${API_BASE_URL}/hiking-routes/popular`,
    GET_BY_ID: (id: number) => `${API_BASE_URL}/hiking-routes/${id}`,
    GET_COORDINATES: (id: number) => `${API_BASE_URL}/hiking-routes/${id}/coordinates`,
    SAVE_COORDINATES: `${API_BASE_URL}/hiking-routes/coordinates`,
    UPDATE_COORDINATES: (id: number) => `${API_BASE_URL}/hiking-routes/${id}/coordinates`,
  },

  // 用户相关
  USER: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    PROFILE: `${API_BASE_URL}/user/profile`,
  },
};

// API超时设置（毫秒）
export const API_TIMEOUT = 10000; 