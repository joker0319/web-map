import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user.store';
import { authService } from '@/services/auth.service';

// 响应类型
interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 请求配置选项
interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  withToken?: boolean;
  retry?: boolean;
}

// 获取存储的令牌
const getToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

// 设置令牌
const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// 获取刷新令牌
const getRefreshToken = (): string => {
  return localStorage.getItem('refresh_token') || '';
};

// 设置刷新令牌
const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

// 清除令牌
const clearTokens = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

// 添加请求调试函数
const logRequestInfo = (url: string, options: RequestInit) => {
  console.log('请求前认证状态:', {
    url,
    hasAuth: options.headers && 'Authorization' in (options.headers as Record<string, string>),
    token: options.headers && 'Authorization' in (options.headers as Record<string, string>) 
      ? '存在token' : '无token'
  });
  
  console.log('本地存储Token状态:', {
    authToken: !!localStorage.getItem('auth_token'),
    refreshToken: !!localStorage.getItem('refresh_token') 
  });
};

// 添加响应调试函数
const logResponseInfo = (url: string, response: Response) => {
  console.log('请求成功响应:', {
    url,
    status: response.status,
    statusText: response.statusText,
  });
};

// 添加错误调试函数
const logErrorInfo = (url: string, error: any) => {
  console.error('请求响应错误:', {
    url,
    message: error.message,
    stack: error.stack
  });
  
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    console.warn('⚠️ 网络请求失败，可能是网络问题或CORS限制');
  } 
  
  if (error.response?.status === 401) {
    console.warn('⚠️ 检测到401错误，但暂不执行自动登出');
  }
};

// 添加更多调试信息以便跟踪API响应状态和格式
async function parseResponse(response: Response): Promise<any> {
  try {
    console.log(`[请求工具] 正在解析响应，状态码: ${response.status}, URL: ${response.url}`);
    const contentType = response.headers.get('content-type');
    console.log(`[请求工具] 响应Content-Type: ${contentType}`);
    
    // 检查是否为JSON响应
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      console.log(`[请求工具] 响应文本: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      
      try {
        // 直接返回解析后的原始JSON响应，不进行额外包装
        return JSON.parse(text);
      } catch (e) {
        console.error('[请求工具] 无法解析JSON响应:', e);
        return { success: false, message: '无法解析服务器响应' };
      }
    } else {
      // 非JSON响应
      const text = await response.text();
      console.log(`[请求工具] 非JSON响应: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      return { success: false, message: '服务器响应不是JSON格式' };
    }
  } catch (error) {
    console.error('[请求工具] 解析响应时出错:', error);
    return { success: false, message: '解析响应时出错' };
  }
}

// 请求函数
export async function request<T = any>({
  url,
  method,
  data,
  params,
  headers = {},
  responseType = 'json',
  withToken = true,
  retry = true,
}: RequestOptions): Promise<T> {
  let result: any;
  
  // 准备请求配置
  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    } as Record<string, string>,
  };

  // 添加认证令牌
  if (withToken) {
    const token = getToken();
    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // 添加请求体
  if (data) {
    // 检查是否为FormData类型
    if (data instanceof FormData) {
      requestConfig.body = data;
      // 使用类型断言确保安全访问
      const headerRecord = requestConfig.headers as Record<string, string>;
      delete headerRecord['Content-Type'];
    } else {
      requestConfig.body = JSON.stringify(data);
    }
  }

  // 处理查询参数
  if (params) {
    const queryString = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // 添加请求日志
  logRequestInfo(url, requestConfig);

  // 如果请求URL包含敏感操作（如发帖），额外检查认证状态
  if (url.includes('/api/forum/posts') && method === 'POST') {
    console.log('===== 敏感操作：发布帖子，检查认证状态 =====');
    console.log('当前认证信息:', {
      authToken: localStorage.getItem('auth_token'),
      tokenExists: !!localStorage.getItem('auth_token')
    });
    
    if (!localStorage.getItem('auth_token')) {
      console.warn('⚠️ 警告: 尝试发布帖子但无认证令牌!');
      throw new Error('未登录，请先登录后再发布帖子');
    }
  }

  try {
    // 发送请求
    const response = await fetch(url, requestConfig);
    
    // 添加响应日志
    logResponseInfo(url, response);

    // 处理令牌失效
    if (response.status === 401 && retry) {
      // 尝试刷新令牌
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResult = await authService.refreshToken(refreshToken);
          setToken(refreshResult.token);
          setRefreshToken(refreshResult.refreshToken);

          // 使用新令牌重试请求
          return request<T>({
            ...arguments[0],
            retry: false, // 防止无限循环重试
          });
        } catch (refreshError) {
          // 如果刷新令牌失败，清除所有令牌并跳转到登录页
          clearTokens();
          const userStore = useUserStore();
          userStore.clearUser();
          window.location.href = '/auth/login';
          throw new Error('登录已过期，请重新登录');
        }
      } else {
        // 无刷新令牌，直接跳转登录页
        window.location.href = '/auth/login';
        throw new Error('请先登录');
      }
    }

    // 处理HTTP错误
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    // 根据响应类型处理响应
    if (responseType === 'json') {
      result = await parseResponse(response);
    } else if (responseType === 'text') {
      result = await response.text();
    } else if (responseType === 'blob') {
      result = await response.blob();
    } else if (responseType === 'arrayBuffer') {
      result = await response.arrayBuffer();
    } else if (responseType === 'formData') {
      result = await response.formData();
    }

    // 处理业务错误
    if (responseType === 'json') {
      // 记录完整响应
      console.log('完整JSON响应:', result);
      
      // 检查响应中的success字段 - 后端使用success判断是否成功
      if (result && result.success === false) {
        const errorMsg = result.message || '请求失败';
        // 移除页面错误提示，仅在控制台记录
        console.error('业务错误:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // 如果是成功响应，检查几种可能的数据格式
      if (result && result.success === true) {
        // 标准格式：{success: true, data: {}}
        return result.data;
      } else if (result && result.code === 200) {
        // 备用格式1：{code: 200, data: {}}
        return result.data;
      } else if (result && typeof result.success === 'undefined') {
        // 备用格式2：如果没有success字段，直接返回整个结果
        return result;
      }
      
      // 默认返回
      return result as T;
    }
  } catch (error: unknown) {
    // 添加错误日志
    logErrorInfo(url, error);
    
    // 不在页面上显示错误消息，仅在控制台记录
    // const errorMessage = error instanceof Error ? error.message : '请求发生错误';
    // Message.error(errorMessage);
    
    // 仍然抛出错误，让调用者可以捕获并处理
    throw error;
  }
  
  // 添加这行作为默认返回
  return result as T;
}

// 简便方法
export const get = <T = any>(url: string, params?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'GET', params, ...options });

export const post = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'POST', data, ...options });

export const put = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'PUT', data, ...options });

export const del = <T = any>(url: string, options?: Partial<RequestOptions>) => {
  console.log(`发送DELETE请求到: ${url}`, {
    时间: new Date().toISOString(),
    完整URL: url.startsWith('http') ? url : `${window.location.origin}${url}`
  });
  return request<T>({ url, method: 'DELETE', ...options });
}

export const patch = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'PATCH', data, ...options }); 