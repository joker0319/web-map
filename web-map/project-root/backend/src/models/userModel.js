const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // 根据ID查找用户
  static async findById(id) {
    try {
      const [rows] = await db.query(
        'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
    return rows.length ? rows[0] : null;
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
    return rows.length ? rows[0] : null;
  }

  // 创建新用户
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [result] = await db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [userData.username, userData.email, hashedPassword]
      );
      return result.insertId;
  }
  
  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 更新用户头像
  static async updateAvatar(userId, avatarPath) {
    const [result] = await db.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, userId]
    );
    return result;
  }

  // 更新用户资料
  static async updateProfile(userId, username, avatarUrl) {
    try {
      // 只在有头像时更新头像
      if (avatarUrl) {
        await db.query(
          'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
          [username, avatarUrl, userId]
        );
      } else {
        // 只更新用户名
        await db.query(
          'UPDATE users SET username = ? WHERE id = ?',
          [username, userId]
        );
      }
      return true;
    } catch (error) {
      console.error('更新用户资料错误:', error);
      throw error;
    }
  }
}

module.exports = User;