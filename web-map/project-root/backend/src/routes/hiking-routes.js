const express = require('express');
const router = express.Router();
const db = require('../config/database');
const coordinatesController = require('../controllers/coordinates.controller');

// 获取所有路线
router.get('/', async (req, res) => {
  try {
    const [routes] = await db.query('SELECT * FROM hiking_routes');
    res.json({ data: routes });
  } catch (error) {
    console.error('获取路线数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门路线（评分最高的3条）
router.get('/popular', async (req, res) => {
  try {
    // 临时改为获取评分最高的3条路线
    const [routes] = await db.query('SELECT * FROM hiking_routes ORDER BY rating DESC LIMIT 3');
    res.json({
      code: 200,
      message: "success",
      data: routes
    });
  } catch (error) {
    console.error('获取热门路线失败，详细错误:', error);
    res.status(500).json({
      code: 500,
      message: "获取热门路线失败",
      data: null
    });
  }
});

// 获取单个路线详情
router.get('/:id', async (req, res) => {
  try {
    const [routes] = await db.query(
      'SELECT * FROM hiking_routes WHERE id = ?',
      [req.params.id]
    );
    
    if (routes.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到路线'
      });
    }
    
    // 处理JSON字段
    const route = {
      ...routes[0],
      seasons: routes[0].seasons ? (
        typeof routes[0].seasons === 'string' ? 
          // 尝试解析JSON，如果失败则当作字符串数组处理
          (function() {
            try {
              return JSON.parse(routes[0].seasons);
            } catch (e) {
              console.log(`解析seasons字段失败: ${e.message}，尝试作为字符串处理`);
              // 如果是普通字符串，尝试按逗号分割
              return routes[0].seasons.split(',').map(s => s.trim());
            }
          })() 
        : routes[0].seasons
      ) : []
    };
    
    res.status(200).json({ 
      success: true, 
      data: route 
    });
  } catch (error) {
    console.error('获取路线详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取路线详情失败' 
    });
  }
});

// 坐标相关路由
// 添加坐标POST路由
router.post('/coordinates', coordinatesController.createCoordinates); 
// 获取路线坐标
router.get('/:routeId/coordinates', coordinatesController.getCoordinatesByRouteId);
// 更新路线坐标
router.put('/:routeId/coordinates', coordinatesController.updateCoordinates);
// 保存路线坐标（新增或更新）
router.post('/:routeId/coordinates', coordinatesController.saveCoordinates);

// 简单的测试路由 - 不依赖控制器
router.post('/coordinates/simple', async (req, res) => {
  try {
    console.log('[简单测试] 收到坐标保存请求，数据:', JSON.stringify(req.body));
    
    // 确保有基本数据
    if (!req.body || !req.body.route_id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：route_id'
      });
    }
    
    // 直接返回成功响应，不进行数据库操作
    return res.status(200).json({
      success: true,
      message: '坐标数据已接收',
      data: req.body
    });
  } catch (error) {
    console.error('[简单测试] 处理请求出错:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 测试数据库连接的路由
router.get('/db/test', async (req, res) => {
  try {
    // 测试数据库连接
    const [result] = await db.query('SELECT 1 as test');
    
    // 检查route_coordinates表是否存在
    const [tables] = await db.query("SHOW TABLES LIKE 'route_coordinates'");
    const tableExists = tables.length > 0;
    
    return res.status(200).json({
      success: true,
      message: '数据库连接测试成功',
      data: {
        testResult: result,
        routeCoordinatesTable: {
          exists: tableExists
        }
      }
    });
  } catch (error) {
    console.error('[数据库测试] 测试数据库连接出错:', error);
    return res.status(500).json({
      success: false,
      message: '数据库连接测试失败',
      error: error.message
    });
  }
});

// 测试路由
router.post('/coordinates/test', async (req, res) => {
  try {
    console.log('[测试] 收到测试坐标API请求，数据:', JSON.stringify(req.body));
    
    // 确保有测试数据
    const testData = req.body || {
      route_id: 1,
      start_name: "测试起点",
      start_lat: 30.657034,
      start_lng: 104.066801,
      end_name: "测试终点",
      end_lat: 30.679857,
      end_lng: 104.098731,
      waypoints: [
        { lat: 30.661234, lng: 104.075123 },
        { lat: 30.671456, lng: 104.085678 }
      ]
    };
    
    // 确保有route_id
    if (!testData.route_id) {
      testData.route_id = 1; // 测试用的路线ID
    }
    
    // 使用数据库直接插入
    console.log('[测试] 准备插入数据到route_coordinates表');
    
    // 先检查表是否存在
    const [tables] = await db.query('SHOW TABLES LIKE "route_coordinates"');
    if (tables.length === 0) {
      console.log('[测试] route_coordinates表不存在，尝试创建');
      // 使用初始化脚本创建表
      const { initRouteCoordinatesTable } = require('../config/route_coordinates_init');
      await initRouteCoordinatesTable();
    }
    
    // 检查是否已有数据
    const [existing] = await db.query('SELECT * FROM route_coordinates WHERE route_id = ?', [testData.route_id]);
    
    let result;
    if (existing.length > 0) {
      console.log('[测试] 路线已有坐标，执行更新');
      // 构建更新SQL
      const updateSQL = `
        UPDATE route_coordinates SET 
          start_name = ?, start_lat = ?, start_lng = ?,
          end_name = ?, end_lat = ?, end_lng = ?,
          waypoints = ?
        WHERE route_id = ?
      `;
      
      result = await db.query(updateSQL, [
        testData.start_name,
        testData.start_lat,
        testData.start_lng,
        testData.end_name,
        testData.end_lat,
        testData.end_lng,
        JSON.stringify(testData.waypoints),
        testData.route_id
      ]);
      
      console.log('[测试] 更新结果:', JSON.stringify(result));
      return res.json({
        success: true,
        message: '测试坐标更新成功',
        data: { ...testData, id: existing[0].id }
      });
    } else {
      console.log('[测试] 创建新坐标记录');
      // 构建插入SQL
      const insertSQL = `
        INSERT INTO route_coordinates (
          route_id, start_name, start_lat, start_lng, 
          end_name, end_lat, end_lng, waypoints
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      result = await db.query(insertSQL, [
        testData.route_id,
        testData.start_name,
        testData.start_lat,
        testData.start_lng,
        testData.end_name,
        testData.end_lat,
        testData.end_lng,
        JSON.stringify(testData.waypoints)
      ]);
      
      console.log('[测试] 插入结果:', JSON.stringify(result));
      return res.json({
        success: true,
        message: '测试坐标创建成功',
        data: { ...testData, id: result[0].insertId }
      });
    }
  } catch (error) {
    console.error('[测试] 测试坐标API错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: `测试坐标API错误: ${error.message}`,
      error: error.toString()
    });
  }
});

module.exports = router; 