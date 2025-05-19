const db = require('../config/database');

class Post {
  // 根据ID查找帖子
  static async findById(id) {
    try {
      const [rows] = await db.query(`
        SELECT p.*, u.username as author_name, u.id as author_id, 
               COUNT(DISTINCT pl.id) as likes_count,
               COUNT(DISTINCT pc.id) as comments_count
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // 创建新帖子
  static async create(postData, userId) {
    try {
      // 插入帖子基本信息
      const [result] = await db.query(
        'INSERT INTO posts (title, content, summary, user_id, location) VALUES (?, ?, ?, ?, ?)',
        [
          postData.title, 
          postData.content, 
          postData.content.substring(0, 200) + (postData.content.length > 200 ? '...' : ''),
          userId,
          postData.location || null
        ]
      );
      
      const postId = result.insertId;
      
      // 如果有图片，插入图片信息
      if (postData.images && postData.images.length > 0) {
        const imageValues = postData.images.map((url, index) => [postId, url, index]);
        await db.query(
          'INSERT INTO post_images (post_id, image_url, sort_order) VALUES ?',
          [imageValues]
        );
      }
      
      return postId;
    } catch (error) {
      throw error;
    }
  }

  // 获取帖子列表（带分页和搜索）
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', userId = null } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT p.*, u.username as author_name, u.id as author_id, u.avatar as author_avatar,
               COUNT(DISTINCT pl.id) as likes_count,
               COUNT(DISTINCT pc.id) as comments_count,
               (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
      `;
      
      let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM posts p';
      let whereClause = '';
      let params = [userId || 0];
      
      if (search) {
        whereClause = ' WHERE p.title LIKE ? OR p.content LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += whereClause + ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      countQuery += whereClause;
      
      params.push(limit, offset);
      
      const [posts] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      
      return { 
        posts: posts.map(post => ({
          ...post,
          likes_count: parseInt(post.likes_count) || 0,
          comments_count: parseInt(post.comments_count) || 0,
          user_liked: post.user_liked > 0
        })), 
        total 
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除帖子
  static async delete(postId) {
    try {
      const [result] = await db.query('DELETE FROM posts WHERE id = ?', [postId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // 更新帖子
  static async update(postId, updateData) {
    try {
      const updates = [];
      const values = [];
      
      if (updateData.title) {
        updates.push('title = ?');
        values.push(updateData.title);
      }
      
      if (updateData.content) {
        updates.push('content = ?');
        values.push(updateData.content);
        
        updates.push('summary = ?');
        values.push(updateData.content.substring(0, 200) + (updateData.content.length > 200 ? '...' : ''));
      }
      
      if (updateData.location) {
        updates.push('location = ?');
        values.push(updateData.location);
      }
      
      if (updates.length === 0) {
        return false;
      }
      
      values.push(postId);
      
      const [result] = await db.query(
        `UPDATE posts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Post; 