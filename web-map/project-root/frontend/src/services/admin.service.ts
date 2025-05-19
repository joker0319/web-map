import { get, del } from '../utils/request';

// 帖子信息接口
export interface AdminPost {
  id: number;
  title: string;
  author: {
    id: number;
    name: string;
  };
  createTime: string;
  status: string;
  likes: number;
  comments: number;
}

// 用户信息接口
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  createTime: string;
  status: string;
  isAdmin: boolean;
  avatar?: string;
}

// 路线信息接口
export interface AdminRoute {
  id: number;
  name: string;
  difficulty: string;
  length: number;
  status: string;
  createdAt: string;
  description?: string;
}

// 获取路线接口响应扩展
interface RouteResponse {
  data: AdminRoute[];
  total: number;
  isRealData?: boolean;
  notice?: string;
}

// 管理服务类
export class AdminService {
  // 获取帖子列表
  async getPosts(page: number = 1, limit: number = 10, search?: string): Promise<{data: AdminPost[], total: number}> {
    try {
      console.log(`===== 获取帖子列表 - 页码=${page}，条数=${limit}，搜索=${search || '无'} =====`);
      
      const response = await get<any>(
        '/api/admin/posts',
        { page, limit, search }
      );
      
      console.log('==== API原始响应 ====', response);
      
      // 直接检查是否有total字段，这是关键信息
      let totalCount = 0;
      
      // 尝试从不同的响应格式中提取total值
      if (response && typeof response === 'object') {
        // 标准响应格式
        if ('total' in response && typeof response.total === 'number') {
          totalCount = response.total;
          console.log(`从标准格式提取total: ${totalCount}`);
        } 
        // 从headers中提取
        else if (response.headers && response.headers.get) {
          const totalHeader = response.headers.get('X-Total-Count');
          if (totalHeader) {
            totalCount = parseInt(totalHeader);
            console.log(`从headers提取total: ${totalCount}`);
          }
        }
      }
      
      // 处理数据部分
      let postsData: AdminPost[] = [];
      
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        // 标准格式：{data: [...], total: 12}
        postsData = response.data;
        console.log(`从标准格式提取数据，条数: ${postsData.length}`);
      } 
      else if (Array.isArray(response)) {
        // 数组格式：[{...}, {...}]
        postsData = response;
        console.log(`从数组格式提取数据，条数: ${postsData.length}`);
        
        // 如果没有获取到total，至少要知道当前分页结果数据量
        if (totalCount === 0) {
          // 当前页如果返回了最大的limit数量，可能还有更多数据
          if (postsData.length >= limit) {
            totalCount = page * limit + 1; // 保守估计还有更多
            console.log(`无法获取确切total，临时估计为: ${totalCount}+`);
          } else {
            // 返回数据少于limit，可能已经是最后一页
            totalCount = (page - 1) * limit + postsData.length;
            console.log(`无法获取确切total，估计为: ${totalCount}`);
          }
        }
      }
      
      console.log(`===== 最终处理结果：数据条数=${postsData.length}, 总数=${totalCount} =====`);
      
      return {
        data: postsData,
        total: totalCount
      };
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      return { data: [], total: 0 };
    }
  }
  
  // 获取用户列表
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<{data: AdminUser[], total: number}> {
    try {
      console.log(`获取用户列表，页码=${page}，条数=${limit}，搜索=${search || '无'}`);
      const response = await get<any>(
        '/api/admin/users',
        { page, limit, search }
      );
      
      console.log('用户列表API返回:', response);
      
      // 提取原始total，确保即使格式转换也保留正确的总数
      let originalTotal = 0;
      if (response && typeof response === 'object' && 'total' in response) {
        originalTotal = response.total;
        console.log(`从用户列表响应提取total: ${originalTotal}`);
      }
      
      // 标准格式处理
      if (response && response.success && Array.isArray(response.data)) {
        console.log(`用户数据，总数: ${response.total}, 条数: ${response.data.length}`);
        return {
          data: response.data,
          total: response.total
        };
      } else if (Array.isArray(response)) {
        // 数组格式
        return {
          data: response,
          total: originalTotal || response.length
        };
      } else if (response && response.data) {
        // 其他可能的格式
        const data = Array.isArray(response.data) ? response.data : [response.data];
        const total = originalTotal || response.total || data.length;
        return {
          data: data,
          total: total
        };
      }
      
      return { data: [], total: 0 };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { data: [], total: 0 };
    }
  }
  
  // 获取路线列表
  async getRoutes(page: number = 1, limit: number = 10, search?: string): Promise<RouteResponse> {
    try {
      console.log(`获取路线列表，页码=${page}，条数=${limit}，搜索=${search || '无'}`);
      
      // 记录请求详细信息，帮助调试
      const requestUrl = `/api/admin/routes`;
      const requestParams = { page, limit, search };
      console.log(`请求URL: ${requestUrl}, 参数:`, requestParams);
      
      const response = await get<any>(
        requestUrl,
        requestParams
      );
      
      console.log('路线列表API返回:', response);
      
      // 提取原始total，确保即使格式转换也保留正确的总数
      let originalTotal = 0;
      if (response && typeof response === 'object' && 'total' in response) {
        originalTotal = response.total;
        console.log(`从路线列表响应提取total: ${originalTotal}`);
      }
      
      // 检查是否为模拟数据
      const isRealData = response?.isRealData !== false;
      
      // 标准格式处理
      if (response && response.success && Array.isArray(response.data)) {
        console.log(`路线数据，总数: ${response.total}, 条数: ${response.data.length}`);
        return {
          data: response.data,
          total: response.total,
          isRealData: response.isRealData
        };
      } else if (Array.isArray(response)) {
        // 数组格式
        return {
          data: response,
          total: originalTotal || response.length,
          isRealData
        };
      } else if (response && response.data) {
        // 其他可能的格式
        const data = Array.isArray(response.data) ? response.data : [response.data];
        const total = originalTotal || response.total || data.length;
        return {
          data: data,
          total: total,
          isRealData: response.isRealData
        };
      }
      
      // 如果所有格式都不匹配，返回空数据
      console.warn('路线数据格式无法识别，返回空数据');
      return { data: [], total: 0, isRealData };
    } catch (error) {
      // 更详细地记录错误信息
      console.error('获取路线列表失败:', error);
      
      // 记录更详细的错误诊断信息
      if (error instanceof Error) {
        console.error(`错误类型: ${error.name}, 错误消息: ${error.message}`);
        console.error(`错误堆栈: ${error.stack}`);
      }
      
      // 打印网络错误建议
      console.warn(`
        可能的错误原因:
        1. 后端服务未启动或无法访问
        2. API端点路径错误
        3. 服务器内部错误
        4. 数据库连接问题
        
        建议检查:
        - 确认后端服务是否正常运行 (查看端口5175是否被监听)
        - 检查API路由配置 (/api/admin/routes)
        - 检查服务器日志寻找详细错误
        - 检查数据库连接和路线表结构
      `);
      
      // 返回空数据，避免前端崩溃
      return { data: [], total: 0, isRealData: false };
    }
  }
  
  // 删除帖子
  async deletePost(postId: number): Promise<boolean> {
    try {
      // 确保使用正确的API URL格式
      console.log(`开始删除帖子，ID=${postId}`);
      const response = await del<any>(`/api/admin/posts/${postId}`);
      
      console.log('删除帖子响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 情况1: {success: true/false}
        if (typeof response.success === 'boolean') {
          return response.success;
        }
        
        // 情况2: {code: 200/400/500}
        if (typeof response.code === 'number') {
          return response.code === 200;
        }
        
        // 情况3: 普通对象响应，没有标准成功标识
        if (response.message && response.message.includes('成功')) {
          return true;
        }
      }
      
      // 情况4: 响应为true/false的布尔值
      if (typeof response === 'boolean') {
        return response;
      }
      
      // 情况5: 响应为字符串，包含"成功"
      if (typeof response === 'string' && response.includes('成功')) {
        return true;
      }
      
      // 默认情况: 如果响应存在且不为null，认为操作成功
      return !!response;
    } catch (error) {
      console.error('删除帖子失败:', error);
      return false;
    }
  }
  
  // 删除用户
  async deleteUser(userId: number): Promise<boolean> {
    try {
      console.log(`开始删除用户，ID=${userId}`);
      const response = await del<any>(`/api/admin/users/${userId}`);
      
      console.log('删除用户响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 情况1: {success: true/false}
        if (typeof response.success === 'boolean') {
      return response.success;
        }
        
        // 情况2: {code: 200/400/500}
        if (typeof response.code === 'number') {
          return response.code === 200;
        }
        
        // 情况3: 普通对象响应，没有标准成功标识
        if (response.message && response.message.includes('成功')) {
          return true;
        }
      }
      
      // 情况4: 响应为true/false的布尔值
      if (typeof response === 'boolean') {
        return response;
      }
      
      // 情况5: 响应为字符串，包含"成功"
      if (typeof response === 'string' && response.includes('成功')) {
        return true;
      }
      
      // 默认情况: 如果响应存在且不为null，认为操作成功
      return !!response;
    } catch (error) {
      console.error('删除用户失败:', error);
      return false;
    }
  }
  
  // 删除路线
  async deleteRoute(routeId: number): Promise<boolean> {
    try {
      console.log(`开始删除路线，ID=${routeId}`);
      const response = await del<any>(`/api/admin/routes/${routeId}`);
      
      console.log('删除路线响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 情况1: {success: true/false}
        if (typeof response.success === 'boolean') {
      return response.success;
        }
        
        // 情况2: {code: 200/400/500}
        if (typeof response.code === 'number') {
          return response.code === 200;
        }
        
        // 情况3: 普通对象响应，没有标准成功标识
        if (response.message && response.message.includes('成功')) {
          return true;
        }
      }
      
      // 情况4: 响应为true/false的布尔值
      if (typeof response === 'boolean') {
        return response;
      }
      
      // 情况5: 响应为字符串，包含"成功"
      if (typeof response === 'string' && response.includes('成功')) {
        return true;
      }
      
      // 默认情况: 如果响应存在且不为null，认为操作成功
      return !!response;
    } catch (error) {
      console.error('删除路线失败:', error);
      return false;
    }
  }
}

// 创建并导出服务实例（命名导出）
export const adminService = new AdminService();

// 同时提供默认导出
export default adminService;