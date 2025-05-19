const db = require('./database');
const fs = require('fs').promises;
const path = require('path');

/**
 * 路线坐标表初始化
 * 用于确保route_coordinates表存在，并处理外键约束
 */
const initRouteCoordinatesTable = async () => {
  console.log('=========== 初始化路线坐标表 ===========');
  
  try {
    console.log('[初始化] 开始检查route_coordinates表...');
    
    // 测试数据库连接
    try {
      // 1. 先测试数据库连接
      await db.testConnection();
      
      // 2. 创建route_coordinates表的SQL
      const createTableSQL = `
        -- ----------------------------
        -- Table structure for route_coordinates
        -- ----------------------------
        CREATE TABLE IF NOT EXISTS \`route_coordinates\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`route_id\` int NOT NULL,
          \`start_name\` varchar(255) DEFAULT NULL,
          \`start_lat\` decimal(10,6) NOT NULL,
          \`start_lng\` decimal(10,6) NOT NULL,
          \`end_name\` varchar(255) DEFAULT NULL,
          \`end_lat\` decimal(10,6) NOT NULL,
          \`end_lng\` decimal(10,6) NOT NULL,
          \`waypoints\` json DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`route_id\` (\`route_id\`)
        ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `;
      
      // 3. 执行创建表SQL
      console.log('[初始化] 执行SQL:', createTableSQL);
      await db.query(createTableSQL);
      console.log('[初始化] SQL执行成功');
      
      // 4. 验证表是否存在
      console.log('[初始化] 验证route_coordinates表是否存在');
      const [tables] = await db.query("SHOW TABLES LIKE 'route_coordinates'");
      if (tables.length === 0) {
        console.warn('[初始化] 创建表失败，将退回到使用本地存储');
        return false;
      }
      
      // 5. 移除外键约束 - 临时解决方案，避免外键错误
      console.log('[初始化] route_coordinates表已存在，尝试移除外键约束');
      try {
        await db.query(`
          ALTER TABLE route_coordinates 
          DROP FOREIGN KEY IF EXISTS route_coordinates_ibfk_1
        `);
        console.log('[初始化] 外键约束已移除');
      } catch (error) {
        if (error.message.includes('check that the constraint exists')) {
          console.log('[初始化] 没有发现外键约束，无需移除');
        } else {
          console.warn('[初始化] 移除外键约束时出错:', error.message);
        }
      }
      
      console.log('[初始化] route_coordinates表初始化完成');
      return true;
    } catch (dbError) {
      console.error('[初始化] 数据库操作失败:', dbError.message);
      console.log('[初始化] 将退回到使用本地存储模式');
      return false;
    }
  } catch (error) {
    console.error('[初始化] 初始化route_coordinates表出错:', error.message);
    return false;
  }
};

// 导出初始化函数
module.exports = {
  initRouteCoordinatesTable
}; 