/**
 * 响应处理工具
 * 提供统一的API响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {Number} statusCode - HTTP状态码，默认200
 */
const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    data
  });
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {Number} statusCode - HTTP状态码
 * @param {String} message - 错误消息
 * @param {*} errors - 错误详情，可选
 */
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    code: statusCode,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
}; 