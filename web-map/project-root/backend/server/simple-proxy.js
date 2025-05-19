const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3100;

// 启用CORS中间件
app.use(cors());
app.use(express.json());

// 添加根路由用于健康检查
app.get('/', (req, res) => {
  res.send('智谱AI代理服务器正在运行');
});

// 智谱AI代理路由
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = 'ae2167b96ac74d0583464f4811e90e9f.2Hyf29BEBttYEJOC';
    const modelName = 'chatglm_turbo';
    // 修正API URL
    const url = `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
    
    console.log('收到前端请求', req.body);
    
    // 构建符合zhipuai v4版本的请求体
    const zhipuaiPayload = {
      model: modelName,
      messages: [
        {
          role: "system",
          content: req.body.system || "你是一个专业的户外徒步助手，擅长提供徒步路线推荐、天气建议和户外装备指导。"
        },
        {
          role: "user",
          content: req.body.prompt
        }
      ],
      temperature: req.body.temperature || 0.7,
      top_p: req.body.top_p || 0.9,
      max_tokens: req.body.max_tokens || 1024
    };
    
    // 如果有历史记录，添加到messages中
    if (req.body.history && req.body.history.length > 0) {
      // 转换历史记录格式 [user, assistant] 对
      for (const [userMsg, assistantMsg] of req.body.history) {
        zhipuaiPayload.messages.splice(1, 0, 
          { role: "user", content: userMsg },
          { role: "assistant", content: assistantMsg }
        );
      }
    }
    
    console.log('发送到智谱AI的请求:', JSON.stringify(zhipuaiPayload, null, 2));
    
    // 转发请求到智谱AI
    const response = await axios.post(url, zhipuaiPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('智谱AI响应成功');
    
    // 转换响应格式
    const formattedResponse = {
      response: response.data.choices[0].message.content,
      history: req.body.history || []
    };
    
    res.json(formattedResponse);
  } catch (error) {
    console.error('调用智谱AI接口失败:', error.message);
    if (error.response) {
      console.error('错误响应详情:', error.response.data);
    }
    res.status(500).json({
      error: true,
      message: error.message,
      details: error.response ? error.response.data : '未知错误'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`智谱AI代理服务器运行在 http://localhost:${PORT}`);
}); 