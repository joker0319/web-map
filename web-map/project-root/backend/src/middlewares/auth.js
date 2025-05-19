const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.auth = (req, res, next) => {
  try {
    console.log("Auth中间件 - 请求头:", req.headers.authorization);
    
    // 获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("未提供认证令牌或格式错误");
      return res.status(401).json({
        success: false,
        message: "未提供认证令牌"
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 在 auth 中间件中添加
    const jwtSecret = process.env.JWT_SECRET || config.JWT_SECRET || 'your-default-secret';
    console.log("使用的JWT密钥:", jwtSecret.substring(0, 3) + '...');  // 安全打印密钥前缀
    
    // 使用密钥验证令牌
    const decoded = jwt.verify(token, jwtSecret);
    console.log("解析后的Token内容:", decoded);
    
    // 保存用户信息
    req.user = decoded;
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error("Token验证失败:", error.message);
    return res.status(401).json({
      success: false,
      message: "认证无效"
    });
  }
};
