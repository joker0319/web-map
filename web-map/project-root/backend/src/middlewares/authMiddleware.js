const { verifyToken } = require('../utils/jwtHelper');
const User = require('../models/userModel');

// 验证用户是否已登录
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权访问，请先登录' 
      });
    }

    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const { valid, decoded, error } = verifyToken(token);
    
    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        message: '令牌无效或已过期，请重新登录',
        error
      });
    }

    // 查询用户信息，包括管理员状态
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在，请重新登录'
      });
    }
    
    // 将完整的用户信息添加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin === 1  // 从数据库中获取管理员状态
    };
    
    // 临时解决方案：检查用户名，如果是"xxx"则强制设为管理员
    if (user.username === 'xxx') {
      req.user.isAdmin = true;
      console.log(`[临时解决方案] 已将用户 ${user.username} 的管理员权限强制设置为 true`);
    }
    
    console.log(`用户认证成功，用户ID=${user.id}, 用户名=${user.username}, 是否管理员=${req.user.isAdmin}`);
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = { authenticate };