/**
 * 该脚本用于从现有的点赞和评论数据生成历史消息记录
 */

const db = require('../config/database');

// 创建消息
const createMessage = async (type, senderId, postId, receiverId, commentId = null, content = null) => {
  try {
    // 发送者不能给自己发通知
    if (senderId === receiverId) {
      console.log(`用户无需给自己发送通知: 用户ID=${senderId}, 类型=${type}`);
      return null;
    }

    console.log(`创建${type}消息通知: 发送者=${senderId}, 接收者=${receiverId}, 帖子=${postId}`);
    
    const connection = await db.pool.getConnection();
    
    try {
      const query = `
        INSERT INTO messages (type, sender_id, receiver_id, post_id, comment_id, content, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
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
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`创建消息通知失败: ${error.message}`);
    return null;
  }
};

// 处理现有点赞数据
const generateLikeMessages = async () => {
  console.log('===== 开始处理点赞数据 =====');
  const connection = await db.pool.getConnection();
  
  try {
    // 获取所有点赞数据
    const [likes] = await connection.query(`
      SELECT pl.user_id as sender_id, p.user_id as receiver_id, pl.post_id, pl.created_at
      FROM post_likes pl
      JOIN posts p ON pl.post_id = p.id
      WHERE pl.user_id != p.user_id
    `);
    
    console.log(`找到 ${likes.length} 条点赞数据需要处理`);
    
    // 为每条点赞创建消息
    let successCount = 0;
    for (const like of likes) {
      try {
        await createMessage(
          'like',
          like.sender_id,
          like.post_id,
          like.receiver_id
        );
        successCount++;
      } catch (error) {
        console.error(`处理点赞ID=${like.id}失败:`, error);
      }
    }
    
    console.log(`成功处理 ${successCount}/${likes.length} 条点赞数据`);
    console.log('===== 点赞数据处理完成 =====');
  } catch (error) {
    console.error('处理点赞数据失败:', error);
  } finally {
    connection.release();
  }
};

// 处理现有评论数据
const generateCommentMessages = async () => {
  console.log('===== 开始处理评论数据 =====');
  const connection = await db.pool.getConnection();
  
  try {
    // 获取所有评论数据
    const [comments] = await connection.query(`
      SELECT pc.id as comment_id, pc.user_id as sender_id, p.user_id as receiver_id, 
             pc.post_id, pc.content, pc.created_at
      FROM post_comments pc
      JOIN posts p ON pc.post_id = p.id
      WHERE pc.user_id != p.user_id AND pc.parent_id IS NULL
    `);
    
    console.log(`找到 ${comments.length} 条评论数据需要处理`);
    
    // 为每条评论创建消息
    let successCount = 0;
    for (const comment of comments) {
      try {
        await createMessage(
          'comment',
          comment.sender_id,
          comment.post_id,
          comment.receiver_id,
          comment.comment_id,
          comment.content
        );
        successCount++;
      } catch (error) {
        console.error(`处理评论ID=${comment.comment_id}失败:`, error);
      }
    }
    
    console.log(`成功处理 ${successCount}/${comments.length} 条评论数据`);
    console.log('===== 评论数据处理完成 =====');
  } catch (error) {
    console.error('处理评论数据失败:', error);
  } finally {
    connection.release();
  }
};

// 主函数
const main = async () => {
  try {
    console.log('开始生成历史消息数据...');
    await generateLikeMessages();
    await generateCommentMessages();
    console.log('历史消息数据生成完成！');
    process.exit(0);
  } catch (error) {
    console.error('生成历史消息数据失败:', error);
    process.exit(1);
  }
};

// 执行主函数
main(); 