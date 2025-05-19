import { get, post, put, del as deleteRequest } from '../utils/request';

export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  image: string;
  views: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  author?: string;
  authorAvatar?: string;
}

export interface ArticleFilter {
  category?: string;
  timeFilter?: 'week' | 'month' | 'year';
  searchQuery?: string;
}

export class ArticlesService {
  /**
   * 获取所有文章，支持分页和筛选
   */
  public static async getArticles(limit = 10, offset = 0, filters?: ArticleFilter) {
    try {
      // 构建查询参数
      const params: Record<string, any> = {
        limit,
        offset
      };
      
      if (filters) {
        if (filters.category) params.category = filters.category;
        if (filters.timeFilter) params.timeFilter = filters.timeFilter;
        if (filters.searchQuery) params.searchQuery = filters.searchQuery;
      }
      
      const response = await get('/api/articles', params);
      return response;
    } catch (error) {
      console.error('获取文章列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取热门文章
   */
  public static async getPopularArticles(limit = 3) {
    try {
      const response = await get('/api/articles/popular', { limit });
      return response;
    } catch (error) {
      console.error('获取热门文章失败:', error);
      throw error;
    }
  }
  
  /**
   * 根据ID获取文章详情
   */
  public static async getArticleById(id: number) {
    try {
      const response = await get(`/api/articles/${id}`);
      return response;
    } catch (error) {
      console.error('获取文章详情失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建新文章
   */
  public static async createArticle(articleData: Omit<Article, 'id' | 'views' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const response = await post('/api/articles', articleData);
      return response;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新文章
   */
  public static async updateArticle(id: number, articleData: Partial<Article>) {
    try {
      const response = await put(`/api/articles/${id}`, articleData);
      return response;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除文章
   */
  public static async deleteArticle(id: number) {
    try {
      const response = await deleteRequest(`/api/articles/${id}`);
      return response;
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  }
} 