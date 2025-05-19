export interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

