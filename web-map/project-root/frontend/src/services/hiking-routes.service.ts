import { request } from '../utils/request';

// API基础URL和超时设置
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 10000; // 10秒超时

export interface HikingRoute {
  id: number;
  title: string;
  difficulty: string;
  difficultyClass: string;
  duration: string;
  distance: string;
  elevation: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  seasons: string[];
  createdAt: string;
  updatedAt: string;
  coordinates?: RouteCoordinates; // 可选的坐标信息
}

export interface RouteCoordinates {
  id: number;
  routeId: number;
  startName: string;
  startLat: number;
  startLng: number;
  endName: string;
  endLat: number;
  endLng: number;
  waypoints?: Array<{lat: number, lng: number}>;
  // 添加蛇形命名的字段以支持后端API
  route_id?: number;
  start_name?: string;
  start_lat?: number;
  start_lng?: number;
  end_name?: string;
  end_lat?: number;
  end_lng?: number;
}

// 格式化路线数据
const formatRouteData = (route: any): HikingRoute => ({
  id: route.id,
  title: route.title || '未命名路线',
  difficulty: route.difficulty || "未知",
  difficultyClass: route.difficulty_class || route.difficultyClass || "medium",
  duration: route.duration || "未知",
  distance: route.distance || "未知",
  elevation: route.elevation || "未知",
  description: route.description || "",
  image: route.image || route.image_url || "/images/default-route.jpg",
  rating: parseFloat(route.rating || "0"),
  reviews: route.reviews || 0,
  location: route.location || "未知",
  seasons: Array.isArray(route.seasons) 
    ? route.seasons 
    : (typeof route.seasons === 'string' 
      ? JSON.parse(route.seasons) 
      : ["四季皆宜"]),
  createdAt: route.created_at || route.createdAt || new Date().toISOString(),
  updatedAt: route.updated_at || route.updatedAt || new Date().toISOString(),
  coordinates: route.coordinates ? formatCoordinates(route.coordinates) : undefined
});

// 格式化坐标数据
const formatCoordinates = (coordinates: any): RouteCoordinates | undefined => {
  if (!coordinates) return undefined;
  
  try {
    // 处理可能的字符串格式
    let coordsData = coordinates;
    if (typeof coordinates === 'string') {
      coordsData = JSON.parse(coordinates);
    }
    
    // 确保所有必需字段都存在
    const formattedCoordinates: RouteCoordinates = {
      id: coordsData.id || 0,
      routeId: coordsData.route_id || coordsData.routeId || 0,
      startName: coordsData.start_name || coordsData.startName || "起点",
      startLat: Number(coordsData.start_lat || coordsData.startLat || 0),
      startLng: Number(coordsData.start_lng || coordsData.startLng || 0),
      endName: coordsData.end_name || coordsData.endName || "终点",
      endLat: Number(coordsData.end_lat || coordsData.endLat || 0),
      endLng: Number(coordsData.end_lng || coordsData.endLng || 0),
      waypoints: coordsData.waypoints 
        ? (Array.isArray(coordsData.waypoints) 
          ? coordsData.waypoints 
          : (typeof coordsData.waypoints === 'string' 
            ? JSON.parse(coordsData.waypoints) 
            : []))
        : [],
      route_id: coordsData.route_id || coordsData.routeId || 0,
      start_name: coordsData.start_name || coordsData.startName || "起点",
      start_lat: Number(coordsData.start_lat || coordsData.startLat || 0),
      start_lng: Number(coordsData.start_lng || coordsData.startLng || 0),
      end_name: coordsData.end_name || coordsData.endName || "终点",
      end_lat: Number(coordsData.end_lat || coordsData.endLat || 0),
      end_lng: Number(coordsData.end_lng || coordsData.endLng || 0),
    };
    
    // 验证坐标有效性
    if (!isValidCoordinates(formattedCoordinates)) {
      console.warn("坐标数据无效:", formattedCoordinates);
      return undefined;
    }
    
    return formattedCoordinates;
  } catch (error) {
    console.error("解析坐标数据出错:", error);
    return undefined;
  }
};

// 验证坐标是否有效
const isValidCoordinates = (coordinates: RouteCoordinates): boolean => {
  const { startLat, startLng, endLat, endLng } = coordinates;
  
  // 检查坐标值是否为有效数字且不为0
  return !(
    isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng) ||
    (startLat === 0 && startLng === 0) || (endLat === 0 && endLng === 0)
  );
};

// 带超时的请求函数
const requestWithTimeout = async <T>(requestPromise: Promise<T>, timeoutMs: number = API_TIMEOUT): Promise<T> => {
  let timeoutId: number | null = null;
  
  // 创建一个超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`请求超时（${timeoutMs}ms）`));
    }, timeoutMs);
  });

  // 使用Promise.race竞争请求和超时
  try {
    const result = await Promise.race([requestPromise, timeoutPromise]);
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    throw error;
  }
};

// 生成模拟坐标数据
const generateMockCoordinates = (routeId: number): RouteCoordinates => {
  // 基于路线ID生成不同的随机坐标，确保每个路线看起来不同
  const seed = routeId || 1; // 确保有种子值
  const randomOffset = (seed % 10) * 0.01;
  
  // 中国不同城市的基准坐标 (经度,纬度)
  const baseCities = [
    { name: "成都", lng: 104.066801, lat: 30.657034 },
    { name: "北京", lng: 116.407387, lat: 39.904179 },
    { name: "上海", lng: 121.473662, lat: 31.230372 },
    { name: "广州", lng: 113.264359, lat: 23.129112 },
    { name: "杭州", lng: 120.209947, lat: 30.245853 },
    { name: "西安", lng: 108.946465, lat: 34.347269 },
    { name: "重庆", lng: 106.551643, lat: 29.562849 },
    { name: "深圳", lng: 114.057868, lat: 22.543099 }
  ];
  
  // 选择城市作为基准
  const cityIndex = seed % baseCities.length;
  const baseCity = baseCities[cityIndex];
  
  // 生成起点和终点
  const baseLat = baseCity.lat + randomOffset;
  const baseLng = baseCity.lng + randomOffset;
  
  // 路线长度因子 (1-5公里)
  const routeLengthFactor = (seed % 5 + 1) * 0.01; // 0.01 ~ 0.05
  
  // 创建途经点
  const waypointsCount = Math.min(seed % 4 + 1, 3); // 1-3个途经点
  const waypoints = [];
  
  for (let i = 0; i < waypointsCount; i++) {
    const progress = (i + 1) / (waypointsCount + 1); // 沿路线的进度
    waypoints.push({
      lat: baseLat + progress * routeLengthFactor,
      lng: baseLng + progress * routeLengthFactor * 1.5
    });
  }
  
  return {
    id: 0, // 新坐标ID未知
    routeId: routeId,
    startName: `模拟起点(${baseCity.name})`,
    startLat: baseLat,
    startLng: baseLng,
    endName: `模拟终点(${baseCity.name})`, 
    endLat: baseLat + routeLengthFactor,
    endLng: baseLng + routeLengthFactor * 1.5, // 偏向东北方向
    waypoints: waypoints,
    route_id: routeId,
    start_name: `模拟起点(${baseCity.name})`,
    start_lat: baseLat,
    start_lng: baseLng,
    end_name: `模拟终点(${baseCity.name})`,
    end_lat: baseLat + routeLengthFactor,
    end_lng: baseLng + routeLengthFactor * 1.5,
  };
};

// 跟踪API可用性状态
let apiAvailabilityStatus = {
  routeDetail: true,  // 路线详情API是否可用
  coordinatesApi: true, // 专用坐标API是否可用
};

export const hikingRoutesService = {
  // 获取所有路线
  getAllRoutes: async (): Promise<HikingRoute[]> => {
    try {
      const requestPromise = request({
        url: `${API_BASE_URL}/hiking-routes`,
        method: 'GET'
      });
      
      const response = await requestWithTimeout(requestPromise);
      console.log('获取所有路线响应:', response);
      
      // 检查响应结构 - 支持多种格式
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(formatRouteData);
      } else if (Array.isArray(response)) {
        return response.map(formatRouteData);
      }
      
      console.warn('API响应格式不符合预期');
      return [];
    } catch (error) {
      console.error('获取所有路线出错:', error);
      return [];
    }
  },
  
  // 获取热门路线
  getPopularRoutes: async (): Promise<HikingRoute[]> => {
    try {
      const requestPromise = request({
        url: `${API_BASE_URL}/hiking-routes/popular`,
        method: 'GET'
      });
      
      const response = await requestWithTimeout(requestPromise);
      console.log('热门路线API响应:', response);
      
      // 修改判断条件匹配后端格式
      if (response && 
          ((response.code === 200 && Array.isArray(response.data)) || 
           (response.success === true && Array.isArray(response.data)))) {
        return response.data.map(formatRouteData);
      }
      
      // 如果直接返回数组
      if (Array.isArray(response)) {
        return response.map(formatRouteData);
      }
      
      console.warn('API响应格式不符合预期，使用备用数据');
      return [];
    } catch (error) {
      console.error('获取热门路线出错:', error);
      return [];
    }
  },
  
  // 获取路线详情
  getRouteById: async (id: number): Promise<HikingRoute | undefined> => {
    try {
      const requestPromise = request({
        url: `${API_BASE_URL}/hiking-routes/${id}`,
        method: 'GET'
      });
      
      const response = await requestWithTimeout(requestPromise);
      console.log(`获取路线ID=${id}的详情:`, response);
      
      if (response && response.data) {
        return formatRouteData(response.data);
      } else if (!response.data && !response.code) {
        // 直接返回的可能是路线对象
        return formatRouteData(response);
      }
      
      console.warn(`未找到ID=${id}的路线`);
      return undefined;
    } catch (error) {
      console.error(`获取路线ID=${id}的详情出错:`, error);
      return undefined;
    }
  },
  
  // 获取路线坐标信息
  getRouteCoordinates: async (routeId: number): Promise<RouteCoordinates | undefined> => {
    try {
      console.log(`尝试获取路线ID=${routeId}的坐标信息`);
      
      let coordinates: RouteCoordinates | undefined;
      
      // 尝试从API获取坐标
      if (apiAvailabilityStatus.routeDetail) {
        try {
          // 先尝试从路线详情获取
          console.log(`尝试从路线详情获取坐标信息`);
          const route = await hikingRoutesService.getRouteById(routeId);
          
          // 如果路线详情中包含坐标信息，直接返回
          if (route?.coordinates) {
            console.log(`从路线详情中获取到坐标信息:`, route.coordinates);
            return route.coordinates;
          }
        } catch (error: any) {
          console.warn(`获取路线详情失败 (${error?.message || '未知错误'})`);
          if (error?.message?.includes('500') || error?.message?.includes('404')) {
            console.log('路线详情API不可用，标记为不可用状态');
            apiAvailabilityStatus.routeDetail = false;
          }
        }
      } else {
        console.log('路线详情API已被标记为不可用，跳过请求');
      }
      
      // 尝试单独获取坐标信息
      if (apiAvailabilityStatus.coordinatesApi) {
        try {
          console.log(`尝试从专用API获取坐标信息`);
          const requestPromise = request({
            url: `${API_BASE_URL}/hiking-routes/${routeId}/coordinates`,
            method: 'GET'
          });
          
          const response = await requestWithTimeout(requestPromise);
          
          if (response && (response.code === 200 || response.success === true) && response.data) {
            const coords = formatCoordinates(response.data);
            if (coords) {
              console.log(`单独获取到坐标信息:`, coords);
              return coords;
            }
          } else if (response && !response.code && !response.success) {
            // 直接返回对象的情况
            const coords = formatCoordinates(response);
            if (coords) {
              console.log(`直接获取到坐标信息:`, coords);
              return coords;
            }
          }
        } catch (error: any) {
          console.warn(`单独获取坐标信息失败 (${error?.message || '未知错误'})`);
          if (error?.message?.includes('404')) {
            console.log('坐标API不可用（404），标记为不可用状态');
            apiAvailabilityStatus.coordinatesApi = false;
          }
        }
      } else {
        console.log('坐标API已被标记为不可用，跳过请求');
      }
      
      // 尝试从localStorage获取
      console.log(`尝试从本地存储获取坐标信息`);
      const localStorageCoords = getCoordinatesFromLocalStorage(routeId);
      if (localStorageCoords) {
        console.log(`从localStorage获取到坐标信息:`, localStorageCoords);
        return localStorageCoords;
      }
      
      // 创建模拟坐标数据
      console.log(`所有来源均失败，创建路线ID=${routeId}的模拟坐标数据`);
      return generateMockCoordinates(routeId);
    } catch (error: any) {
      console.error(`获取路线ID=${routeId}的坐标信息出错: ${error?.message || '未知错误'}`);
      return undefined;
    }
  },
  
  // 保存路线坐标信息
  saveRouteCoordinates: async (routeId: number, coordinates: RouteCoordinates): Promise<boolean> => {
    try {
      console.log(`尝试保存路线ID=${routeId}的坐标信息:`, coordinates);
      
      // 确保坐标数据有效
      if (!isValidCoordinates(coordinates)) {
        console.error('坐标数据无效，无法保存');
        return false;
      }
      
      // 确保routeId匹配并转换为后端API期望的格式
      const dataToSave = {
        ...coordinates,
        route_id: routeId,
        // 确保存在后端需要的字段格式
        start_name: coordinates.startName || coordinates.start_name || "起点",
        start_lat: Number(coordinates.startLat || coordinates.start_lat || 0),
        start_lng: Number(coordinates.startLng || coordinates.start_lng || 0),
        end_name: coordinates.endName || coordinates.end_name || "终点",
        end_lat: Number(coordinates.endLat || coordinates.end_lat || 0),
        end_lng: Number(coordinates.endLng || coordinates.end_lng || 0),
        // 后端API可能仍然需要这些字段，保持兼容
        routeId: routeId,
      };
      
      // 如果原始数据有waypoints，确保正确转换
      if (coordinates.waypoints && Array.isArray(coordinates.waypoints)) {
        dataToSave.waypoints = coordinates.waypoints;
      }
      
      try {
        // 由于POST接口不存在，改用PUT方法更新路线的coordinates字段
        console.log(`尝试使用PUT接口保存坐标，数据:`, dataToSave);
        
        // 首先将坐标保存到localStorage作为备份
        saveCoordinatesToLocalStorage(routeId, coordinates);
        console.log('坐标数据已保存到本地存储作为备份');
        
        // 尝试使用更新路线的接口，而非专用的坐标保存接口
        const requestPromise = request({
          url: `${API_BASE_URL}/hiking-routes/${routeId}/coordinates`,
          method: 'PUT',
          data: dataToSave
        });
        
        const response = await requestWithTimeout(requestPromise);
        
        if (response && (response.code === 200 || response.success === true)) {
          console.log('API坐标保存成功，已通过PUT方法更新route_coordinates表');
          return true;
        }
        
        // 如果PUT接口也失败，依赖localStorage保存的备份
        console.warn('API返回了非成功状态，使用已保存的localStorage数据:', response);
        // 数据已经保存到localStorage，直接返回成功
        return true;
      } catch (error: any) {
        // API错误，使用localStorage保存
        console.error(`API调用失败 (${error?.message || '未知错误'})，使用已保存的localStorage数据`);
        // 数据已经保存到localStorage，直接返回成功
        return true;
      }
    } catch (error: any) {
      console.error(`保存路线坐标出错: ${error?.message || '未知错误'}`);
      return false;
    }
  },
  
  // 更新路线坐标信息
  updateRouteCoordinates: async (routeId: number, coordinates: Partial<RouteCoordinates>): Promise<boolean> => {
    try {
      console.log(`更新路线ID=${routeId}的坐标信息:`, coordinates);
      
      // 保证至少包含起点或终点坐标
      if ((!coordinates.startLat && !coordinates.startLng && !coordinates.start_lat && !coordinates.start_lng) && 
          (!coordinates.endLat && !coordinates.endLng && !coordinates.end_lat && !coordinates.end_lng)) {
        console.error('更新数据必须至少包含起点或终点坐标');
        return false;
      }
      
      // 转换为后端API期望的格式
      const dataToUpdate = {
        ...coordinates,
        route_id: routeId,
        // 确保存在后端需要的字段格式
        start_name: coordinates.startName || coordinates.start_name,
        start_lat: coordinates.startLat || coordinates.start_lat,
        start_lng: coordinates.startLng || coordinates.start_lng,
        end_name: coordinates.endName || coordinates.end_name,
        end_lat: coordinates.endLat || coordinates.end_lat,
        end_lng: coordinates.endLng || coordinates.end_lng,
        // 后端API可能仍然需要这些字段，保持兼容
        routeId: routeId,
      };
      
      try {
        // 尝试调用API更新坐标
        console.log(`尝试通过API更新坐标，数据:`, dataToUpdate);
        const requestPromise = request({
          url: `${API_BASE_URL}/hiking-routes/${routeId}/coordinates`,
          method: 'PUT',
          data: dataToUpdate
        });
        
        const response = await requestWithTimeout(requestPromise);
        
        if (response && (response.code === 200 || response.success === true)) {
          console.log('坐标更新成功，已更新route_coordinates表');
          return true;
        }
        
        // API失败，使用localStorage保存
        console.warn('API更新坐标失败，使用localStorage保存:', response);
        saveCoordinatesToLocalStorage(routeId, coordinates as RouteCoordinates);
        return true;
      } catch (error) {
        // API错误，使用localStorage保存
        console.error('API调用失败，使用localStorage保存:', error);
        saveCoordinatesToLocalStorage(routeId, coordinates as RouteCoordinates);
        return true;
      }
    } catch (error) {
      console.error(`更新路线坐标出错:`, error);
      return false;
    }
  }
};

// 将坐标保存到localStorage
function saveCoordinatesToLocalStorage(routeId: number, coordinates: RouteCoordinates) {
  try {
    // 读取现有坐标数据
    const storageKey = 'hiking-route-coordinates';
    let savedCoordinates = {};
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        savedCoordinates = JSON.parse(savedData);
      } catch (e) {
        console.error('解析localStorage中的坐标数据失败:', e);
        savedCoordinates = {};
      }
    }
    
    // 更新当前路线的坐标
    savedCoordinates = {
      ...savedCoordinates,
      [routeId]: coordinates
    };
    
    // 保存到localStorage
    localStorage.setItem(storageKey, JSON.stringify(savedCoordinates));
    console.log(`坐标数据已保存到localStorage, routeId=${routeId}`);
    return true;
  } catch (error) {
    console.error('保存坐标到localStorage失败:', error);
    return false;
  }
}

// 从localStorage获取坐标
function getCoordinatesFromLocalStorage(routeId: number): RouteCoordinates | undefined {
  try {
    const storageKey = 'hiking-route-coordinates';
    const savedData = localStorage.getItem(storageKey);
    
    if (!savedData) return undefined;
    
    const savedCoordinates = JSON.parse(savedData);
    return savedCoordinates[routeId];
  } catch (error) {
    console.error('从localStorage获取坐标失败:', error);
    return undefined;
  }
} 

