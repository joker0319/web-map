const User = require('../models/userModel');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const bcrypt = require('bcrypt');

// 上传头像
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择文件上传'
      });
    }

    // 获取文件信息
    const fileName = req.file.filename;
    const filePath = `/uploads/avatars/${fileName}`;
    
    // 更新用户头像
    await User.updateAvatar(req.user.id, filePath);
    
    // 返回头像URL
    res.status(200).json({
      success: true,
      message: '头像上传成功',
      data: {
        url: filePath
      }
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，头像上传失败'
    });
  }
};

// 更新个人资料
exports.updateProfile = async (req, res) => {
  try {
    console.log("接收请求:", req.body, req.file, req.user);
    
    const userId = req.user.id; 
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "用户名不能为空"
      });
    }
    
    // 简化更新逻辑
    let avatarUrl = null;
    if (req.file) {
      // 添加服务器地址，生成完整URL
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      avatarUrl = `${serverUrl}/uploads/${req.file.filename}`;
    }
    
    // 更新用户信息
    await db.query(
      'UPDATE users SET username = ?, avatar = IFNULL(?, avatar) WHERE id = ?',
      [username, avatarUrl, userId]
    );
    
    res.json({
      success: true,
      message: "用户资料更新成功",
      avatar: avatarUrl
    });
  } catch (error) {
    console.error("更新错误详情:", error.stack);
    res.status(500).json({
      success: false,
      message: "服务器内部错误"
    });
  }
};

// 用户资料更新（包含头像上传）
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, bio } = req.body;
    
    // 基本验证
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "用户名不能为空"
      });
    }
    
    // 处理头像上传
    let avatarUrl = null;
    if (req.file) {
      // 添加服务器地址，生成完整URL
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      avatarUrl = `${serverUrl}/uploads/${req.file.filename}`;
    }
    
    // 更新用户信息
    await db.query(
      'UPDATE users SET username = ?, bio = IFNULL(?, bio), avatar = IFNULL(?, avatar) WHERE id = ?',
      [username, bio, avatarUrl, userId]
    );
    
    // 获取更新后的用户信息
    const [updatedUser] = await db.query(
      'SELECT id, username, email, avatar, bio FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: "用户资料更新成功",
      data: updatedUser[0]
    });
  } catch (error) {
    console.error("更新用户资料失败:", error.stack);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
      error: error.message
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // 来自认证中间件
    
    // 从数据库获取用户信息
    const [user] = await db.query(
      'SELECT id, username, email, avatar, bio FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户资料失败',
      error: error.message
    });
  }
};
