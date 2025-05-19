const db = require('../config/database');

class Article {
  // 获取所有文章
  static async getAll(limit = 10, offset = 0, filters = {}) {
    try {
      let query = `SELECT a.*, u.username as author, u.avatar as authorAvatar 
                   FROM articles a
                   LEFT JOIN users u ON a.user_id = u.id
                   WHERE 1=1`;
      
      const queryParams = [];
      
      // 处理分类筛选
      if (filters.category) {
        query += ' AND a.category = ?';
        queryParams.push(filters.category);
      }
      
      // 处理时间筛选
      if (filters.timeFilter) {
        const now = new Date();
        let timeAgo;
        
        if (filters.timeFilter === 'week') {
          timeAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filters.timeFilter === 'month') {
          timeAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (filters.timeFilter === 'year') {
          timeAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }
        
        if (timeAgo) {
          query += ' AND a.created_at >= ?';
          queryParams.push(timeAgo);
        }
      }
      
      // 处理搜索查询
      if (filters.searchQuery) {
        query += ' AND (a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)';
        const searchParam = `%${filters.searchQuery}%`;
        queryParams.push(searchParam, searchParam, searchParam);
      }
      
      // 添加排序和分页
      query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await db.query(query, queryParams);
      return rows;
    } catch (error) {
      console.error('获取文章失败:', error);
      throw error;
    }
  }

  // 获取热门文章（浏览量最高的）
  static async getPopular(limit = 3) {
    try {
      const query = `SELECT a.*, u.username as author, u.avatar as authorAvatar 
                    FROM articles a
                    LEFT JOIN users u ON a.user_id = u.id
                    ORDER BY a.views DESC LIMIT ?`;
      const [rows] = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      console.error('获取热门文章失败:', error);
      throw error;
    }
  }

  // 根据ID获取文章详情
  static async getById(id) {
    try {
      const query = `SELECT a.*, u.username as author, u.avatar as authorAvatar 
                    FROM articles a
                    LEFT JOIN users u ON a.user_id = u.id
                    WHERE a.id = ?`;
      const [rows] = await db.query(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // 更新阅读量
      await this.incrementViews(id);
      
      return rows[0];
    } catch (error) {
      console.error('获取文章详情失败:', error);
      throw error;
    }
  }

  // 创建新文章
  static async create(articleData) {
    try {
      const { title, content, summary, category, image, user_id } = articleData;
      
      const query = `INSERT INTO articles (title, content, summary, category, image, user_id) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
      
      const [result] = await db.query(query, [title, content, summary, category, image, user_id]);
      return result.insertId;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }

  // 更新文章
  static async update(id, articleData) {
    try {
      const { title, content, summary, category, image } = articleData;
      
      const query = `UPDATE articles SET title = ?, content = ?, summary = ?, category = ?, image = ?
                    WHERE id = ?`;
      
      const [result] = await db.query(query, [title, content, summary, category, image, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  }

  // 删除文章
  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM articles WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  }

  // 更新文章阅读量
  static async incrementViews(id) {
    try {
      await db.query('UPDATE articles SET views = views + 1 WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('更新阅读量失败:', error);
      return false;
    }
  }
}

module.exports = Article; 