const User = require('../models/userModel');
const db = require('../config/database');

// 获取所有帖子
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // SQL查询获取帖子
    let query = `
      SELECT p.id, p.title, p.created_at, p.content, p.summary, 
             u.id as author_id, u.username as author_name,
             COUNT(DISTINCT pl.id) as likes_count,
             COUNT(DISTINCT pc.id) as comments_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      LEFT JOIN post_comments pc ON p.id = pc.post_id
    `;
    
    let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM posts p';
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = ' WHERE p.title LIKE ?';
      params = [`%${search}%`];
    }
    
    query += whereClause + ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    countQuery += whereClause;
    
    // 添加LIMIT和OFFSET参数
    params.push(limitNum, offset);
    
    // 执行查询
    const [posts] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, params.slice(0, -2)); // 移除LIMIT和OFFSET参数
    const total = countResult[0]?.total || 0;
    
    res.json({
      success: true,
      data: posts.map(post => ({
        id: post.id,
        title: post.title,
        author: {
          id: post.author_id,
          name: post.author_name
        },
        createTime: post.created_at,
        status: 'published', // 默认状态
        likes: parseInt(post.likes_count) || 0,
        comments: parseInt(post.comments_count) || 0
      })),
      total
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子列表失败'
    });
  }
};

// 删除帖子
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // 使用SQL删除帖子
    const [result] = await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    res.json({
      success: true,
      message: '帖子已删除'
    });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({
      success: false,
      message: '删除帖子失败'
    });
  }
};

// 获取所有用户
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // 使用SQL查询获取用户列表
    let query = 'SELECT id, username, email, created_at, avatar, is_admin FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let params = [];
    
    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      countQuery += ' WHERE username LIKE ? OR email LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
    
    const [users] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, params.slice(0, -2)); // 移除LIMIT和OFFSET参数
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        createTime: user.created_at,
        status: 'active', // 假设默认状态
        isAdmin: user.is_admin === 1,
        avatar: user.avatar
      })),
      total
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 不允许删除自己
    if (userId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录的用户'
      });
    }
    
    // 使用SQL查询删除用户
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
};

// 模拟路线数据 - 用于数据库连接失败时的备用数据
const mockRoutes = [
  {
    id: 1,
    name: "高山徒步路线",
    difficulty: "中等",
    length: 12.5,
    status: "active",
    createdAt: new Date().toISOString(),
    description: "穿越高山地带的美丽路线，可欣赏壮观的山景。",
    location: "四川 成都",
    rating: 4.5,
    reviews: 28,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1470&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "湖边休闲步道",
    difficulty: "简单",
    length: 5.2,
    status: "active",
    createdAt: new Date().toISOString(),
    description: "环绕湖泊的平缓步道，适合家庭和初学者。",
    location: "浙江 杭州",
    rating: 4.3,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1465311530779-5241f5a29892?q=80&w=1470&auto=format&fit=crop"
  },
  {
    id: 3, 
    name: "密林探险路线",
    difficulty: "困难",
    length: 18.7,
    status: "active",
    createdAt: new Date().toISOString(),
    description: "穿越茂密森林的挑战性路线，适合经验丰富的徒步者。",
    location: "云南 丽江",
    rating: 4.8,
    reviews: 16,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  }
];

// 获取所有路线
exports.getRoutes = async (req, res) => {
  try {
    console.log('===== 管理员请求路线列表 =====');
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    console.log(`参数: page=${pageNum}, limit=${limitNum}, offset=${offset}, search="${search}"`);
    
    // 使用SQL查询获取路线列表
    let query = `
      SELECT r.id, r.title as name, r.difficulty, r.distance as length, r.created_at, r.description, 
             r.location, r.rating, r.reviews, r.image
      FROM hiking_routes r
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM hiking_routes';
    let params = [];
    
    if (search) {
      query += ' WHERE r.name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params = [`%${search}%`];
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
    
    console.log('SQL查询:', query);
    console.log('参数值:', params);
    
    let useRealData = true;
    
    // 检查数据库连接
    try {
      await db.query('SELECT 1');
      console.log('数据库连接正常');
    } catch (dbError) {
      console.error('数据库连接测试失败:', dbError);
      useRealData = false;
      console.log('将使用模拟数据');
    }
    
    // 先检查表是否存在
    if (useRealData) {
      try {
        const [tables] = await db.query("SHOW TABLES LIKE 'hiking_routes'");
        if (tables.length === 0) {
          console.error('hiking_routes表不存在!');
          useRealData = false;
          console.log('将使用模拟数据');
        } else {
          console.log('hiking_routes表存在，继续执行查询');
        }
      } catch (tableError) {
        console.error('检查表时出错:', tableError);
        useRealData = false;
        console.log('将使用模拟数据');
      }
    }
    
    let processedRoutes = [];
    let total = 0;
    
    // 如果数据库和表都正常，尝试获取真实数据
    if (useRealData) {
      try {
        // 执行查询
    const [routes] = await db.query(query, params);
        console.log(`查询到${routes.length}条路线记录`);
        
    const [countResult] = await db.query(countQuery, params.slice(0, -2)); // 移除LIMIT和OFFSET参数
        total = countResult[0]?.total || 0;
        console.log(`总计${total}条路线记录`);
        
        // 添加字段检查
        processedRoutes = routes.map(route => {
          const processedRoute = {
            id: route.id || 0,
            name: route.name || '未命名路线',
            difficulty: route.difficulty || '未知',
            length: parseFloat(route.length) || 0,
            status: 'active', // 默认状态
            createdAt: route.created_at || new Date().toISOString(),
            description: route.description || '',
            location: route.location || '',
            rating: parseFloat(route.rating) || 0,
            reviews: parseInt(route.reviews) || 0,
            image: route.image || ''
          };
          return processedRoute;
        });
      } catch (queryError) {
        console.error('查询hiking_routes表失败:', queryError);
        useRealData = false;
        console.log('查询失败，将使用模拟数据');
      }
    }
    
    // 如果需要使用模拟数据
    if (!useRealData) {
      console.log('使用模拟数据替代真实数据库数据');
      
      // 过滤模拟数据（如果有搜索条件）
      let filteredMockRoutes = mockRoutes;
      if (search) {
        filteredMockRoutes = mockRoutes.filter(route => 
          route.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // 计算总数和分页
      total = filteredMockRoutes.length;
      processedRoutes = filteredMockRoutes
        .slice(offset, offset + limitNum);
        
      console.log(`返回${processedRoutes.length}条模拟数据，共${total}条`);
    }
    
    console.log('处理完成，准备返回数据');
    
    // 返回标准格式的响应
    res.json({
      success: true,
      data: processedRoutes,
      total,
      isRealData: useRealData
    });
  } catch (error) {
    console.error('获取路线列表失败:', error);
    console.error(`错误类型: ${error.name}, 错误消息: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    
    // 出现未捕获的错误时，返回模拟数据作为最后的防线
    console.log('发生未处理的错误，返回模拟数据');
    
    // 使用请求中的分页参数
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // 简单分页
    const slicedMockData = mockRoutes.slice(offset, offset + limitNum);
    
    res.json({
      success: true,
      data: slicedMockData,
      total: mockRoutes.length,
      isRealData: false,
      notice: "由于服务器错误，显示的是模拟数据"
    });
  }
};

// 删除路线
exports.deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // 使用SQL查询删除路线
    const [result] = await db.query('DELETE FROM hiking_routes WHERE id = ?', [routeId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }
    
    res.json({
      success: true,
      message: '路线已删除'
    });
  } catch (error) {
    console.error('删除路线失败:', error);
    res.status(500).json({
      success: false,
      message: '删除路线失败'
    });
  }
};
 