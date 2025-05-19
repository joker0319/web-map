const db = require('../config/database');

/**
 * 路线坐标模型
 * 处理route_coordinates表的CRUD操作
 */
class Coordinates {
  /**
   * 根据路线ID获取坐标
   * @param {Number} routeId - 路线ID
   * @returns {Promise<Object>} 坐标对象
   */
  static async getByRouteId(routeId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM route_coordinates WHERE route_id = ?',
        [routeId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      // 处理waypoints字段 - 从JSON转回对象
      const coordinate = rows[0];
      if (coordinate.waypoints && typeof coordinate.waypoints === 'string') {
        try {
          coordinate.waypoints = JSON.parse(coordinate.waypoints);
        } catch (e) {
          console.error('解析waypoints失败:', e);
          coordinate.waypoints = [];
        }
      }
      
      return {
        id: coordinate.id,
        routeId: coordinate.route_id,
        startName: coordinate.start_name,
        startLat: coordinate.start_lat,
        startLng: coordinate.start_lng,
        endName: coordinate.end_name,
        endLat: coordinate.end_lat,
        endLng: coordinate.end_lng,
        waypoints: coordinate.waypoints || [],
        // 同时保留原始字段名，便于调试
        route_id: coordinate.route_id,
        start_name: coordinate.start_name,
        start_lat: coordinate.start_lat,
        start_lng: coordinate.start_lng,
        end_name: coordinate.end_name,
        end_lat: coordinate.end_lat,
        end_lng: coordinate.end_lng
      };
    } catch (error) {
      console.error('获取路线坐标失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建坐标记录
   * @param {Object} coordinateData - 坐标数据
   * @returns {Promise<Object>} 创建的坐标记录
   */
  static async create(coordinateData) {
    try {
      console.log('创建坐标记录:', coordinateData);
      
      // 确保有必要的字段
      const requiredFields = ['route_id', 'start_lat', 'start_lng', 'end_lat', 'end_lng'];
      for (const field of requiredFields) {
        if (coordinateData[field] === undefined) {
          // 尝试从驼峰命名转换
          const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (coordinateData[camelCaseField] !== undefined) {
            coordinateData[field] = coordinateData[camelCaseField];
          } else {
            throw new Error(`缺少必要字段: ${field}`);
          }
        }
      }
      
      // 处理waypoints字段，确保其为JSON字符串
      let waypoints = coordinateData.waypoints || [];
      if (typeof waypoints !== 'string') {
        waypoints = JSON.stringify(waypoints);
      }
      
      // 构建插入SQL
      const insertSQL = `
        INSERT INTO route_coordinates (
          route_id, start_name, start_lat, start_lng, 
          end_name, end_lat, end_lng, waypoints
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(insertSQL, [
        coordinateData.route_id,
        coordinateData.start_name || '',
        coordinateData.start_lat,
        coordinateData.start_lng,
        coordinateData.end_name || '',
        coordinateData.end_lat,
        coordinateData.end_lng,
        waypoints
      ]);
      
      console.log('坐标创建结果:', result);
      
      // 返回创建的记录，包含ID
      return {
        id: result.insertId,
        ...coordinateData,
        waypoints: typeof coordinateData.waypoints === 'string' 
          ? JSON.parse(coordinateData.waypoints) 
          : coordinateData.waypoints
      };
    } catch (error) {
      console.error('创建坐标记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新坐标记录
   * @param {Number} routeId - 路线ID
   * @param {Object} coordinateData - 更新的坐标数据
   * @returns {Promise<Boolean>} 更新是否成功
   */
  static async update(routeId, coordinateData) {
    try {
      console.log('更新坐标记录:', {routeId, data: coordinateData});
      
      // 处理waypoints字段，确保其为JSON字符串
      let waypoints = coordinateData.waypoints || [];
      if (typeof waypoints !== 'string') {
        waypoints = JSON.stringify(waypoints);
      }
      
      // 构建更新SQL
      const updateSQL = `
        UPDATE route_coordinates SET 
          start_name = ?, start_lat = ?, start_lng = ?,
          end_name = ?, end_lat = ?, end_lng = ?,
          waypoints = ?
        WHERE route_id = ?
      `;
      
      const [result] = await db.query(updateSQL, [
        coordinateData.start_name || coordinateData.startName || '',
        coordinateData.start_lat || coordinateData.startLat,
        coordinateData.start_lng || coordinateData.startLng,
        coordinateData.end_name || coordinateData.endName || '',
        coordinateData.end_lat || coordinateData.endLat,
        coordinateData.end_lng || coordinateData.endLng,
        waypoints,
        routeId
      ]);
      
      console.log('坐标更新结果:', result);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新坐标记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 保存坐标记录（创建或更新）
   * @param {Number} routeId - 路线ID
   * @param {Object} coordinateData - 坐标数据
   * @returns {Promise<Object>} 保存的坐标记录
   */
  static async save(routeId, coordinateData) {
    try {
      // 检查是否已存在
      const [existing] = await db.query(
        'SELECT id FROM route_coordinates WHERE route_id = ?',
        [routeId]
      );
      
      // 确保设置了route_id
      coordinateData.route_id = routeId;
      
      if (existing.length > 0) {
        // 更新现有记录
        await this.update(routeId, coordinateData);
        return {
          ...coordinateData,
          id: existing[0].id
        };
      } else {
        // 创建新记录
        return await this.create(coordinateData);
      }
    } catch (error) {
      console.error('保存坐标记录失败:', error);
      throw error;
    }
  }
}

module.exports = Coordinates; 