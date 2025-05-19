const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/authMiddleware');

// 调试日志中间件
router.use((req, res, next) => {
  console.log(`[消息路由] ${req.method} ${req.originalUrl}，参数:`, req.params);
  next();
});

// 所有消息路由都需要认证
router.use(authenticate);

// 获取用户消息列表
router.get('/', messageController.getUserMessages);

// 获取未读消息数量
router.get('/unread-count', messageController.getUnreadCount);

// 标记单条消息为已读
router.put('/:messageId/read', messageController.markAsRead);

// 标记所有消息为已读
router.put('/read-all', messageController.markAllAsRead);

// 删除消息
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router; 