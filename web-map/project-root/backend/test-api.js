const http = require('http');

const testApi = (endpoint, method = 'GET', token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      console.log(`测试 ${method} ${endpoint} - 状态码: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          console.log('响应:', JSON.stringify(parsedData, null, 2));
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          console.log('原始响应:', data);
          resolve({ statusCode: res.statusCode, data: { raw: data } });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`请求错误: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
};

const main = async () => {
  try {
    // 先测试根路由
    await testApi('/', 'GET');
    
    // 测试API根路由
    await testApi('/api', 'GET');
    
    // 测试消息API (无令牌，预期返回401)
    await testApi('/api/messages', 'GET');
    
    console.log('\n测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
};

main(); 