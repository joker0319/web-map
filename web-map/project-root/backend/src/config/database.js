const mysql = require('mysql2/promise');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

// 初始化数据库
const initDatabase = async () => {
  try {
    // 测试连接
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    
    // 检查并创建必要的表
    console.log('开始初始化数据库表...');
    
    // 尝试读取SQL文件并执行
    try {
      // 读取表创建SQL
      const tablesSQL = await fs.readFile(path.join(__dirname, 'tables.sql'), 'utf8');
      
      // 分割SQL语句
      const sqlStatements = tablesSQL.split(';').filter(stmt => stmt.trim() !== '');
      
      // 依次执行每个SQL语句
      for (const sql of sqlStatements) {
        try {
          await pool.query(sql + ';');
          console.log('SQL语句执行成功');
        } catch (sqlError) {
          console.warn('SQL语句执行失败，继续执行其他语句:', sqlError.message);
        }
      }
      
      console.log('表初始化完成');
    } catch (fileError) {
      console.warn('读取SQL文件失败:', fileError.message);
      console.log('将使用硬编码SQL创建必要的表');
      
      // 硬编码创建必要的表
      await createRequiredTables();
    }

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 创建必要的表
const createRequiredTables = async () => {
  try {
    // 创建帖子表（如果不存在）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id int NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        content text NOT NULL,
        summary varchar(500) NOT NULL,
        user_id int NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        location varchar(255) DEFAULT NULL,
        likes int DEFAULT 0,
        comments int DEFAULT 0,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        CONSTRAINT posts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证posts表成功');
    
    // 创建标签表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id int NOT NULL AUTO_INCREMENT,
        tag_name varchar(50) NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY tag_name (tag_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证tags表成功');
    
    // 创建帖子标签关联表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        id int NOT NULL AUTO_INCREMENT,
        post_id int NOT NULL,
        tag_id int NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY post_tag_unique (post_id, tag_id),
        KEY tag_id (tag_id),
        CONSTRAINT post_tags_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT post_tags_ibfk_2 FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证post_tags表成功');
    
    // 创建帖子图片表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_images (
        id int NOT NULL AUTO_INCREMENT,
        post_id int NOT NULL,
        image_url varchar(255) NOT NULL,
        sort_order int DEFAULT 0,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY post_id (post_id),
        CONSTRAINT post_images_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证post_images表成功');
    
    // 创建帖子点赞表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id int NOT NULL AUTO_INCREMENT,
        post_id int NOT NULL,
        user_id int NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY post_user_unique (post_id, user_id),
        KEY user_id (user_id),
        CONSTRAINT post_likes_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT post_likes_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证post_likes表成功');
    
    // 创建帖子评论表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id int NOT NULL AUTO_INCREMENT,
        post_id int NOT NULL,
        user_id int NOT NULL,
        content text NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY post_id (post_id),
        KEY user_id (user_id),
        CONSTRAINT post_comments_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT post_comments_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证post_comments表成功');
    
    // 创建徒步路线表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hiking_routes (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        description text NOT NULL,
        difficulty enum('简单','中等','困难','极难') NOT NULL,
        length float NOT NULL,
        elevation float NOT NULL,
        duration int NOT NULL,
        location varchar(255) NOT NULL,
        coordinates json NOT NULL,
        creator_id int NOT NULL,
        status varchar(20) DEFAULT '已发布',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY creator_id (creator_id),
        CONSTRAINT hiking_routes_ibfk_1 FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证hiking_routes表成功');
    
    // 创建路线图片表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS route_images (
        id int NOT NULL AUTO_INCREMENT,
        route_id int NOT NULL,
        image_url varchar(255) NOT NULL,
        sort_order int DEFAULT 0,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY route_id (route_id),
        CONSTRAINT route_images_ibfk_1 FOREIGN KEY (route_id) REFERENCES hiking_routes (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证route_images表成功');
    
    // 创建徒步资讯文章表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id int NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        content text NOT NULL,
        summary varchar(500) NOT NULL,
        category varchar(50) NOT NULL,
        image varchar(255) NOT NULL,
        views int DEFAULT 0,
        user_id int NOT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        CONSTRAINT articles_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('创建或验证articles表成功');
    
  } catch (error) {
    console.error('创建表失败:', error);
    throw error;
  }
};

// 导出连接池和初始化函数
module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  testConnection,
  initDatabase
};