/**
 * 坐标服务
 * 处理路线坐标的保存和获取
 */
import axios from 'axios';

// API基础URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 坐标服务
 */
const coordinatesService = {
  /**
   * 保存坐标到服务器(简化版API)
   * 用于故障转移，仅接收数据但不依赖数据库操作
   * @param {Object} coordinates 坐标数据
   * @returns {Promise<Object>} 响应结果
   */
  async saveCoordinatesSimple(coordinates) {
    try {
      console.log('简化API: 发送坐标数据:', coordinates);
      const response = await axios.post(`${API_URL}/hiking-routes/coordinates/simple`, coordinates);
      console.log('简化API响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('简化API错误:', error);
      // 如果API调用失败，尝试保存到localStorage
      this.saveToLocalStorage(coordinates);
      throw error;
    }
  },

  /**
   * 保存坐标到本地存储
   * @param {Object} coordinates 坐标数据
   */
  saveToLocalStorage(coordinates) {
    try {
      const storageKey = 'hiking-route-coordinates';
      let savedCoordinates = {};
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        savedCoordinates = JSON.parse(savedData);
      }

      // 更新当前路线的坐标
      savedCoordinates = {
        ...savedCoordinates,
        [coordinates.routeId || coordinates.route_id]: coordinates
      };

      // 保存到localStorage
      localStorage.setItem(storageKey, JSON.stringify(savedCoordinates));
      console.log(`坐标数据已手动保存到localStorage, routeId=${coordinates.routeId || coordinates.route_id}`);
      
      return {
        success: true,
        message: '坐标已保存到本地存储',
        data: coordinates
      };
    } catch (e) {
      console.error('本地存储保存失败:', e);
      throw e;
    }
  },

  /**
   * 从本地存储获取坐标
   * @param {number} routeId 路线ID
   * @returns {Object|null} 坐标数据
   */
  getFromLocalStorage(routeId) {
    try {
      const storageKey = 'hiking-route-coordinates';
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const savedCoordinates = JSON.parse(savedData);
        return savedCoordinates[routeId] || null;
      }
      
      return null;
    } catch (e) {
      console.error('从本地存储获取坐标失败:', e);
      return null;
    }
  }
};

export default coordinatesService; 