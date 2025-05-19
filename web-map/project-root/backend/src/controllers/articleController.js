const Article = require('../models/Article');

// 获取所有文章
exports.getAllArticles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    // 构建筛选条件
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.timeFilter) filters.timeFilter = req.query.timeFilter;
    if (req.query.searchQuery) filters.searchQuery = req.query.searchQuery;
    
    const articles = await Article.getAll(limit, offset, filters);
    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        limit,
        offset,
        total: articles.length // 注意：这不是总记录数，只是当前查询返回的数量
      }
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败',
      error: error.message
    });
  }
};

// 获取热门文章
exports.getPopularArticles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const articles = await Article.getPopular(limit);
    res.status(200).json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('获取热门文章失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门文章失败',
      error: error.message
    });
  }
};

// 根据ID获取文章详情
exports.getArticleById = async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const article = await Article.getById(articleId);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败',
      error: error.message
    });
  }
};

// 创建新文章
exports.createArticle = async (req, res) => {
  try {
    // 验证请求数据
    const { title, content, summary, category, image } = req.body;
    
    if (!title || !content || !summary || !category || !image) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、摘要、分类和图片都是必填项'
      });
    }
    
    // 获取当前用户ID
    const userId = req.user.id;
    
    // 创建文章
    const articleData = {
      title,
      content,
      summary,
      category,
      image,
      user_id: userId
    };
    
    const articleId = await Article.create(articleData);
    
    res.status(201).json({
      success: true,
      message: '文章创建成功',
      data: { id: articleId }
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({
      success: false,
      message: '创建文章失败',
      error: error.message
    });
  }
};

// 更新文章
exports.updateArticle = async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    
    // 验证请求数据
    const { title, content, summary, category, image } = req.body;
    
    if (!title || !content || !summary || !category || !image) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、摘要、分类和图片都是必填项'
      });
    }
    
    // 检查文章是否存在
    const article = await Article.getById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    // 检查是否是文章作者
    if (article.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '您没有权限更新此文章'
      });
    }
    
    // 更新文章
    const articleData = {
      title,
      content,
      summary,
      category,
      image
    };
    
    const success = await Article.update(articleId, articleData);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: '文章更新失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '文章更新成功'
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({
      success: false,
      message: '更新文章失败',
      error: error.message
    });
  }
};

// 删除文章
exports.deleteArticle = async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    
    // 检查文章是否存在
    const article = await Article.getById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    // 检查是否是文章作者
    if (article.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '您没有权限删除此文章'
      });
    }
    
    // 删除文章
    const success = await Article.delete(articleId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: '文章删除失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '文章删除成功'
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文章失败',
      error: error.message
    });
  }
}; 