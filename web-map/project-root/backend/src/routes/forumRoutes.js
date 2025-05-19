const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const forumController = require('../controllers/forumController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置帖子图片上传
const uploadDir = path.join(__dirname, '../../uploads/forum');

// 确保上传目录存在
try {
  if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`创建上传目录: ${uploadDir}`);
  }
} catch (err) {
  console.error(`创建上传目录失败: ${err.message}`);
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 再次确保目录存在
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 添加时间戳和随机字符串，避免文件名冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// 获取帖子列表
router.get('/posts', forumController.getPosts);

// 搜索帖子
router.get('/search', forumController.searchPosts);

// 获取帖子详情
router.get('/posts/:id', forumController.getPostById);

// 创建帖子
router.post('/posts', auth, forumController.createPost);

// 图片上传
router.post('/upload', auth, upload.single('image'), forumController.uploadImage);

// 点赞/取消点赞
router.post('/posts/:id/like', auth, forumController.toggleLike);

// 获取评论
router.get('/posts/:id/comments', forumController.getComments);

// 添加评论
router.post('/posts/:id/comments', auth, forumController.addComment);

// 删除评论
router.delete('/posts/:postId/comments/:commentId', auth, forumController.deleteComment);

module.exports = router; 