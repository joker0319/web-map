const db = require('../config/database');

// 获取用户消息列表
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    console.log(`获取用户ID=${userId}的消息，类型=${type}，页码=${page}`);

    const connection = await db.pool.getConnection();
    
    let query = `
      SELECT 
        m.id, 
        m.type, 
        m.content, 
        m.is_read as isRead, 
        m.created_at as createdAt,
        p.id as post_id, 
        p.title as post_title,
        s.id as sender_id, 
        s.username as sender_name, 
        s.avatar as sender_avatar,
        pc.id as comment_id
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN posts p ON m.post_id = p.id
      LEFT JOIN post_comments pc ON m.comment_id = pc.id
      WHERE m.receiver_id = ?
    `;

    const params = [userId];

    // 根据类型过滤
    if (type !== 'all') {
      if (type === 'unread') {
        query += ` AND m.is_read = 0`;
      } else {
        query += ` AND m.type = ?`;
        params.push(type);
      }
    }

    // 添加排序和分页
    query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    console.log('执行查询:', query);
    console.log('参数:', params);

    const [messages] = await connection.query(query, params);
    connection.release();
    
    // 格式化消息数据以符合前端期望的格式
    const formattedMessages = messages.map(message => ({
      id: message.id,
      type: message.type,
      content: message.content,
      isRead: !!message.isRead,
      createdAt: message.createdAt,
      post: {
        id: message.post_id,
        title: message.post_title
      },
      sender: {
        id: message.sender_id,
        name: message.sender_name,
        avatar: message.sender_avatar || null
      },
      commentId: message.comment_id
    }));

    console.log(`成功获取${formattedMessages.length}条消息`);
    
    res.status(200).json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error(`获取消息失败: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '获取消息失败',
      error: error.message
    });
  }
};

// 标记消息为已读
exports.markAsRead = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    console.log(`标记消息已读，用户ID=${userId}，消息ID=${messageId}`);
    
    // 确保消息属于当前用户
    const [message] = await connection.query(
      'SELECT id FROM messages WHERE id = ? AND receiver_id = ?',
      [messageId, userId]
    );

    if (message.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限操作'
      });
    }

    // 标记为已读
    await connection.query(
      'UPDATE messages SET is_read = 1 WHERE id = ?',
      [messageId]
    );

    res.status(200).json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error(`标记消息已读失败: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '标记消息已读失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// 标记所有消息为已读
exports.markAllAsRead = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    const userId = req.user.id;
    
    console.log(`标记所有消息已读，用户ID=${userId}`);
    
    // 标记所有消息为已读
    await connection.query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '所有消息已标记为已读'
    });
  } catch (error) {
    console.error(`标记所有消息已读失败: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '标记所有消息已读失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// 删除消息
exports.deleteMessage = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    console.log(`删除消息，用户ID=${userId}，消息ID=${messageId}`);
    
    // 确保消息属于当前用户
    const [message] = await connection.query(
      'SELECT id FROM messages WHERE id = ? AND receiver_id = ?',
      [messageId, userId]
    );

    if (message.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限操作'
      });
    }

    // 删除消息
    await connection.query(
      'DELETE FROM messages WHERE id = ?',
      [messageId]
    );

    res.status(200).json({
      success: true,
      message: '消息已删除'
    });
  } catch (error) {
    console.error(`删除消息失败: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '删除消息失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// 获取未读消息数量
exports.getUnreadCount = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    const userId = req.user.id;

    console.log(`获取未读消息数量，用户ID=${userId}`);
    
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );

    const unreadCount = result[0].count;

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error(`获取未读消息数量失败: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '获取未读消息数量失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
}; 