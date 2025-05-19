import { get, post, del } from '@/utils/request';
import type { BaseResponse } from '@/types/response';

// 帖子类型定义
export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
  author: {
    id?: number;
    name: string;
    avatar: string;
  };
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  location?: string;
  tags?: string[];
}

// 评论类型定义
export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  replies?: Comment[];
}

// 创建帖子的数据类型
export interface CreatePostData {
  title: string;
  content: string;
  images: string[];
  location?: string;
}

// 处理图片URL函数
const processImageUrl = (img: string | { url: string } | any): string => {
  // 如果图片路径不是完整URL，添加基础路径
  if (typeof img === 'string' && !img.startsWith('http')) {
    // 使用类型断言解决TypeScript错误
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
    return `${baseUrl}${img}`;
  }
  // 如果是对象格式，提取URL
  if (typeof img === 'object' && img !== null && 'url' in img) {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
    return `${baseUrl}${img.url}`;
  }
  // 如果已经是完整URL或其他情况，直接返回
  return img as string;
};

// 论坛服务
export const forumService = {
  // 获取帖子列表
  async getPosts(page: number = 1, sortType: string = 'latest'): Promise<Post[]> {
    try {
      // 修改为直接处理未包装的响应格式
      const res = await get<Post[]>('/api/forum/posts', { page, sortType });
      
      if (Array.isArray(res)) {
        // 处理图片URL
        res.forEach(post => {
          if (post.images && Array.isArray(post.images) && post.images.length > 0) {
            post.images = post.images.map(img => processImageUrl(img));
          }
          
          // 确保帖子字段符合前端期望
          // 处理标签
          if (typeof post.tags === 'string') {
            post.tags = (post.tags as string).split(',').filter((tag: string) => tag.trim() !== '');
          }
          
          // 确保images字段是数组
          if (!Array.isArray(post.images)) {
            post.images = post.images ? [post.images] : [];
          }
          
          // 确保author字段格式正确
          if (!post.author) {
            post.author = {
              name: '未知用户',
              avatar: ''
            };
          }
        });
        return res;
      }
      return [];
    } catch (error) {
      console.error('获取帖子失败:', error);
      return [];
    }
  },
  
  // 搜索帖子
  async searchPosts(query: string, sortType: string = 'latest'): Promise<Post[]> {
    try {
      const res = await get<BaseResponse<Post[]>>('/api/forum/search', { query, sortType });
      if (res.success) {
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('搜索帖子失败:', error);
      return [];
    }
  },
  
  // 获取帖子详情
  async getPostDetail(id: number): Promise<Post | null> {
    try {
      console.log(`正在获取帖子详情，ID: ${id}`);
      
      // 使用直接的fetch调用以便查看原始响应
      const response = await fetch(`/api/forum/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      console.log(`获取帖子详情状态码: ${response.status}`);
      
      // 获取原始响应文本
      const responseText = await response.text();
      console.log(`获取到的原始响应文本:`, responseText);
      
      // 尝试解析JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('解析后的响应数据:', responseData);
      } catch (e) {
        console.error('响应不是有效的JSON:', e);
        return null;
      }
      
      // 确定帖子数据对象的位置
      let postData = null;
      
      // 检查是否是直接返回的数据对象（没有被包装）
      if (responseData && (responseData.id || responseData.title)) {
        console.log('检测到直接返回的数据对象');
        postData = responseData;
      }
      // 检查包装格式 {success: true, data: {}} 或 {data: {}}
      else if ((responseData.success === true && responseData.data) || 
          (responseData.data && responseData.data.id)) {
        console.log('检测到标准包装格式的响应');
        postData = responseData.data;
      }
      
      if (!postData) {
        console.error('无法识别的响应格式:', responseData);
        return null;
      }
      
      // 统一处理帖子数据
      console.log('原始帖子数据:', postData);
      
      // 确保所有必需字段存在
      const processedPost: Post = {
        id: postData.id,
        title: postData.title || '无标题',
        content: postData.content || '',
        summary: postData.summary || (postData.content ? postData.content.substring(0, 200) + '...' : ''),
        createdAt: postData.createdAt || postData.created_at || new Date().toISOString(),
        author: {
          id: postData.author?.id || postData.user_id || 0,
          name: postData.author?.name || postData.author_name || postData.user_name || '未知用户',
          avatar: postData.author?.avatar || postData.author_avatar || postData.user_avatar || ''
        },
        images: [],
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        isLiked: postData.isLiked === undefined ? false : !!postData.isLiked,
        location: postData.location || '',
        tags: Array.isArray(postData.tags) ? postData.tags : 
              (typeof postData.tags === 'string' ? postData.tags.split(',').filter((t: string) => t.trim() !== '') : [])
      };
      
      // 处理图片URL
      if (postData.images) {
        if (Array.isArray(postData.images)) {
          console.log('处理图片数组:', postData.images);
          processedPost.images = postData.images.map((img: any) => {
            if (typeof img === 'string') {
              return img;
            } else if (img && typeof img === 'object' && img.url) {
              return img.url;
            } else if (img && typeof img === 'object' && img.image_url) {
              return img.image_url;
            }
            return '';
          }).filter((url: string) => url.trim() !== '');
        } else if (typeof postData.images === 'string') {
          console.log('将单个图片字符串转换为数组:', postData.images);
          processedPost.images = [postData.images];
        } else {
          console.log('无法识别的图片格式:', postData.images);
          processedPost.images = [];
        }
      } else {
        console.log('帖子没有图片数据');
        processedPost.images = [];
      }
      
      console.log('处理后的帖子数据:', processedPost);
      return processedPost;
    } catch (error) {
      console.error('获取帖子详情失败，发生异常:', error);
      return null;
    }
  },
  
  // 创建帖子
  async createPost(data: CreatePostData): Promise<Post | null> {
    console.log("===== 论坛服务：开始创建帖子 =====");
    console.log("认证状态检查:", {
      hasLocalToken: !!localStorage.getItem('auth_token'),
      hasSessionToken: !!sessionStorage.getItem('auth_token')
    });
    
    try {
      console.log("请求创建帖子:", data);
      
      // 修正：正确获取auth_token
      console.log("请求前token状态:", {
        localStorage: localStorage.getItem('auth_token') ? '存在' : '不存在',
        sessionStorage: sessionStorage.getItem('auth_token') ? '存在' : '不存在'
      });
      
      // 直接获取原始响应，方便调试
      const rawResponse = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });

      console.log("原始响应状态:", {
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        hasContentType: rawResponse.headers.has('content-type')
      });

      // 获取响应文本和JSON
      const responseText = await rawResponse.text();
      console.log("响应文本:", responseText);

      let res;
      try {
        res = JSON.parse(responseText);
        console.log("解析后响应:", res);
      } catch (e) {
        console.error("响应非JSON格式:", e);
        return null;
      }

      // 处理响应
      if (res.success === true && res.data) {
        console.log("帖子创建成功:", res.data);
        let postData = res.data;
        
        // 确保返回数据符合Post接口
        if (!postData.summary && postData.content) {
          postData.summary = postData.content.substring(0, 100) + '...';
        }
        
        if (typeof postData.tags === 'string') {
          postData.tags = postData.tags.split(',').filter((tag: string) => tag.trim() !== '');
        }
        
        // 确保images字段是数组
        if (!Array.isArray(postData.images)) {
          postData.images = postData.images ? [postData.images] : [];
        }
        
        return postData;
      } else {
        console.error("帖子创建失败:", res.message, "状态码:", res.code);
        return null;
      }
    } catch (error: any) {
      // 详细记录错误信息
      console.error('创建帖子失败:', error);
      console.log('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      return null;
    } finally {
      console.log("===== 论坛服务：结束创建帖子 =====");
    }
  },
  
  // 上传图片
  async uploadImage(file: File): Promise<string | null> {
    try {
      console.log("===== 开始上传图片 =====");
      
      // 检查文件参数
      if (!file) {
        console.error("上传图片失败: 文件对象为空");
        return null;
      }
      
      // 检查文件类型
      if (!file.type || !file.type.startsWith('image/')) {
        console.error("上传图片失败: 不是有效的图片类型", file.type);
        return null;
      }
      
      console.log("文件信息:", {
        name: file.name || '未知文件名',
        type: file.type || '未知类型',
        size: (file.size || 0) + ' bytes',
        lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '未知'
      });
      
      // 准备FormData
      const formData = new FormData();
      // 确保字段名为'image'，与后端multer配置保持一致
      formData.append('image', file);
      
      console.log("上传前的认证状态:", {
        token: localStorage.getItem('auth_token') ? "存在" : "不存在"
      });
      
      // 直接使用fetch API，更灵活地处理错误
      const response = await fetch('/api/forum/upload', {
        method: 'POST',
        headers: {
          // 注意：使用FormData时不要手动设置Content-Type
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: formData
      });
      
      console.log("上传响应状态:", response.status, response.statusText);
      
      // 检查响应状态
      if (!response.ok) {
        console.error("上传图片失败:", response.status, response.statusText);
        
        // 尝试获取错误详情
        try {
          const errorText = await response.text();
          console.error("错误详情:", errorText);
        } catch (e) {
          console.error("无法读取错误详情");
        }
        
        return null;
      }
      
      // 解析响应
      const responseText = await response.text();
      console.log("上传响应:", responseText.substring(0, 200));

      try {
        const data = JSON.parse(responseText);
        
        // 检查响应格式 - 更详细地处理图片响应格式
        if (data.success && data.data) {
          // 尝试获取不同格式的URL
          let imageUrl = null;
          
          // 检查是否有data.data.url
          if (data.data.url) {
            imageUrl = data.data.url;
            console.log("从data.data.url获取图片地址:", imageUrl);
          }
          // 检查是否有data.data.imageUrl
          else if (data.data.imageUrl) {
            imageUrl = data.data.imageUrl;
            console.log("从data.data.imageUrl获取图片地址:", imageUrl);
          }
          // 检查是否有data.data.fullUrl
          else if (data.data.fullUrl) {
            imageUrl = data.data.fullUrl;
            console.log("从data.data.fullUrl获取图片地址:", imageUrl);
          }
          // 检查是否data.data本身就是URL字符串
          else if (typeof data.data === 'string') {
            imageUrl = data.data;
            console.log("从data.data获取图片地址:", imageUrl);
          }
          // 如果data.data是对象但没有明确的URL字段，尝试遍历所有字段
          else if (typeof data.data === 'object') {
            // 遍历所有字段，寻找可能的URL
            for (const key in data.data) {
              const value = data.data[key];
              if (typeof value === 'string' && 
                  (value.startsWith('http') || 
                   value.startsWith('/') || 
                   value.startsWith('./uploads'))) {
                imageUrl = value;
                console.log(`从data.data.${key}获取图片地址:`, imageUrl);
                break;
              }
            }
          }
          
          if (imageUrl) {
            console.log("上传成功, 图片URL:", imageUrl);
            console.log("===== 图片上传完成 =====");
            return imageUrl;
          } else {
            console.error("响应中未找到有效的图片URL:", data);
            return null;
          }
        } else if (data.success && typeof data.data === 'string') {
          // 直接返回数据字符串作为URL
          console.log("上传成功, 直接返回data:", data.data);
          console.log("===== 图片上传完成 =====");
          return data.data;
        } else {
          console.error("响应格式错误:", data);
          return null;
        }
      } catch (e) {
        console.error("解析响应JSON失败:", e);
        return null;
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      return null;
    }
  },
  
  // 点赞/取消点赞
  async toggleLike(postId: number): Promise<{likes: number, isLiked: boolean} | null> {
    try {
      console.log(`===== 开始处理点赞请求，帖子ID: ${postId} =====`);
      
      // 直接使用fetch，以便更详细地记录请求过程
      const response = await fetch(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      console.log(`点赞请求状态: ${response.status} ${response.statusText}`);
      
      // 如果响应状态不是成功，记录错误并返回null
      if (!response.ok) {
        console.error(`点赞请求失败: ${response.status} ${response.statusText}`);
        return null;
      }
      
      // 读取响应文本
      const responseText = await response.text();
      console.log(`点赞请求响应: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      // 尝试解析JSON
      try {
        const data = JSON.parse(responseText);
        
        // 检查响应格式
        if (data.success && data.data) {
          const result = {
            likes: typeof data.data.likes === 'number' ? data.data.likes : 0,
            isLiked: !!data.data.isLiked
          };
          console.log(`点赞操作结果: 点赞数=${result.likes}, 是否已点赞=${result.isLiked}`);
          console.log(`===== 点赞请求处理完成 =====`);
          return result;
        } else {
          console.error(`点赞请求响应格式错误:`, data);
          return null;
        }
      } catch (error) {
        console.error(`解析点赞响应JSON失败:`, error);
        return null;
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      return null;
    }
  },
  
  // 获取评论列表
  async getComments(postId: number): Promise<Comment[]> {
    try {
      console.log(`准备获取帖子评论，ID: ${postId}`);
      
      // 使用直接的fetch调用来更好地处理错误
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      console.log(`获取评论状态码: ${response.status}`);
      
      // 如果是404错误，说明后端没有实现评论API，返回空数组
      if (response.status === 404) {
        console.warn(`评论API未实现 (404)，返回空数组`);
        return [];
      }
      
      // 如果请求不成功，返回空数组
      if (!response.ok) {
        console.error(`获取评论失败，状态码: ${response.status}`);
        return [];
      }
      
      // 尝试解析JSON响应
      const responseText = await response.text();
      console.log(`获取到的评论响应文本:`, responseText);
      
      try {
        const data = JSON.parse(responseText);
        
        // 检查数据格式
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        } else if (Array.isArray(data)) {
          return data;
        } else {
          console.warn(`评论数据格式不符合预期:`, data);
          return [];
        }
      } catch (e) {
        console.error(`解析评论JSON失败:`, e);
        return [];
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      // 捕获错误但返回空数组，不会中断程序流程
      return [];
    }
  },
  
  // 添加评论或回复
  async addComment(postId: number, content: string, parentId?: number): Promise<Comment | null> {
    try {
      const res = await post<BaseResponse<Comment>>(`/api/forum/posts/${postId}/comments`, { content, parentId });
      return res.success ? res.data : null;
    } catch (error) {
      console.error('添加评论失败:', error);
      return null;
    }
  },
  
  // 删除评论
  async deleteComment(postId: number, commentId: number): Promise<boolean> {
    try {
      const res = await del<BaseResponse<boolean>>(`/api/forum/posts/${postId}/comments/${commentId}`);
      return res.success ? res.data : false;
    } catch (error) {
      console.error('删除评论失败:', error);
      return false;
    }
  }
};
