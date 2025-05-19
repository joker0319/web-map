/**
 * 该脚本用于测试消息数据
 */

const db = require('./config/database');

// 查询消息数据
const getMessages = async () => {
  console.log('===== 开始查询消息数据 =====');
  const connection = await db.pool.getConnection();
  
  try {
    // 查询消息表的结构
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM messages
    `);
    
    console.log(`消息表结构 (${columns.length} 列):`);
    columns.forEach(col => {
      console.log(` - ${col.Field}: ${col.Type}, ${col.Null === 'YES' ? '可为空' : '不可为空'}, 默认值: ${col.Default || '无'}`);
    });
    
    // 查询消息数量
    const [countResult] = await connection.query(`
      SELECT COUNT(*) as count FROM messages
    `);
    
    console.log(`\n消息总数: ${countResult[0].count}条`);
    
    if (countResult[0].count > 0) {
      // 查询最新10条消息，包含关联信息
      const [messages] = await connection.query(`
        SELECT 
          m.id, 
          m.type, 
          m.content, 
          m.is_read as isRead, 
          m.created_at as createdAt,
          m.receiver_id,
          p.id as post_id, 
          p.title as post_title,
          s.id as sender_id, 
          s.username as sender_name,
          pc.id as comment_id
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN posts p ON m.post_id = p.id
        LEFT JOIN post_comments pc ON m.comment_id = pc.id
        ORDER BY m.created_at DESC
        LIMIT 10
      `);
      
      console.log(`\n最新 ${messages.length} 条消息:`);
      messages.forEach((msg, index) => {
        console.log(`\n消息 #${index + 1} (ID: ${msg.id}):`);
        console.log(` - 类型: ${msg.type}`);
        console.log(` - 已读状态: ${msg.isRead ? '已读' : '未读'}`);
        console.log(` - 接收者ID: ${msg.receiver_id}`);
        console.log(` - 创建时间: ${msg.createdAt}`);
        console.log(` - 帖子ID: ${msg.post_id}`);
        console.log(` - 帖子标题: ${msg.post_title}`);
        console.log(` - 发送者ID: ${msg.sender_id}`);
        console.log(` - 发送者名称: ${msg.sender_name}`);
        if (msg.type === 'comment') {
          console.log(` - 评论ID: ${msg.comment_id}`);
          console.log(` - 评论内容: ${msg.content}`);
        }
      });
    }
    
    console.log('\n===== 消息数据查询完成 =====');
  } catch (error) {
    console.error('查询消息数据失败:', error);
  } finally {
    connection.release();
  }
};

// 主函数
const main = async () => {
  try {
    await getMessages();
    process.exit(0);
  } catch (error) {
    console.error('执行测试脚本失败:', error);
    process.exit(1);
  }
};

// 执行主函数
main(); 