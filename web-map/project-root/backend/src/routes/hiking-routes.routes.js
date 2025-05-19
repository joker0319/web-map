const express = require('express');
const router = express.Router();
const hikingRoutesController = require('../controllers/hiking-routes.controller');
const coordinatesController = require('../controllers/coordinates.controller');

// 路线相关路由
router.get('/', hikingRoutesController.getAllRoutes);
router.get('/popular', hikingRoutesController.getPopularRoutes);
router.get('/:id', hikingRoutesController.getRouteById);

// 坐标相关路由
// 添加坐标POST路由
router.post('/coordinates', coordinatesController.createCoordinates); 
// 获取路线坐标
router.get('/:routeId/coordinates', coordinatesController.getCoordinatesByRouteId);
// 更新路线坐标
router.put('/:routeId/coordinates', coordinatesController.updateCoordinates);

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
    const db = require('../config/database');
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