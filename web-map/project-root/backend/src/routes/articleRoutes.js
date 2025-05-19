const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate } = require('../middlewares/authMiddleware');

// 公开路由 - 不需要认证
// 获取所有文章
router.get('/', articleController.getAllArticles);

// 获取热门文章
router.get('/popular', articleController.getPopularArticles);

// 获取文章详情
router.get('/:id', articleController.getArticleById);

// 需要认证的路由
// 创建新文章
router.post('/', authenticate, articleController.createArticle);

// 更新文章
router.put('/:id', authenticate, articleController.updateArticle);

// 删除文章
router.delete('/:id', authenticate, articleController.deleteArticle);

module.exports = router; 