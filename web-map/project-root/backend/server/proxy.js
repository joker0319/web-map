const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3100;

// 启用CORS中间件
app.use(cors());
app.use(express.json());

// 智谱AI代理路由
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = 'ae2167b96ac74d0583464f4811e90e9f.2Hyf29BEBttYEJOC';
    const modelName = 'chatglm_turbo';
    const url = `https://open.bigmodel.cn/api/paas/v3/model-api/${modelName}/chat`;
    
    console.log('收到前端请求:', req.body);
    
    // 转发请求到智谱AI
    const response = await axios.post(url, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('智谱AI响应成功');
    res.json(response.data);
  } catch (error) {
    console.error('调用智谱AI接口失败:', error.message);
    
    // 返回详细的错误信息
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error('错误响应数据:', error.response.data);
      console.error('错误状态码:', error.response.status);
      res.status(error.response.status).json({
        error: true,
        message: error.message,
        data: error.response.data
      });
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      console.error('没有收到响应');
      res.status(500).json({
        error: true,
        message: '请求已发送但未收到响应',
        details: error.message
      });
    } else {
      // 设置请求时发生了一些事情，触发了错误
      console.error('请求配置错误');
      res.status(500).json({
        error: true,
        message: '请求配置错误',
        details: error.message
      });
    }
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`智谱AI代理服务器运行在 http://localhost:${PORT}`);
}); 