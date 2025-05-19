/**
 * 坐标控制器
 * 处理路线坐标的API请求
 */
const Coordinates = require('../models/Coordinates');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * 创建坐标
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const createCoordinates = async (req, res) => {
  try {
    console.log('创建坐标API收到请求，数据:', req.body);
    
    if (!req.body || !req.body.route_id) {
      console.log('缺少必要参数: route_id');
      return errorResponse(res, 400, '缺少必要参数：route_id');
    }
    
    // 使用模型保存坐标
    const result = await Coordinates.create(req.body);
    
    console.log('创建坐标成功:', result);
    return successResponse(res, {
      message: '坐标创建成功',
      coordinates: result
    }, 201);
  } catch (error) {
    console.error('创建坐标失败:', error);
    return errorResponse(res, 500, `创建坐标失败: ${error.message}`);
  }
};

/**
 * 根据路线ID获取坐标
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const getCoordinatesByRouteId = async (req, res) => {
  try {
    const routeId = req.params.routeId;
    console.log(`获取路线ID=${routeId}的坐标`);
    
    if (!routeId) {
      return errorResponse(res, 400, '缺少路线ID参数');
    }
    
    // 获取坐标
    const coordinates = await Coordinates.getByRouteId(routeId);
    
    if (!coordinates) {
      console.log(`未找到路线ID=${routeId}的坐标`);
      return successResponse(res, { 
        message: '未找到路线坐标', 
        coordinates: null
      });
    }
    
    console.log('获取坐标成功:', coordinates);
    return successResponse(res, { 
      message: '获取坐标成功', 
      coordinates 
    });
  } catch (error) {
    console.error('获取坐标失败:', error);
    return errorResponse(res, 500, `获取坐标失败: ${error.message}`);
  }
};

/**
 * 更新坐标
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const updateCoordinates = async (req, res) => {
  try {
    const routeId = req.params.routeId;
    console.log(`更新路线ID=${routeId}的坐标，数据:`, req.body);
    
    if (!routeId) {
      return errorResponse(res, 400, '缺少路线ID参数');
    }
    
    // 检查路线坐标是否存在
    const existing = await Coordinates.getByRouteId(routeId);
    
    let result;
    if (existing) {
      // 更新现有坐标
      result = await Coordinates.update(routeId, req.body);
      return successResponse(res, {
        message: '坐标更新成功',
        success: result
      });
    } else {
      // 创建新坐标
      req.body.route_id = routeId;
      result = await Coordinates.create(req.body);
      return successResponse(res, {
        message: '坐标创建成功',
        coordinates: result
      }, 201);
    }
  } catch (error) {
    console.error('更新坐标失败:', error);
    return errorResponse(res, 500, `更新坐标失败: ${error.message}`);
  }
};

/**
 * 保存坐标（创建或更新）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const saveCoordinates = async (req, res) => {
  try {
    const routeId = req.params.routeId || req.body.route_id;
    console.log(`保存路线ID=${routeId}的坐标，数据:`, req.body);
    
    if (!routeId) {
      return errorResponse(res, 400, '缺少路线ID参数');
    }
    
    // 使用模型的save方法
    const coordinates = await Coordinates.save(routeId, req.body);
    
    return successResponse(res, {
      message: '坐标保存成功',
      coordinates
    });
  } catch (error) {
    console.error('保存坐标失败:', error);
    return errorResponse(res, 500, `保存坐标失败: ${error.message}`);
  }
};

module.exports = {
  createCoordinates,
  getCoordinatesByRouteId,
  updateCoordinates,
  saveCoordinates
}; 