const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// 获取帖子列表
exports.getPosts = async (req, res) => {
  try {
    // 获取分页和排序参数
    const page = parseInt(req.query.page) || 1;
    const sortType = req.query.sortType || 'latest';
    const limit = 10;
    const offset = (page - 1) * limit;
    
    let orderBy = 'p.created_at DESC';
    if (sortType === 'hottest') {
      orderBy = 'p.likes DESC, p.created_at DESC';
    }
    
    // 获取帖子列表，包含作者信息
    const query = `
      SELECT p.*, u.username as user_name, u.avatar as user_avatar,
      GROUP_CONCAT(DISTINCT t.tag_name) as tags,
      COUNT(DISTINCT pl.id) as like_count,
      COUNT(DISTINCT pc.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      LEFT JOIN post_comments pc ON p.id = pc.post_id
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [posts] = await db.query(query, [limit, offset]);
    
    // 获取每个帖子的图片
    for (const post of posts) {
      try {
        const [images] = await db.query(`
          SELECT image_url FROM post_images
          WHERE post_id = ?
          ORDER BY sort_order ASC
        `, [post.id]);
        
        post.images = images.map(img => img.image_url);
      } catch (err) {
        console.log(`获取帖子 ${post.id} 图片失败:`, err.message);
        post.images = [];
      }
      
      // 格式化数据以匹配前端期望
      post.createdAt = post.created_at;
      post.author = {
        id: post.user_id,
        name: post.user_name || '未知用户',
        avatar: post.user_avatar || ''
      };
      
      // 处理标签
      post.tags = post.tags ? post.tags.split(',').filter(tag => tag.trim() !== '') : [];
      
      // 处理点赞和评论计数
      post.likes = post.like_count || 0;
      post.comments = post.comment_count || 0;
      post.isLiked = false; // 默认未点赞，实际应该根据当前用户判断
      
      // 确保摘要字段存在
      if (!post.summary && post.content) {
        post.summary = post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '');
      }
      
      // 删除冗余或不需要的字段
      delete post.user_id;
      delete post.user_name;
      delete post.user_avatar;
      delete post.created_at;
      delete post.updated_at;
      delete post.like_count;
      delete post.comment_count;
    }
    
    // 直接返回帖子数组，而不是包装在data对象中
    res.status(200).json(posts);
  } catch (error) {
    console.error('获取帖子失败:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子失败',
      error: error.message
    });
  }
};

// 搜索帖子
exports.searchPosts = async (req, res) => {
  try {
    const { query, sortType = 'latest' } = req.query;
    
    let orderBy = 'created_at DESC';
    if (sortType === 'hottest') {
      orderBy = 'likes DESC';
    }

    const [posts] = await db.query(`
      SELECT p.*, u.username as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.title LIKE ? OR p.content LIKE ?
      ORDER BY ${orderBy}
    `, [`%${query}%`, `%${query}%`]);

    res.json({
      code: 200,
      data: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary,
        createdAt: post.created_at,
        author: {
          name: post.author_name,
          avatar: post.author_avatar
        },
        likes: post.likes,
        comments: post.comments,
        location: post.location
      })),
      message: '搜索帖子成功',
      success: true
    });
  } catch (error) {
    console.error('搜索帖子失败:', error);
    res.status(500).json({
      code: 500,
      message: '搜索帖子失败',
      success: false
    });
  }
};

// 获取帖子详情
exports.getPostById = async (req, res) => {
  try {
    // 获取用户ID（可能未登录）
    const userId = req.user?.id || null;
    
    // 查询帖子信息，包括用户是否已点赞
    const [posts] = await db.query(`
      SELECT p.*, u.username as author_name, u.avatar as author_avatar,
        CASE WHEN pl.id IS NULL THEN 0 ELSE 1 END as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
      WHERE p.id = ?
    `, [userId, req.params.id]);
    
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const post = posts[0];
    
    // 查询帖子图片
    const [images] = await db.query(`
      SELECT image_url FROM post_images
      WHERE post_id = ?
      ORDER BY sort_order ASC
    `, [post.id]);
    
    res.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary,
        createdAt: post.created_at,
        author: {
          id: post.user_id,
          name: post.author_name,
          avatar: post.author_avatar
        },
        images: images.map(img => img.image_url),
        likes: post.likes,
        comments: post.comments,
        location: post.location,
        isLiked: post.is_liked === 1
      }
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子详情失败'
    });
  }
};

// 创建帖子
exports.createPost = async (req, res) => {
  console.log("========== 后端：开始创建帖子 ==========");
  console.log("请求头:", {
    auth: req.headers.authorization ? "存在" : "不存在",
    cookie: req.headers.cookie ? "存在" : "不存在",
    contentType: req.headers['content-type']
  });
  
  // 获取数据库连接并开始事务
  const connection = await db.pool.getConnection();
  await connection.beginTransaction();
  
  try {
    console.log("认证用户信息:", req.user);
    
    // 直接使用req.user.id，这是auth中间件设置的
    const userId = req.user?.id;
    
    if (!userId) {
      console.error("用户认证失败 - 无法获取用户ID");
      // 查看是否在请求体中有用户ID
      const bodyUserId = req.body.userId || req.body.user_id;
      console.log("请求体中的用户ID:", bodyUserId);
      
      return res.status(401).json({
        success: false,
        message: '未登录或认证失败，无法获取用户ID'
      });
    }
    
    console.log(`创建帖子的用户ID: ${userId}`);
    
    // 验证用户是否存在
    const [userExists] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists || userExists.length === 0) {
      console.error(`用户ID ${userId} 不存在`);
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    console.log("用户验证通过");
    
    const { title, content, location, tags, images } = req.body;
    
    // 创建帖子摘要
    const summary = content.substring(0, 200) + (content.length > 200 ? '...' : '');

    console.log("准备插入帖子:", { title, content: content.substring(0, 30) + "...", userId, location });
    
    // 插入帖子
    const [result] = await connection.query(`
      INSERT INTO posts (title, content, summary, user_id, location)
      VALUES (?, ?, ?, ?, ?)
    `, [title, content, summary, userId, location]);

    const postId = result.insertId;
    console.log(`帖子创建成功, ID: ${postId}`);

    // 处理标签 (如果tags表存在)
    try {
      if (tags && tags.length > 0) {
        console.log("处理标签:", tags);
        // 检查tags表是否存在
        const [tables] = await connection.query("SHOW TABLES LIKE 'tags'");
        const tagsTableExists = tables.length > 0;
        
        if (tagsTableExists) {
          let tagArray = [];
          if (typeof tags === 'string') {
            tagArray = tags.split(',').filter(tag => tag.trim() !== '');
          } else if (Array.isArray(tags)) {
            tagArray = tags.filter(tag => tag && tag.trim && tag.trim() !== '');
          }
          
          console.log("处理标签数组:", tagArray);
          
          for (const tag of tagArray) {
            // 检查标签是否存在，不存在则创建
            let tagId;
            const [existingTags] = await connection.query('SELECT id FROM tags WHERE tag_name = ?', [tag.trim()]);
            
            if (existingTags.length > 0) {
              tagId = existingTags[0].id;
              console.log(`使用现有标签: ${tag.trim()}, ID: ${tagId}`);
            } else {
              const [newTag] = await connection.query('INSERT INTO tags (tag_name) VALUES (?)', [tag.trim()]);
              tagId = newTag.insertId;
              console.log(`创建新标签: ${tag.trim()}, ID: ${tagId}`);
            }
            
            // 检查post_tags表是否存在
            const [postTagsTables] = await connection.query("SHOW TABLES LIKE 'post_tags'");
            if (postTagsTables.length > 0) {
              // 关联帖子和标签
              await connection.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
              console.log(`关联帖子 ${postId} 和标签 ${tagId}`);
            } else {
              console.log("post_tags表不存在，跳过标签关联");
            }
          }
        } else {
          console.log("tags表不存在，跳过标签处理");
        }
      }
    } catch (tagError) {
      console.error("处理标签时发生错误:", tagError);
      // 继续执行不中断流程
    }

    // 处理图片链接
    let processedImages = []; // 保存处理后的图片URL
    
    try {
      // 首先，检查是否有临时上传的图片
      console.log(`检查用户ID=${userId}的临时上传帖子`);
      const [tempPosts] = await connection.query(`
        SELECT id FROM posts 
        WHERE user_id = ? AND title = 'temp_upload' AND content = 'temp_upload'
      `, [userId]);
      
      if (tempPosts.length > 0) {
        const tempPostId = tempPosts[0].id;
        console.log(`找到临时上传帖子，ID: ${tempPostId}，检查是否有图片`);
        
        // 获取临时帖子的图片
        const [tempImages] = await connection.query(`
          SELECT id, image_url FROM post_images
          WHERE post_id = ?
          ORDER BY id ASC
        `, [tempPostId]);
        
        console.log(`从临时帖子中找到${tempImages.length}张图片:`, 
          tempImages.map(img => `ID:${img.id}, URL:${img.image_url}`).join('; '));
        
        // 将临时帖子中的图片关联到新帖子
        if (tempImages.length > 0) {
          console.log(`开始将临时帖子中的图片迁移到新帖子 ${postId}`);
          
          for (const img of tempImages) {
            console.log(`处理图片 ID:${img.id}, URL:${img.image_url}`);
            
            await connection.query(`
              UPDATE post_images
              SET post_id = ?
              WHERE id = ?
            `, [postId, img.id]);
            
            processedImages.push(img.image_url);
            console.log(`图片 ${img.id} 从临时帖子迁移到新帖子 ${postId}`);
          }
          
          // 检查图片迁移结果
          const [migratedImages] = await connection.query(`
            SELECT id, image_url FROM post_images
            WHERE post_id = ?
          `, [postId]);
          
          console.log(`新帖子 ${postId} 现有图片 (${migratedImages.length}张):`, 
            migratedImages.map(img => `ID:${img.id}, URL:${img.image_url}`).join('; '));
          
          // 删除没有图片的临时帖子
          await connection.query(`
            DELETE FROM posts
            WHERE id = ? AND NOT EXISTS (
              SELECT 1 FROM post_images WHERE post_id = ?
            )
          `, [tempPostId, tempPostId]);
          
          console.log(`临时帖子处理完成`);
        } else {
          console.log(`临时帖子 ${tempPostId} 没有图片`);
        }
      } else {
        console.log(`未找到用户ID=${userId}的临时上传帖子`);
      }
      
      // 处理请求中直接提供的图片URLs
      if (images && Array.isArray(images) && images.length > 0) {
        console.log(`处理请求中直接提供的图片数组:`, images);
        
        // 检查post_images表是否存在
        const [tables] = await connection.query("SHOW TABLES LIKE 'post_images'");
        if (tables.length > 0) {
          for (const imageUrl of images) {
            if (!imageUrl || processedImages.includes(imageUrl)) {
              console.log(`跳过空URL或已处理的URL: ${imageUrl}`);
              continue;
            }
            
            console.log(`插入新图片URL: ${imageUrl}`);
            await connection.query(`
              INSERT INTO post_images (post_id, image_url)
              VALUES (?, ?)
            `, [postId, imageUrl]);
            
            processedImages.push(imageUrl);
            console.log(`添加图片: ${imageUrl.substring(0, 30)}...`);
          }
          
          // 检查新增图片的结果
          const [allImages] = await connection.query(`
            SELECT id, image_url FROM post_images
            WHERE post_id = ?
          `, [postId]);
          
          console.log(`帖子 ${postId} 最终图片 (${allImages.length}张):`, 
            allImages.map(img => `ID:${img.id}, URL:${img.image_url}`).join('; '));
        } else {
          console.log("post_images表不存在，跳过图片处理");
        }
      } else {
        console.log(`请求中没有直接提供图片`);
      }
    } catch (imageError) {
      console.error("处理图片时发生错误:", imageError);
      // 继续执行不中断流程
    }

    // 提交事务
    await connection.commit();
    console.log("数据库事务提交成功");

    // 获取新创建的帖子
    const [posts] = await connection.query(`
      SELECT p.*, u.username as user_name, u.avatar as user_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (posts.length === 0) {
      console.error(`无法找到刚创建的帖子，ID: ${postId}`);
      // 仍然返回成功，因为插入确实成功了
      return res.status(201).json({
        success: true,
        message: '创建帖子成功，但无法获取详情',
        data: {
          id: postId,
          title,
          content,
          summary,
          createdAt: new Date().toISOString(),
          author: {
            id: userId,
            name: req.user?.username || '用户',
            avatar: req.user?.avatar || ''
          },
          images: processedImages || [],
          likes: 0,
          comments: 0,
          location: location || '',
          tags: tags || []
        }
      });
    }

    const post = posts[0];
    console.log(`成功获取帖子详情, ID: ${post.id}`);
    
    // 获取帖子图片
    let postImages = [];
    try {
      // 检查post_images表是否存在
      const [tables] = await connection.query("SHOW TABLES LIKE 'post_images'");
      if (tables.length > 0) {
        const [images] = await connection.query(`
          SELECT image_url FROM post_images
          WHERE post_id = ?
          ORDER BY sort_order ASC
        `, [postId]);
        
        postImages = images.map(img => img.image_url);
      }
    } catch (err) {
      console.error("获取图片失败:", err);
      // 如果查询失败，使用之前处理的图片数组
      postImages = processedImages;
    }
    
    post.images = postImages;

    // 完成后释放连接
    connection.release();

    console.log("成功完成帖子创建流程");
    res.status(201).json({
      success: true,
      message: '创建帖子成功',
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary,
        createdAt: post.created_at,
        author: {
          id: post.user_id,
          name: post.user_name,
          avatar: post.user_avatar
        },
        images: post.images,
        likes: post.likes || 0,
        comments: post.comments || 0,
        location: post.location || '',
        tags: tags || ''
      }
    });
  } catch (error) {
    console.error('创建帖子失败:', error);
    console.log("错误堆栈:", error.stack);
    
    // 回滚事务
    await connection.rollback();
    connection.release();
    
    res.status(500).json({
      success: false,
      message: '创建帖子失败',
      error: error.message
    });
  } finally {
    // 确保连接被释放
    if (connection && connection.release) {
      try {
        // 检查连接是否仍然在事务中
        const [transactionActive] = await connection.query('SELECT @@in_transaction');
        if (transactionActive && transactionActive[0]['@@in_transaction'] === 1) {
          await connection.rollback();
          console.log("事务回滚");
        }
      } catch (err) {
        console.error("检查事务状态时出错:", err);
      }
      
      // 释放连接
      if (!connection.released) {
        connection.release();
        console.log("数据库连接已释放");
      }
    }
    
    console.log("========== 后端：结束创建帖子 ==========");
  }
};

// 创建消息通知
const createMessage = async (type, senderId, postId, receiverId, commentId = null, content = null) => {
  try {
    // 发送者不能给自己发通知
    if (senderId === receiverId) {
      console.log(`用户无需给自己发送通知: 用户ID=${senderId}, 类型=${type}`);
      return null;
    }

    console.log(`创建${type}消息通知: 发送者=${senderId}, 接收者=${receiverId}, 帖子=${postId}`);
    
    const connection = await db.pool.getConnection();
    const query = `
      INSERT INTO messages (type, sender_id, receiver_id, post_id, comment_id, content, is_read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
    
    const [result] = await connection.query(query, [
      type, 
      senderId, 
      receiverId, 
      postId, 
      commentId, 
      content
    ]);
    
    console.log(`消息通知创建成功，ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error(`创建消息通知失败: ${error.message}`);
    return null;
  }
};

// 点赞/取消点赞
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    console.log(`===== 处理点赞请求 - 帖子ID: ${postId}, 用户ID: ${userId} =====`);

    // 获取操作前的帖子信息和点赞状态
    const [posts] = await db.query(`
      SELECT p.*, 
        CASE WHEN pl.id IS NULL THEN 0 ELSE 1 END as is_liked
      FROM posts p
      LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
      WHERE p.id = ?
    `, [userId, postId]);
    
    if (posts.length === 0) {
      console.log(`帖子不存在 - ID: ${postId}`);
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const post = posts[0];
    const wasLiked = post.is_liked === 1;
    
    console.log(`操作前状态 - 点赞数: ${post.likes}, 是否已点赞: ${wasLiked ? '是' : '否'}`);
    
    // 使用数据库连接池获取连接，开启事务
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      if (wasLiked) {
        // 取消点赞
        console.log(`执行取消点赞操作`);
        await connection.query(`
          DELETE FROM post_likes
          WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);

        // 更新帖子点赞数
        await connection.query(`
          UPDATE posts
          SET likes = GREATEST(likes - 1, 0)
          WHERE id = ?
        `, [postId]);
      } else {
        // 添加点赞
        console.log(`执行点赞操作`);
        await connection.query(`
          INSERT INTO post_likes (post_id, user_id)
          VALUES (?, ?)
        `, [postId, userId]);

        // 更新帖子点赞数
        await connection.query(`
          UPDATE posts
          SET likes = likes + 1
          WHERE id = ?
        `, [postId]);
      }

      // 如果用户点赞了帖子，创建消息通知
      if (!wasLiked) {
        // 先获取帖子作者ID
        const [postOwner] = await connection.query(
          'SELECT user_id FROM posts WHERE id = ?',
          [postId]
        );
        
        if (postOwner.length > 0) {
          const receiverId = postOwner[0].user_id;
          // 创建点赞消息通知
          await createMessage('like', userId, postId, receiverId);
        }
      }

      // 提交事务
      await connection.commit();
      
      // 获取更新后的点赞数
      const [updatedPosts] = await connection.query(`
        SELECT likes FROM posts WHERE id = ?
      `, [postId]);
      
      if (updatedPosts.length === 0) {
        throw new Error('无法获取更新后的帖子信息');
      }
      
      const newLikesCount = updatedPosts[0].likes;
      const newIsLiked = !wasLiked;
      
      console.log(`操作后状态 - 点赞数: ${newLikesCount}, 是否已点赞: ${newIsLiked ? '是' : '否'}`);
      console.log(`===== 点赞操作成功完成 =====`);

      // 返回更新后的点赞状态
      res.json({
        success: true,
        data: {
          likes: newLikesCount,
          isLiked: newIsLiked
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败',
      error: error.message
    });
  }
};

// 获取帖子评论
exports.getComments = async (req, res) => {
  try {
    console.log("获取帖子评论，帖子ID:", req.params.id);
    const postId = req.params.id;
    
    // 获取一级评论（parent_id为NULL的评论）
    const [comments] = await db.query(`
      SELECT 
        pc.id, pc.content, pc.created_at, pc.parent_id,
        u.id as user_id, u.username as user_name, u.avatar as user_avatar
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ? AND pc.parent_id IS NULL
      ORDER BY pc.created_at DESC
    `, [postId]);
    
    // 处理每条评论的回复
    const formattedComments = [];
    for (const comment of comments) {
      // 获取该评论的回复
      const [replies] = await db.query(`
        SELECT 
          pc.id, pc.content, pc.created_at,
          u.id as user_id, u.username as user_name, u.avatar as user_avatar
        FROM post_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.parent_id = ?
        ORDER BY pc.created_at ASC
      `, [comment.id]);
      
      // 格式化回复数据
      const formattedReplies = replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.created_at,
        author: {
          id: reply.user_id,
          name: reply.user_name || '未知用户',
          avatar: reply.user_avatar || ''
        }
      }));
      
      // 格式化评论数据
      formattedComments.push({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          id: comment.user_id,
          name: comment.user_name || '未知用户',
          avatar: comment.user_avatar || ''
        },
        replies: formattedReplies
      });
    }
    
    console.log(`共找到 ${formattedComments.length} 条评论`);
    
    // 返回格式化后的评论数据
    res.json({
      success: true,
      data: formattedComments
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论失败',
      error: error.message
    });
  }
};

// 添加评论
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content, parentId } = req.body;
    
    // 验证内容
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }
    
    // 检查帖子是否存在
    const [posts] = await db.query(`SELECT id FROM posts WHERE id = ?`, [postId]);
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 如果有parentId，检查父评论是否存在
    if (parentId) {
      const [parentComments] = await db.query(`
        SELECT id FROM post_comments
        WHERE id = ? AND post_id = ?
      `, [parentId, postId]);
      
      if (parentComments.length === 0) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
    }
    
    // 建立数据库连接并开始事务
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 添加评论
      const [result] = await connection.query(`
        INSERT INTO post_comments (post_id, user_id, content, parent_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [postId, userId, content, parentId || null]);
      
      // 更新帖子评论数
      await connection.query(`
        UPDATE posts
        SET comments = comments + 1
        WHERE id = ?
      `, [postId]);
      
      // 获取帖子作者ID
      const [postOwner] = await connection.query(
        'SELECT user_id FROM posts WHERE id = ?',
        [postId]
      );
      
      if (postOwner.length > 0) {
        const receiverId = postOwner[0].user_id;
        // 创建评论消息通知
        await createMessage('comment', userId, postId, receiverId, result.insertId, content);
      }
      
      // 提交事务
      await connection.commit();
      
      // 获取用户信息
      const [users] = await connection.query(`
        SELECT id, username, avatar FROM users WHERE id = ?
      `, [userId]);
      
      const user = users[0] || { id: userId, username: '未知用户', avatar: '' };
      
      // 返回新添加的评论
      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          content,
          createdAt: new Date().toISOString(),
          author: {
            id: user.id,
            name: user.username,
            avatar: user.avatar || ''
          },
          replies: parentId ? undefined : []
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      success: false,
      message: '添加评论失败',
      error: error.message
    });
  }
};

// 删除评论
exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user.id;
    
    // 获取评论信息并验证所有权
    const [comments] = await db.query(`
      SELECT pc.*, 
        (SELECT COUNT(*) FROM post_comments WHERE parent_id = pc.id) as reply_count
      FROM post_comments pc
      WHERE pc.id = ? AND pc.post_id = ?
    `, [commentId, postId]);
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    const comment = comments[0];
    
    // 检查是否有删除权限（评论作者或管理员）
    if (comment.user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }
    
    // 计算删除的评论总数（包括回复）
    const totalCommentsToDelete = 1 + (comment.reply_count || 0);
    
    // 建立数据库连接并开始事务
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 如果是父评论，先删除所有回复
      if (comment.parent_id === null) {
        await connection.query(`
          DELETE FROM post_comments
          WHERE parent_id = ?
        `, [commentId]);
      }
      
      // 删除评论
      await connection.query(`
        DELETE FROM post_comments
        WHERE id = ?
      `, [commentId]);
      
      // 更新帖子评论数
      await connection.query(`
        UPDATE posts
        SET comments = GREATEST(comments - ?, 0)
        WHERE id = ?
      `, [totalCommentsToDelete, postId]);
      
      // 提交事务
      await connection.commit();
      
      res.json({
        success: true,
        data: true,
        message: '评论已删除'
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败',
      error: error.message
    });
  }
};

// 处理图片上传
exports.uploadImage = async (req, res) => {
  try {
    console.log('===== 开始处理图片上传 =====');
    console.log('请求体信息:', {
      hasFile: !!req.file,
      hasBody: !!req.body,
      userId: req.user?.id
    });
    
    // 检查是否有文件上传
    if (!req.file) {
      console.log('未检测到上传文件');
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    
    // 检查是否登录
    if (!req.user || !req.user.id) {
      console.log('用户未登录');
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    // 获取文件信息
    const file = req.file;
    console.log('接收到上传文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      filename: file.filename,
      path: file.path
    });
    
    // 构建文件URL路径
    const baseUrl = req.protocol + '://' + req.get('host');
    const relativeUrl = `/uploads/forum/${file.filename}`;
    const imageUrl = relativeUrl; // 使用相对URL便于前端处理
    const fullUrl = baseUrl + relativeUrl; // 完整URL
    
    console.log(`生成图片URL:`, {
      相对URL: imageUrl,
      完整URL: fullUrl,
      协议: req.protocol,
      主机: req.get('host')
    });
    
    // 保存图片URL到临时表或缓存，以便后续创建帖子时使用
    // 这里我们可以选择性地提前保存到post_images表中
    let imageId = null;
    
    try {
      // 将图片信息保存到临时表
      const connection = await db.pool.getConnection();
      
      // 创建一个临时帖子记录，或使用现有临时帖子记录
      let postId = null;
      
      try {
        // 检查该用户是否有临时帖子
        const [tempPosts] = await connection.query(`
          SELECT id FROM posts 
          WHERE user_id = ? AND title = 'temp_upload' AND content = 'temp_upload'
        `, [req.user.id]);
        
        if (tempPosts.length > 0) {
          // 使用已有临时帖子
          postId = tempPosts[0].id;
          console.log(`使用已有临时帖子ID: ${postId}`);
        } else {
          // 创建新的临时帖子
          const [result] = await connection.query(`
            INSERT INTO posts (title, content, summary, user_id, created_at) 
            VALUES ('temp_upload', 'temp_upload', 'temp_upload', ?, NOW())
          `, [req.user.id]);
          
          postId = result.insertId;
          console.log(`创建新临时帖子ID: ${postId}`);
        }
        
        // 保存图片URL到post_images表
        const [imageResult] = await connection.query(`
          INSERT INTO post_images (post_id, image_url, sort_order) 
          VALUES (?, ?, 0)
        `, [postId, imageUrl]);
        
        imageId = imageResult.insertId;
        console.log(`已保存图片到数据库, ID: ${imageId}, URL: ${imageUrl}`);
        
        // 查询临时帖子中的所有图片，用于日志
        const [existingImages] = await connection.query(`
          SELECT id, image_url FROM post_images
          WHERE post_id = ?
        `, [postId]);
        
        console.log(`临时帖子ID ${postId} 现有图片 (${existingImages.length}张):`, 
          existingImages.map(img => `ID:${img.id}, URL:${img.image_url}`).join('; '));
        
      } catch (dbError) {
        console.error('数据库操作失败:', dbError);
      } finally {
        connection.release();
      }
    } catch (dbConnError) {
      console.error('数据库连接失败:', dbConnError);
      // 不中断流程，继续返回上传成功
    }
    
    // 返回上传成功的图片URL
    console.log('===== 图片上传处理完成 =====');
    res.json({
      success: true,
      data: {
        url: imageUrl,
        imageUrl: imageUrl, // 添加额外的格式以提高兼容性
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        fullUrl: fullUrl,
        imageId: imageId
      },
      message: '图片上传成功'
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({
      success: false,
      message: '上传图片失败',
      error: error.message
    });
  }
};