const User = require('../models/userModel');
const { generateToken } = require('../utils/jwtHelper');
const { validationResult } = require('express-validator');

// 用户注册
exports.register = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // 检查用户名或邮箱是否已存在
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false, 
        message: '该邮箱已被注册' 
      });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ 
        success: false, 
        message: '该用户名已被使用' 
      });
    }

    // 创建新用户
    const userId = await User.create({ username, email, password });
    
    // 获取用户信息(不含密码)
    const user = await User.findById(userId);
    
    // 生成JWT令牌
    const token = generateToken(userId);

    // 返回用户信息和令牌
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，注册失败' 
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    // 检查用户是否存在 (通过用户名查找)
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码不正确' 
      });
    }

    // 验证密码
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码不正确' 
      });
    }

    // 生成JWT令牌
    const token = generateToken(user.id);

    // 返回用户信息和令牌(不含密码)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，登录失败' 
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = (req, res) => {
  // 如果不存在，添加一个简单实现
    res.status(200).json({
      success: true,
    data: req.user
    });
};