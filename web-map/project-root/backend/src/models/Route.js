const db = require('../config/database');

class Route {
  // 根据ID查找路线
  static async findById(id) {
    try {
      const [rows] = await db.query(`
        SELECT r.*, u.username as creator_name, u.id as creator_id
        FROM hiking_routes r
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // 创建新路线
  static async create(routeData, userId) {
    try {
      // 插入路线基本信息
      const [result] = await db.query(
        `INSERT INTO hiking_routes (
          name, description, difficulty, length, elevation, duration, 
          location, coordinates, creator_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          routeData.name,
          routeData.description,
          routeData.difficulty,
          routeData.length,
          routeData.elevation,
          routeData.duration,
          routeData.location,
          JSON.stringify(routeData.coordinates),
          userId,
          routeData.status || '已发布'
        ]
      );
      
      const routeId = result.insertId;
      
      // 如果有图片，插入图片信息
      if (routeData.images && routeData.images.length > 0) {
        const imageValues = routeData.images.map((url, index) => [routeId, url, index]);
        await db.query(
          'INSERT INTO route_images (route_id, image_url, sort_order) VALUES ?',
          [imageValues]
        );
      }
      
      return routeId;
    } catch (error) {
      throw error;
    }
  }

  // 获取路线列表（带分页和搜索）
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', difficulty = null } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT r.*, u.username as creator_name, u.id as creator_id
        FROM hiking_routes r
        LEFT JOIN users u ON r.creator_id = u.id
      `;
      
      let countQuery = 'SELECT COUNT(*) as total FROM hiking_routes r';
      let whereConditions = [];
      let params = [];
      
      if (search) {
        whereConditions.push('(r.name LIKE ? OR r.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (difficulty) {
        whereConditions.push('r.difficulty = ?');
        params.push(difficulty);
      }
      
      if (whereConditions.length > 0) {
        const whereClause = ' WHERE ' + whereConditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }
      
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      
      params.push(limit, offset);
      
      const [routes] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      
      return { routes, total };
    } catch (error) {
      throw error;
    }
  }

  // 删除路线
  static async delete(routeId) {
    try {
      const [result] = await db.query('DELETE FROM hiking_routes WHERE id = ?', [routeId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // 更新路线
  static async update(routeId, updateData) {
    try {
      const updates = [];
      const values = [];
      
      const allowedFields = [
        'name', 'description', 'difficulty', 'length', 
        'elevation', 'duration', 'location', 'coordinates', 'status'
      ];
      
      // 构建更新字段
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(field === 'coordinates' ? JSON.stringify(updateData[field]) : updateData[field]);
        }
      }
      
      if (updates.length === 0) {
        return false;
      }
      
      values.push(routeId);
      
      // 执行更新
      const [result] = await db.query(
        `UPDATE hiking_routes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Route; 