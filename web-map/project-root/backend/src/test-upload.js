/**
 * 测试图片上传功能
 */
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

// 检查上传目录
async function checkUploadDirectory() {
  console.log('===== 检查上传目录 =====');
  const uploadDir = path.join(__dirname, '../uploads/forum');
  
  try {
    // 检查目录是否存在
    const exists = fs.existsSync(uploadDir);
    console.log(`上传目录 ${uploadDir} ${exists ? '存在' : '不存在'}`);
    
    if (!exists) {
      // 创建目录
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`已创建上传目录: ${uploadDir}`);
    }
    
    // 检查目录权限
    try {
      const testFilePath = path.join(uploadDir, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test write permission');
      console.log('写入测试文件成功，目录可写');
      
      // 清理测试文件
      fs.unlinkSync(testFilePath);
      console.log('删除测试文件成功');
    } catch (err) {
      console.error('目录权限检查失败:', err.message);
      return false;
    }
    
    // 列出目录内容
    const files = fs.readdirSync(uploadDir);
    console.log(`目录中的文件数量: ${files.length}`);
    
    return true;
  } catch (err) {
    console.error('检查上传目录失败:', err.message);
    return false;
  }
}

// 检查数据库post_images表
async function checkPostImagesTable() {
  console.log('===== 检查post_images表 =====');
  
  try {
    // 检查表是否存在
    const [tables] = await db.query("SHOW TABLES LIKE 'post_images'");
    if (tables.length === 0) {
      console.error('post_images表不存在!');
      return false;
    }
    
    console.log('post_images表存在');
    
    // 检查表结构
    const [columns] = await db.query("SHOW COLUMNS FROM post_images");
    console.log('表结构:', columns.map(col => col.Field));
    
    // 检查表数据
    const [count] = await db.query("SELECT COUNT(*) as count FROM post_images");
    console.log(`post_images表记录数: ${count[0].count}`);
    
    return true;
  } catch (err) {
    console.error('检查post_images表失败:', err.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('===== 开始测试图片上传功能 =====');
  
  // 检查上传目录
  const dirResult = await checkUploadDirectory();
  console.log(`上传目录检查: ${dirResult ? '通过' : '失败'}`);
  
  // 检查数据库
  const dbResult = await checkPostImagesTable();
  console.log(`数据库检查: ${dbResult ? '通过' : '失败'}`);
  
  console.log('===== 测试完成 =====');
  
  // 测试结果
  if (dirResult && dbResult) {
    console.log('✅ 所有检查通过，图片上传功能应该可以正常工作');
  } else {
    console.log('❌ 部分检查失败，图片上传功能可能无法正常工作');
  }
  
  // 关闭数据库连接
  try {
    await db.pool.end();
    console.log('数据库连接已关闭');
  } catch (err) {
    console.error('关闭数据库连接失败:', err);
  }
}

// 运行测试
runTests().catch(console.error); 