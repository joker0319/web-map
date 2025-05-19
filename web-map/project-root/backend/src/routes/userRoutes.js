const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middlewares/auth');

// 修改这行
const uploadDir = path.join(__dirname, '../../uploads');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保目录存在
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 用户资料更新路由 - 包含头像上传
router.put('/profile', auth, upload.single('avatar'), userController.updateUserProfile);

// 获取用户资料
router.get('/profile', auth, userController.getUserProfile);

module.exports = router; 