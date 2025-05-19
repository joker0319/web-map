// 引入所需的模块
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initRouteCoordinatesTable } = require('./config/route_coordinates_init');

// 创建Express应用
const app = express();

// 使用中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // 日志

// 引入路由
const hikingRoutesRouter = require('./routes/hiking-routes');

// 使用路由
app.use('/hiking-routes', hikingRoutesRouter);

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '服务运行正常' });
});

// 404路由
app.use((req, res) => {
  res.status(404).json({ message: '未找到请求的资源' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 设置服务器端口
const PORT = process.env.PORT || 3000;

// 启动服务前初始化表结构
const startServer = async () => {
  try {
    // 初始化路线坐标表
    const dbInitialized = await initRouteCoordinatesTable();
    if (dbInitialized) {
      console.log('数据库表初始化完成，将使用数据库存储坐标');
    } else {
      console.log('数据库表初始化未完成，将使用本地存储坐标');
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`健康检查地址: http://localhost:${PORT}/health`);
      console.log(`徒步路线API: http://localhost:${PORT}/hiking-routes`);
    });
  } catch (error) {
    console.error('启动服务器时发生错误:', error);
    // 尝试启动服务器，即使初始化失败
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}，但数据库功能可能受限`);
    });
  }
};

// 启动服务器
startServer(); 