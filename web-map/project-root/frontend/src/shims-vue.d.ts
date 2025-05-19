declare module '*.vue' {
  import type { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}

declare module '@amap/amap-jsapi-loader' {
  const AMapLoader: {
    load(options: {
      key: string;
      version: string;
      plugins?: string[];
    }): Promise<any>
  }
  export default AMapLoader
}

// 添加全局AMap对象声明
declare interface Window {
  AMap: any;
} 