const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');

// 调试日志中间件
router.use((req, res, next) => {
  console.log(`[管理员路由] ${req.method} ${req.originalUrl}，参数:`, req.params);
  next();
});

// 所有管理员路由都需要认证
router.use(authenticate);

// 管理员权限中间件
const isAdmin = (req, res, next) => {
  console.log('检查管理员权限:', req.user);
  if (!req.user || !req.user.isAdmin) {
    console.log(`用户 ${req.user?.username || 'unknown'} (ID: ${req.user?.id || 'unknown'}) 尝试访问管理员API，但没有管理员权限`);
    return res.status(403).json({
      success: false,
      message: '无管理员权限'
    });
  }
  console.log(`管理员 ${req.user.username} (ID: ${req.user.id}) 访问权限验证通过`);
  next();
};

// 添加管理员权限验证
router.use(isAdmin);

// ========== 帖子管理 ==========
// 获取所有帖子
router.get('/posts', adminController.getPosts);

// 删除帖子
router.delete('/posts/:postId', adminController.deletePost);

// ========== 用户管理 ==========
// 获取所有用户
router.get('/users', adminController.getUsers);

// 删除用户
router.delete('/users/:userId', adminController.deleteUser);

// ========== 路线管理 ==========
// 获取所有徒步路线
router.get('/routes', adminController.getRoutes);

// 删除徒步路线
router.delete('/routes/:routeId', adminController.deleteRoute);

module.exports = router; 