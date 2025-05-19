import { request, get, put, del } from '../utils/request';

export interface Message {
  id: number;
  type: 'like' | 'comment';
  content?: string;
  isRead: boolean;
  createdAt: string;
  post: {
    id: number;
    title: string;
  };
  sender: {
    id: number;
    name: string;
    avatar: string | null;
  };
  commentId?: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

class MessageService {
  // 获取用户消息列表
  async getMessages(type: string = 'all', page: number = 1, limit: number = 10): Promise<Message[]> {
    try {
      console.log(`获取消息列表，类型=${type}，页码=${page}`);
      const response = await get<{ success: boolean, data: Message[] } | Message[]>(
        `/api/messages`,
        { type, page, limit }
      );
      
      console.log('API响应:', JSON.stringify(response));
      
      // 处理两种可能的响应格式
      if (Array.isArray(response)) {
        // 直接返回的是消息数组
        console.log(`成功获取${response.length}条消息`);
        return response;
      } else if (response.success && response.data) {
        // 标准格式的响应对象 {success, data}
        console.log(`成功获取${response.data.length}条消息`);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('获取消息列表失败:', error);
      return [];
    }
  }

  // 获取未读消息数量
  async getUnreadCount(): Promise<number> {
    try {
      console.log('获取未读消息数量');
      const response = await get<{ success: boolean, data: UnreadCountResponse }>(
        '/api/messages/unread-count'
      );
      
      if (response.success && response.data) {
        console.log(`未读消息数量: ${response.data.unreadCount}`);
        return response.data.unreadCount;
      }
      
      return 0;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return 0;
    }
  }

  // 标记消息为已读
  async markAsRead(messageId: number): Promise<boolean> {
    try {
      console.log(`标记消息已读，ID=${messageId}`);
      console.log(`请求URL: /api/messages/${messageId}/read`);
      
      // 使用直接fetch请求替代封装的put方法
      try {
        const response = await fetch(`/api/messages/${messageId}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        console.log('直接fetch请求结果:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('直接fetch响应数据:', data);
          return data.success || true; // 如果响应中没有success属性，则默认为true
        } else {
          console.error('标记已读请求失败:', response.status, response.statusText);
          return false;
        }
      } catch (fetchError) {
        console.error('直接fetch请求失败:', fetchError);
        return false;
      }
      
      // 注释掉有问题的封装请求
      // const response = await put<{ success: boolean, message: string }>(
      //   `/api/messages/${messageId}/read`
      // );
      
      // return response.success;
    } catch (error) {
      console.error('标记消息已读失败:', error);
      return false;
    }
  }

  // 标记所有消息为已读
  async markAllAsRead(): Promise<boolean> {
    try {
      console.log('标记所有消息为已读');
      console.log('请求URL: /api/messages/read-all');
      
      // 使用直接fetch请求替代封装的put方法
      try {
        const response = await fetch('/api/messages/read-all', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        console.log('直接fetch请求结果:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('直接fetch响应数据:', data);
          return data.success || true; // 如果响应中没有success属性，则默认为true
        } else {
          console.error('标记全部已读请求失败:', response.status, response.statusText);
          return false;
        }
      } catch (fetchError) {
        console.error('直接fetch请求失败:', fetchError);
        return false;
      }
      
      // 注释掉有问题的封装请求
      // const response = await put<{ success: boolean, message: string }>(
      //   '/api/messages/read-all'
      // );
      
      // return response.success;
    } catch (error) {
      console.error('标记所有消息为已读失败:', error);
      return false;
    }
  }

  // 删除消息
  async deleteMessage(messageId: number): Promise<boolean> {
    try {
      console.log(`删除消息，ID=${messageId}`);
      console.log(`请求URL: /api/messages/${messageId}`);
      
      // 使用直接fetch请求替代封装的del方法
      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        console.log('直接fetch请求结果:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('直接fetch响应数据:', data);
          return data.success || true; // 如果响应中没有success属性，则默认为true
        } else {
          console.error('删除请求失败:', response.status, response.statusText);
          return false;
        }
      } catch (fetchError) {
        console.error('直接fetch请求失败:', fetchError);
        return false;
      }
      
      // 注释掉有问题的封装请求
      // const response = await del<{ success: boolean, message: string }>(
      //   `/api/messages/${messageId}`
      // );
      
      // return response.success;
    } catch (error) {
      console.error('删除消息失败:', error);
      return false;
    }
  }
}

export const messageService = new MessageService(); 