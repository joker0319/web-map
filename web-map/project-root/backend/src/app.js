const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { testConnection, initDatabase } = require('./config/database');
const { initRouteCoordinatesTable } = require('./config/route_coordinates_init');
const path = require('path');
const fs = require('fs');

// 在 app.js 文件顶部添加
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

// 创建Express应用
const app = express();

// 中间件
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加调试日志
console.log('=========== 加载路由模块 ===========');
console.log('- 加载 authRoutes');
const authRoutes = require('./routes/authRoutes');
console.log('- 加载 userRoutes');
const userRoutes = require('./routes/userRoutes');
console.log('- 加载 hikingRoutesRouter');
const hikingRoutesRouter = require('./routes/hiking-routes');
console.log('- 加载 forumRoutes');
const forumRoutes = require('./routes/forumRoutes');
console.log('- 加载 messageRoutes');
const messageRoutes = require('./routes/messageRoutes');
console.log('- 加载 adminRoutes');
const adminRoutes = require('./routes/adminRoutes');
console.log('- 加载 articleRoutes');
const articleRoutes = require('./routes/articleRoutes');

// 路由
console.log('=========== 注册API路由 ===========');
console.log('- 注册 /api/auth');
app.use('/api/auth', authRoutes);
console.log('- 注册 /api/users');
app.use('/api/users', userRoutes);
console.log('- 注册 /api/hiking-routes');
app.use('/api/hiking-routes', hikingRoutesRouter);
console.log('- 注册 /api/forum');
app.use('/api/forum', forumRoutes);
console.log('- 注册 /api/messages');
app.use('/api/messages', messageRoutes);
console.log('- 注册 /api/admin');
app.use('/api/admin', adminRoutes);
console.log('- 注册 /api/articles');
app.use('/api/articles', articleRoutes);

// 添加静态文件服务
const uploadsPath = path.join(__dirname, '../uploads');
console.log(`配置静态文件路径: ${uploadsPath}`);

// 主上传目录
app.use('/uploads', express.static(uploadsPath));

// 额外添加一个API路径访问上传文件，以防主路径不工作
app.use('/api/uploads', express.static(uploadsPath));

// 检查上传目录存在
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`创建上传根目录: ${uploadsPath}`);
  }
  
  // 检查论坛上传目录
  const forumUploadsPath = path.join(uploadsPath, 'forum');
  if (!fs.existsSync(forumUploadsPath)) {
    fs.mkdirSync(forumUploadsPath, { recursive: true });
    console.log(`创建论坛上传目录: ${forumUploadsPath}`);
  }
} catch (err) {
  console.error(`静态文件目录配置错误: ${err.message}`);
}

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '智能户外徒步平台API服务' });
});

// 启动服务器
const PORT = config.PORT;
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  
  // 测试数据库连接
  const isConnected = await testConnection();
  if (isConnected) {
    // 初始化数据库表
    await initDatabase();
    
    // 初始化坐标表
    console.log('=========== 初始化路线坐标表 ===========');
    await initRouteCoordinatesTable();
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 在项目的某处添加这个测试端点
app.get('/api/test/db-config', (req, res) => {
  res.json({
    host: config.DB_HOST,
    database: config.DB_NAME,
    user: config.DB_USER
  });
});

// 添加测试/调试端点
app.get('/api/test/coordinates', async (req, res) => {
  try {
    const db = require('./config/database');
    
    // 查询坐标表是否存在
    const [tables] = await db.query('SHOW TABLES LIKE "route_coordinates"');
    const tableExists = tables.length > 0;
    
    // 如果表存在，获取所有坐标数据用于调试
    let coordinatesData = [];
    if (tableExists) {
      const [rows] = await db.query('SELECT * FROM route_coordinates');
      coordinatesData = rows;
    }
    
    res.json({
      success: true,
      tableExists,
      message: tableExists ? 'route_coordinates表存在' : 'route_coordinates表不存在',
      data: coordinatesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `测试坐标表出错: ${error.message}`,
      error: error.toString()
    });
  }
});

module.exports = app;