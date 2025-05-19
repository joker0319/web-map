// 智谱AI接口类型定义
interface ChatGLMRequest {
  prompt: string;
  history?: Array<[string, string]>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  system?: string;
}

interface ChatGLMResponse {
  response: string;
  history: Array<[string, string]>;
  task_id?: string;
  task_status?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class AiService {
  private apiKey: string = 'ae2167b96ac74d0583464f4811e90e9f.2Hyf29BEBttYEJOC';
  private modelName: string = 'chatglm_turbo';
  private proxyUrl: string = 'http://localhost:3100/api/chat'; // 代理服务器URL
  private systemPrompt: string = `你是一个专业的户外徒步助手，擅长提供徒步路线推荐、天气建议和户外装备指导。
请遵循以下规则：
1. 优先回答与户外徒步、登山、露营相关的问题
2. 提供安全、实用的户外建议
3. 对于路线推荐，考虑难度、季节和景观特点
4. 对于天气建议，根据当前季节提供合理的穿着和准备建议
5. 对于装备清单，根据活动类型和难度提供适当的装备推荐
6. 用友好、专业的口吻交流
7. 回答尽量简明扼要，重点突出
8. 所有回答必须用中文`;

  /**
   * 发送消息到智谱AI并获取回复
   * @param message 用户消息
   * @param history 历史对话记录
   * @returns 智谱AI的回复
   */
  async sendMessage(message: string, history: Array<[string, string]> = []): Promise<string> {
    try {
      console.log('发送请求到代理服务器:', this.proxyUrl);
      
      const payload: ChatGLMRequest = {
        prompt: message,
        history: history,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        system: this.systemPrompt
      };
      
      console.log('请求参数:', JSON.stringify({
        prompt: message,
        temperature: 0.7,
        history: history.length
      }));
      
      // 尝试通过代理服务器发送请求
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应错误:', errorText);
        throw new Error(`API调用失败: ${response.status} ${response.statusText}, 详情: ${errorText}`);
      }
      
      const data: ChatGLMResponse = await response.json();
      console.log('代理服务器响应成功');
      return data.response;
    } catch (error) {
      console.error('调用智谱AI接口失败:', error);
      // 出错时返回模拟响应
      return `抱歉，我暂时无法连接到智能服务。您的问题是关于"${message}"，请稍后再试或联系管理员检查网络连接。`;
    }
  }
}

export const aiService = new AiService(); 