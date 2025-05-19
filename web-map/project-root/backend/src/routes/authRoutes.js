const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth.js');

// 注册路由
router.post(
  '/register',
  [
    body('username')
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 3, max: 20 }).withMessage('用户名长度应为3-20个字符'),
    body('email')
      .notEmpty().withMessage('邮箱不能为空')
      .isEmail().withMessage('请提供有效的邮箱地址'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码长度至少为6个字符')
  ],
  authController.register
);

// 登录路由
router.post(
  '/login',
  [
    body('username')
      .notEmpty().withMessage('用户名不能为空'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
  ],
  authController.login
);

// 获取当前用户信息
router.get('/me', auth, authController.getCurrentUser);

// 临时路由：设置用户为管理员 (仅用于开发阶段)
router.post('/set-admin', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供用户名' 
      });
    }
    
    const db = require('../config/database');
    
    // 更新用户的管理员状态
    const [result] = await db.query(
      'UPDATE users SET is_admin = 1 WHERE username = ?',
      [username]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: `用户 ${username} 已被设置为管理员`
    });
  } catch (error) {
    console.error('设置管理员权限失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 方案2：如果需要这个路由，添加一个临时的函数处理
router.get('/some-route', (req, res) => {
  res.status(200).json({ message: '功能开发中' });
});

module.exports = router;