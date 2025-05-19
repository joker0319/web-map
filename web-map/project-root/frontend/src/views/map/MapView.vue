<template>
  <DefaultLayout>
    <a-card class="map-page-card">
      <!-- API密钥提示 -->
      <a-alert v-if="apiKeyInvalid" type="warning" closable>
        <template #message>
          <div class="api-key-warning">
            <strong>API密钥无效</strong>
            <p class="api-key-warning-text">
              部分功能可能不可用。建议配置您自己的高德地图API密钥。
            </p>
            <a-button
              type="primary"
              size="small"
              @click="showApiKeyGuide = true"
            >
              查看配置指南
            </a-button>
          </div>
        </template>
      </a-alert>

      <div class="map-page-layout" @click="handleOutsideClick">
        <!-- 左侧地图容器，占3/4宽度 -->
        <div class="map-side">
          <!-- 交互式地图容器 -->
          <div class="map-container">
            <!-- 地图加载状态 -->
            <div
              v-if="mapLoading && !mapLoadError"
              class="map-loading-container"
            >
              <a-spin :size="40" />
              <div class="map-loading-text">地图加载中...</div>
            </div>

            <!-- 地图加载错误 -->
            <div v-if="mapLoadError" class="map-error-container">
              <icon-exclamation-circle-fill
                style="fontsize: 24px; color: #f53f3f"
              />
              <div class="map-error-text">地图加载失败</div>
              <a-button type="primary" size="small" @click="reloadMap">
                重新加载
              </a-button>
            </div>

            <!-- 地图渲染区域 -->
            <div id="container" class="amap-container"></div>

            <!-- 地图控件 -->
            <div class="map-controls">
              <div class="zoom-controls">
                <a-button type="primary" shape="circle" @click="zoomIn">
                  <template #icon><icon-plus /></template>
                </a-button>
                <a-button type="primary" shape="circle" @click="zoomOut">
                  <template #icon><icon-minus /></template>
                </a-button>
                <a-button type="primary" shape="circle" @click="forceResizeMap">
                  <template #icon><icon-refresh /></template>
                </a-button>
              </div>
            </div>

            <!-- 地图信息 -->
            <div class="map-info">
              <div class="location-info">
                <icon-location /> 当前位置：{{ currentLocationName }}
              </div>
              <div class="coordinates">
                经度: {{ currentLng.toFixed(6) }}, 纬度:
                {{ currentLat.toFixed(6) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧路线规划容器，占1/4宽度 -->
        <div class="route-side">
          <a-card title="路线规划" :bordered="false" class="route-card">
            <a-form :model="routeForm" layout="vertical">
              <!-- 起点输入 -->
              <a-form-item field="origin" label="起点">
                <div ref="originInputRef" class="input-container" @click.stop>
                  <a-input
                    v-model="routeForm.origin"
                    placeholder="请输入起点地名"
                    allow-clear
                    @focus="showOriginDropdown = true"
                  >
                    <template #prefix>
                      <icon-location />
                    </template>
                    <template #suffix>
                      <a-button type="text" @click="useCurrentAsOrigin">
                        <icon-target />
                      </a-button>
                    </template>
                  </a-input>

                  <!-- 起点搜索结果 -->
                  <div
                    v-if="showOriginDropdown && originResults.length > 0"
                    class="search-results"
                  >
                    <a-spin v-if="searchingOrigin" :size="24" />
                    <a-list v-else>
                      <a-list-item
                        v-for="(item, index) in originResults"
                        :key="index"
                        actionType="button"
                        @click="selectPlace('origin', item)"
                      >
                        <div class="place-item">
                          <div class="place-name">{{ item.name }}</div>
                          <div class="place-address">{{ item.address }}</div>
                        </div>
                      </a-list-item>
                    </a-list>
                  </div>
                </div>
              </a-form-item>

              <!-- 终点输入 -->
              <a-form-item field="destination" label="终点">
                <div
                  ref="destinationInputRef"
                  class="input-container"
                  @click.stop
                >
                  <a-input
                    v-model="routeForm.destination"
                    placeholder="请输入终点地名"
                    allow-clear
                    @focus="showDestinationDropdown = true"
                  >
                    <template #prefix>
                      <icon-location />
                    </template>
                  </a-input>

                  <!-- 终点搜索结果 -->
                  <div
                    v-if="
                      showDestinationDropdown && destinationResults.length > 0
                    "
                    class="search-results"
                  >
                    <a-spin v-if="searchingDestination" :size="24" />
                    <a-list v-else>
                      <a-list-item
                        v-for="(item, index) in destinationResults"
                        :key="index"
                        actionType="button"
                        @click="selectPlace('destination', item)"
                      >
                        <div class="place-item">
                          <div class="place-name">{{ item.name }}</div>
                          <div class="place-address">{{ item.address }}</div>
                        </div>
                      </a-list-item>
                    </a-list>
                  </div>
                </div>
              </a-form-item>

              <!-- 提示信息 -->
              <a-form-item>
                <div class="route-tip" v-if="loading">
                  <a-spin :size="18" /> 正在规划路线...
                </div>
                <div class="route-tip" v-else>
                  <icon-info-circle /> 输入起点和终点地名后将自动规划路线
                </div>
              </a-form-item>
            </a-form>

            <!-- 路线结果 -->
            <div v-if="routeResult" class="route-result">
              <a-divider>路线详情</a-divider>

              <!-- 路线概要 -->
              <div class="route-summary">
                <a-space direction="vertical" fill>
                  <a-statistic
                    title="总距离"
                    :value="routeResult.distance"
                    :precision="1"
                  >
                    <template #suffix>公里</template>
                  </a-statistic>
                  <a-statistic title="预计用时" :value="routeResult.duration">
                    <template #suffix>分钟</template>
                  </a-statistic>
                </a-space>
              </div>

              <!-- 路线步骤 -->
              <div class="route-steps">
                <a-steps direction="vertical">
                  <a-step
                    v-for="(step, index) in routeResult.steps"
                    :key="index"
                    :title="step.instruction"
                  >
                    <template #description>
                      <div class="step-detail">
                        {{ step.distance }}米，约{{ step.duration }}分钟
                      </div>
                    </template>
                  </a-step>
                </a-steps>
              </div>
            </div>
          </a-card>
        </div>
      </div>
    </a-card>
  </DefaultLayout>

  <!-- API密钥配置指南对话框 -->
  <a-modal
    v-model:visible="showApiKeyGuide"
    title="如何配置高德地图API密钥"
    @cancel="showApiKeyGuide = false"
    width="600px"
  >
    <div class="api-key-guide">
      <h3>步骤1: 注册高德开发者账号</h3>
      <p>
        前往<a href="https://lbs.amap.com/" target="_blank">高德开放平台</a
        >注册开发者账号。
      </p>

      <h3>步骤2: 创建应用</h3>
      <p>登录后，进入"控制台" > "应用管理" > "创建新应用"。</p>

      <h3>步骤3: 添加Key</h3>
      <p>在应用详情页，选择"添加Key" > "Web端(JS API)"。</p>

      <h3>步骤4: 设置域名</h3>
      <p>必须设置域名白名单，如开发环境使用：localhost。</p>

      <h3>步骤5: 获取安全密钥</h3>
      <p>点击"Key管理" > 查看对应Key详情，获取安全密钥(jscode)。</p>

      <h3>步骤6: 替换代码中的密钥</h3>
      <pre class="code-block">
// 地图API密钥
const API_KEY = "您申请的Key"; 

// 设置安全密钥
window._AMapSecurityConfig = {
  securityJsCode: "您的安全密钥",
};
      </pre>
    </div>

    <template #footer>
      <a-button @click="showApiKeyGuide = false">关闭</a-button>
      <a-button type="primary" href="https://lbs.amap.com/" target="_blank">
        前往高德开放平台
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  reactive,
  computed,
  watch,
  shallowRef,
  nextTick,
} from "vue";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  IconLocation,
  IconPlus,
  IconMinus,
  IconTag as IconTarget,
  IconEar as IconCar,
  IconBrush as IconBus,
  IconMindMapping as IconBike,
  IconFire as IconFootPrint,
  IconInfoCircle,
  IconSearch,
  IconExclamationCircleFill,
  IconRefresh,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";

// 扩展Window接口，添加AMap
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
    init: () => void;
  }
}

// 设置安全密钥 - 高德地图API安全密钥，用于服务端验证
window._AMapSecurityConfig = {
  securityJsCode: "45273a1adf814a6d97ae30dc5c998d72", // 与API_KEY匹配的安全密钥
};

// 全局地图初始化回调
window.init = () => {
  console.log("高德地图脚本回调初始化完成");
};

// 地图参数
const zoom = ref(13);
const longitude = 104.066801; // 成都天府广场经度
const latitude = 30.657034; // 成都天府广场纬度

// 地图API密钥 - 已配置高德开发者平台Web服务和JS API权限
const API_KEY = "9b4bcf86e95f14cc8ce348f2e59dd32f"; // 正式API密钥

// 当前位置
const currentLng = ref(longitude);
const currentLat = ref(latitude);
const currentLocationName = ref("成都天府广场");

// 地图实例
const mapInstance = shallowRef<any>(null);
const walking = shallowRef<any>(null);

// 地图加载状态
const mapLoading = ref(true);
const mapLoadError = ref(false);
const apiKeyInvalid = ref(false);
const showApiKeyGuide = ref(false);

// 地点数据接口
interface PlaceItem {
  name: string;
  address: string;
  location: string;
}

// 路线规划表单
const routeForm = reactive({
  origin: "",
  originCoord: "",
  destination: "",
  destinationCoord: "",
  mode: "walking", // 默认步行出行方式
});

// 下拉框显示状态
const showOriginDropdown = ref(false);
const showDestinationDropdown = ref(false);

// DOM引用
const originInputRef = ref<HTMLElement | null>(null);
const destinationInputRef = ref<HTMLElement | null>(null);

// 处理点击事件
function handleOutsideClick(event: MouseEvent) {
  // 检查点击是否在起点输入框区域外
  if (
    originInputRef.value &&
    !originInputRef.value.contains(event.target as Node)
  ) {
    showOriginDropdown.value = false;
  }

  // 检查点击是否在终点输入框区域外
  if (
    destinationInputRef.value &&
    !destinationInputRef.value.contains(event.target as Node)
  ) {
    showDestinationDropdown.value = false;
  }
}

// 加载状态
const loading = ref(false);
const searchingOrigin = ref(false);
const searchingDestination = ref(false);

// 搜索结果
const originResults = ref<PlaceItem[]>([]);
const destinationResults = ref<PlaceItem[]>([]);

// 路线结果
interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface RouteResultType {
  distance: number;
  duration: number;
  path: string;
  steps: RouteStep[];
}

const routeResult = ref<RouteResultType | null>(null);

// 路线是否已生成
const routeLine = ref(false);

// 监听表单经纬度变化，当起点和终点坐标都有值时自动规划路线
watch(
  [() => routeForm.originCoord, () => routeForm.destinationCoord],
  async ([newOrigin, newDestination]) => {
    if (newOrigin && newDestination && mapInstance.value) {
      await planRoute();
    }
  }
);

// 监听起点输入变化，进行地点搜索
let originSearchTimer: number | null = null;
watch(
  () => routeForm.origin,
  (newValue) => {
    if (originSearchTimer) {
      clearTimeout(originSearchTimer);
    }

    if (newValue && newValue.length > 1) {
      originSearchTimer = window.setTimeout(() => {
        searchPlace("origin", newValue);
      }, 500);
    } else {
      originResults.value = [];
      routeForm.originCoord = "";
    }
  }
);

// 监听终点输入变化，进行地点搜索
let destinationSearchTimer: number | null = null;
watch(
  () => routeForm.destination,
  (newValue) => {
    if (destinationSearchTimer) {
      clearTimeout(destinationSearchTimer);
    }

    if (newValue && newValue.length > 1) {
      destinationSearchTimer = window.setTimeout(() => {
        searchPlace("destination", newValue);
      }, 500);
    } else {
      destinationResults.value = [];
      routeForm.destinationCoord = "";
    }
  }
);

// 防抖定时器
let debounceTimer: number | null = null;

// 使用当前位置作为起点
function useCurrentAsOrigin() {
  routeForm.origin = currentLocationName.value;
  routeForm.originCoord = `${currentLng.value},${currentLat.value}`;
  Message.success("已设置当前位置为起点");
}

// 地点搜索函数
async function searchPlace(type: "origin" | "destination", keyword: string) {
  if (type === "origin") {
    searchingOrigin.value = true;
  } else {
    searchingDestination.value = true;
  }

  try {
    // 方法1: 使用高德地图JS API搜索POI，避免Web服务授权问题
    if (window.AMap && window.AMap.PlaceSearch) {
      return searchPlaceUsingJSAPI(type, keyword);
    }

    // 方法2: 尝试使用高德地图地理编码Web服务API
    const geocodeUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(
      keyword
    )}&key=${API_KEY}&city=成都&output=json`;

    console.log("搜索URL:", geocodeUrl);
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    console.log("搜索返回数据:", data);

    if (data.status !== "1") {
      // 如果是密钥错误，标记为无效并使用备用方法
      if (
        data.info === "USERKEY_PLAT_NOMATCH" ||
        data.info === "INVALID_USER_KEY"
      ) {
        apiKeyInvalid.value = true;
        // 使用备用搜索方法
        return searchPlaceBackup(type, keyword);
      }
      throw new Error(data.info || "搜索失败");
    }

    // 处理返回结果
    const results = data.geocodes.map((item: any) => ({
      name: item.formatted_address || item.formattedAddress,
      address: `${item.province}${item.city}${item.district || ""}`,
      location: item.location,
    }));

    if (type === "origin") {
      originResults.value = results;
      if (results.length > 0) {
        showOriginDropdown.value = true;
      }
    } else {
      destinationResults.value = results;
      if (results.length > 0) {
        showDestinationDropdown.value = true;
      }
    }
  } catch (error) {
    console.error("地点搜索失败:", error);
    apiKeyInvalid.value = true;

    // 使用备用搜索方法
    searchPlaceBackup(type, keyword);
  } finally {
    if (type === "origin") {
      searchingOrigin.value = false;
    } else {
      searchingDestination.value = false;
    }
  }
}

// 使用JS API进行地点搜索
async function searchPlaceUsingJSAPI(
  type: "origin" | "destination",
  keyword: string
) {
  return new Promise<void>((resolve) => {
    try {
      // 创建PlaceSearch实例
      const placeSearch = new window.AMap.PlaceSearch({
        city: "成都",
        pageSize: 10,
        pageIndex: 1,
      });

      // 搜索POI
      placeSearch.search(keyword, (status: string, result: any) => {
        console.log("JS API搜索结果:", status, result);

        if (status === "complete" && result.info === "OK") {
          // 转换搜索结果格式
          const results = result.poiList.pois.map((item: any) => ({
            name: item.name,
            address:
              item.address ||
              `${item.pname}${item.cityname}${item.adname || ""}`,
            location: `${item.location.lng},${item.location.lat}`,
          }));

          if (type === "origin") {
            originResults.value = results;
            if (results.length > 0) {
              showOriginDropdown.value = true;
            }
          } else {
            destinationResults.value = results;
            if (results.length > 0) {
              showDestinationDropdown.value = true;
            }
          }
        } else {
          // JS API搜索失败，使用备用方法
          searchPlaceBackup(type, keyword);
        }
        resolve();
      });
    } catch (error) {
      console.error("JS API搜索失败:", error);
      searchPlaceBackup(type, keyword);
      resolve();
    }
  });
}

// 备用搜索方法 - 当API密钥无效时使用
function searchPlaceBackup(type: "origin" | "destination", keyword: string) {
  console.log("使用备用搜索方法:", keyword);
  Message.warning("由于API密钥限制，启用简易搜索");

  // 模拟搜索结果 - 使用当前地图中心点
  const mockResult = {
    name: keyword,
    address: "搜索结果 (无精确定位)",
    location: `${currentLng.value},${currentLat.value}`,
  };

  const results = [mockResult];

  if (type === "origin") {
    originResults.value = results;
    showOriginDropdown.value = true;
  } else {
    destinationResults.value = results;
    showDestinationDropdown.value = true;
  }
}

// 选择地点
function selectPlace(type: "origin" | "destination", item: PlaceItem) {
  if (type === "origin") {
    routeForm.origin = item.name;
    routeForm.originCoord = item.location;
    originResults.value = [];
    showOriginDropdown.value = false;
  } else {
    routeForm.destination = item.name;
    routeForm.destinationCoord = item.location;
    destinationResults.value = [];
    showDestinationDropdown.value = false;
  }
}

// 初始化地图
function initMap() {
  console.log("开始初始化地图...");
  console.log("AMap是否已加载:", !!window.AMap);

  // 检查容器元素
  const container = document.getElementById("container");
  console.log("地图容器是否存在:", !!container);

  // 确保容器尺寸正确
  if (container) {
    // 获取容器的实际尺寸
    const { width, height } = container.getBoundingClientRect();
    console.log(
      "容器尺寸(clientWidth/Height):",
      container.clientWidth,
      container.clientHeight
    );
    console.log("容器尺寸(getBoundingClientRect):", width, height);
    console.log(
      "容器样式:",
      window.getComputedStyle(container).width,
      window.getComputedStyle(container).height
    );

    // 检查父级元素尺寸
    const parent = container.parentElement;
    if (parent) {
      console.log("父级容器尺寸:", parent.clientWidth, parent.clientHeight);
    }

    // 如果尺寸异常，尝试强制设置尺寸
    if (container.clientHeight < 100) {
      console.warn("容器高度异常，尝试强制设置!");
      container.style.width = "100%";
      container.style.height = "500px";
      // 触发回流
      container.offsetHeight;
      console.log(
        "强制设置后尺寸:",
        container.clientWidth,
        container.clientHeight
      );
    }
  }

  if (window.AMap && container) {
    try {
      mapLoading.value = true;

      // 创建地图实例
      mapInstance.value = new window.AMap.Map("container", {
        zoom: zoom.value,
        center: [longitude, latitude],
        resizeEnable: true,
        viewMode: "2D",
      });

      // 添加加载完成事件监听
      mapInstance.value.on("complete", () => {
        console.log("地图加载完成");
        mapLoading.value = false;

        // 强制调整地图容器大小
        const container = document.getElementById("container");
        if (container && container.clientHeight < 100) {
          console.log("地图加载完成后强制调整容器大小");
          container.style.height = "500px";
          if (mapInstance.value) {
            setTimeout(() => {
              mapInstance.value.resize();
            }, 100);
          }
        }

        // 为地图Canvas设置willReadFrequently属性
        setTimeout(() => {
          const mapContainer = document.getElementById("container");
          if (mapContainer) {
            const canvasElements = mapContainer.querySelectorAll("canvas");
            canvasElements.forEach((canvas) => {
              canvas.setAttribute("willReadFrequently", "true");
            });
          }
        }, 100);
      });

      console.log("地图实例创建成功:", !!mapInstance.value);

      // 添加控件，使用try-catch防止权限问题
      try {
        // 添加比例尺控件
        const scale = new window.AMap.Scale({
          position: "LB", // 左下角
        });
        mapInstance.value.addControl(scale);

        // 添加工具条控件
        const toolbar = new window.AMap.ToolBar({
          position: "RT", // 右上角
        });
        mapInstance.value.addControl(toolbar);

        console.log("地图控件添加成功");
      } catch (e) {
        console.warn("地图控件添加失败:", e);
      }

      // 地图点击事件
      mapInstance.value.on("click", (e: any) => {
        const lnglat = e.lnglat;
        console.log("地图点击事件:", lnglat);
        currentLng.value = lnglat.getLng();
        currentLat.value = lnglat.getLat();

        // 逆地理编码，获取点击位置的地址信息
        window.AMap.plugin("AMap.Geocoder", () => {
          const geocoder = new window.AMap.Geocoder();
          geocoder.getAddress(
            [currentLng.value, currentLat.value],
            (status: string, result: any) => {
              console.log("逆地理编码结果:", status, result);

              if (status === "complete" && result.info === "OK") {
                currentLocationName.value = result.regeocode.formattedAddress;
              } else if (status === "error" && result === "INVALID_USER_KEY") {
                // 标记API密钥无效
                apiKeyInvalid.value = true;
                // 使用经纬度作为地址
                currentLocationName.value = `经度:${currentLng.value.toFixed(
                  6
                )}, 纬度:${currentLat.value.toFixed(6)}`;
              }
            }
          );
        });
      });

      // 初始化Walking实例
      window.AMap.plugin("AMap.Walking", () => {
        walking.value = new window.AMap.Walking({
          map: mapInstance.value,
          panel: false,
        });
        console.log("Walking实例创建成功:", !!walking.value);
      });

      // 初始化PlaceSearch插件
      window.AMap.plugin("AMap.PlaceSearch", () => {
        console.log("PlaceSearch插件加载成功");
      });

      // 添加标记，显示初始位置
      new window.AMap.Marker({
        position: [longitude, latitude],
        map: mapInstance.value,
      });
      console.log("初始标记添加成功");
    } catch (error) {
      console.error("地图初始化错误:", error);
      mapLoadError.value = true;
      Message.error(`地图初始化失败: ${error}`);
    }
  } else {
    console.error("无法初始化地图: AMap未加载或容器不存在");
    mapLoadError.value = true;
    Message.error("地图初始化失败: AMap未加载或容器不存在");
  }
}

// 路线规划函数
async function planRoute() {
  if (
    !routeForm.originCoord ||
    !routeForm.destinationCoord ||
    !mapInstance.value
  ) {
    Message.error("请输入起点和终点");
    return;
  }

  // 如果已经在加载中，则不重复请求
  if (loading.value) return;

  // 防抖处理
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(async () => {
    loading.value = true;

    try {
      if (walking.value) {
        // 清除之前的路线
        walking.value.clear();

        // 起点和终点坐标
        const [originLng, originLat] = routeForm.originCoord
          .split(",")
          .map(Number);
        const [destLng, destLat] = routeForm.destinationCoord
          .split(",")
          .map(Number);

        // 检查坐标是否有效
        if (
          isNaN(originLng) ||
          isNaN(originLat) ||
          isNaN(destLng) ||
          isNaN(destLat)
        ) {
          throw new Error("坐标格式无效");
        }

        // 创建起点和终点标记
        const startMarker = new window.AMap.Marker({
          position: [originLng, originLat],
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/start.png",
          map: mapInstance.value,
        });

        const endMarker = new window.AMap.Marker({
          position: [destLng, destLat],
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/end.png",
          map: mapInstance.value,
        });

        console.log(
          "开始路线规划查询:",
          originLng,
          originLat,
          "到",
          destLng,
          destLat
        );

        // 路线规划
        walking.value.search(
          new window.AMap.LngLat(originLng, originLat),
          new window.AMap.LngLat(destLng, destLat),
          (status: string, result: any) => {
            console.log("路线规划结果状态:", status);
            console.log("路线规划结果数据:", result);

            if (
              status === "complete" &&
              result.routes &&
              result.routes.length > 0
            ) {
              // 获取第一条路径
              const path = result.routes[0];
              console.log("获取到路径:", path);

              // 构建路线结果
              routeResult.value = {
                distance: +(path.distance / 1000).toFixed(1), // 转换为公里
                duration: Math.ceil(path.time / 60), // 转换为分钟
                path: "", // 在JavaScript API中不需要这个字段
                steps: path.steps.map((step: any) => ({
                  instruction: step.instruction,
                  distance: Math.round(step.distance),
                  duration: Math.ceil(step.time / 60),
                })),
              };

              // 调整地图视图以适应路线
              mapInstance.value.setFitView([startMarker, endMarker]);

              routeLine.value = true;
              Message.success("路线规划成功");
            } else {
              console.error("路线规划失败:", status, result);

              // 尝试检查两点之间的距离，如果距离过远，提示用户
              const distance = new window.AMap.LngLat(
                originLng,
                originLat
              ).distance(new window.AMap.LngLat(destLng, destLat));
              console.log("两点之间的直线距离(米):", distance);

              if (distance > 50000) {
                Message.error("距离过远，步行路线规划仅支持50公里以内的路线");
              } else if (
                status === "error" &&
                (result === "USERKEY_PLAT_NOMATCH" ||
                  result === "INVALID_USER_KEY")
              ) {
                // 标记API密钥无效
                apiKeyInvalid.value = true;

                Message.warning("API密钥无效，使用直线连接起终点");
                // 创建直线连接起终点
                createStraightLine(
                  [originLng, originLat],
                  [destLng, destLat],
                  startMarker,
                  endMarker
                );
              } else {
                Message.error("路线规划失败，可能是系统不支持的路线");
              }
            }
          }
        );
      } else {
        throw new Error("地图服务未就绪");
      }
    } catch (error) {
      console.error("路线规划失败:", error);
      Message.error("路线规划失败，请稍后重试");
    } finally {
      loading.value = false;
      debounceTimer = null;
    }
  }, 500);
}

// 创建直线连接起终点
function createStraightLine(
  origin: [number, number],
  destination: [number, number],
  startMarker: any,
  endMarker: any
) {
  if (!mapInstance.value) return;

  // 创建折线
  const polyline = new window.AMap.Polyline({
    path: [origin, destination],
    isOutline: true,
    outlineColor: "#ffeeff",
    borderWeight: 2,
    strokeColor: "#3366FF",
    strokeOpacity: 0.9,
    strokeWeight: 6,
    strokeStyle: "solid",
    lineJoin: "round",
    lineCap: "round",
    zIndex: 50,
  });

  // 添加到地图
  mapInstance.value.add(polyline);

  // 计算距离（直线距离）
  const distance = new window.AMap.LngLat(origin[0], origin[1]).distance(
    new window.AMap.LngLat(destination[0], destination[1])
  );

  // 估算步行时间（假设平均步速 5 km/h）
  const durationMinutes = Math.ceil((distance / 1000 / 5) * 60);

  // 设置路线结果
  routeResult.value = {
    distance: +(distance / 1000).toFixed(1),
    duration: durationMinutes,
    path: "",
    steps: [
      {
        instruction: `从起点步行到终点，沿直线路径前进`,
        distance: Math.round(distance),
        duration: durationMinutes,
      },
    ],
  };

  // 调整地图视图以适应路线
  mapInstance.value.setFitView([startMarker, endMarker, polyline]);

  routeLine.value = true;
}

// 缩放控制
function zoomIn() {
  if (mapInstance.value) {
    const currentZoom = mapInstance.value.getZoom();
    mapInstance.value.setZoom(currentZoom + 1);
  }
}

function zoomOut() {
  if (mapInstance.value) {
    const currentZoom = mapInstance.value.getZoom();
    mapInstance.value.setZoom(currentZoom - 1);
  }
}

// 加载高德地图JS API
function loadAMapScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.AMap) {
      console.log("AMap已存在，无需重新加载");
      // 设置Canvas的willReadFrequently属性
      setTimeout(() => {
        const canvasElements = document.querySelectorAll("canvas");
        canvasElements.forEach((canvas) => {
          canvas.setAttribute("willReadFrequently", "true");
        });
      }, 100);
      resolve();
      return;
    }

    console.log("开始加载AMap...");
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${API_KEY}&plugin=AMap.Walking,AMap.Geocoder,AMap.Scale,AMap.ToolBar,AMap.PlaceSearch`;
    script.onerror = (e) => {
      console.error("地图脚本加载失败:", e);
      mapLoadError.value = true;
      reject(e);
    };
    script.onload = () => {
      console.log("AMap脚本加载成功");
      // 设置Canvas的willReadFrequently属性
      setTimeout(() => {
        const canvasElements = document.querySelectorAll("canvas");
        canvasElements.forEach((canvas) => {
          canvas.setAttribute("willReadFrequently", "true");
        });
      }, 100);
      resolve();
    };
    document.head.appendChild(script);
  });
}

// 重新加载地图
async function reloadMap() {
  mapLoadError.value = false;
  mapLoading.value = true;

  try {
    await loadAMapScript();
    await nextTick();
    initMap();
  } catch (error) {
    console.error("地图重新加载失败:", error);
    mapLoadError.value = true;
    Message.error("地图重新加载失败，请刷新页面重试");
  }
}

onMounted(async () => {
  console.log("组件已挂载，准备加载地图");

  try {
    await loadAMapScript();
    console.log("地图脚本加载完成，准备初始化地图");

    // 确保DOM已渲染
    await nextTick();

    // 延长初始化时间，确保DOM已完全渲染和布局计算完成
    setTimeout(() => {
      // 再次检查容器尺寸
      const container = document.getElementById("container");
      if (
        container &&
        (container.clientWidth === 0 || container.clientHeight === 0)
      ) {
        console.log("容器尺寸仍不正确，等待更长时间...");
        // 再次延迟初始化
        setTimeout(() => {
          console.log("再次尝试初始化地图");
          initMap();
        }, 1000);
      } else {
        initMap();
      }
    }, 1000);
  } catch (error) {
    console.error("地图加载失败:", error);
    mapLoadError.value = true;
    Message.error("地图加载失败，请刷新页面重试");
  }

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // 销毁地图
  if (mapInstance.value) {
    mapInstance.value.destroy();
  }
  window.removeEventListener("resize", handleResize);
});

// 窗口大小变化时调整地图尺寸
function handleResize() {
  if (mapInstance.value) {
    mapInstance.value.resize();
  }
}

// 强制刷新地图
function forceResizeMap() {
  console.log("强制刷新地图");

  if (mapInstance.value) {
    // 销毁当前地图实例
    mapInstance.value.destroy();
    mapInstance.value = null;
  }

  // 延迟重新创建地图，确保DOM已更新
  setTimeout(() => {
    const container = document.getElementById("container");
    if (container) {
      console.log(
        "刷新前容器尺寸:",
        container.clientWidth,
        container.clientHeight
      );

      // 尝试强制计算容器尺寸
      container.style.display = "none";
      // 触发回流
      container.offsetHeight;
      container.style.display = "block";

      console.log(
        "刷新后容器尺寸:",
        container.clientWidth,
        container.clientHeight
      );
    }

    // 重新初始化地图
    initMap();
  }, 500);
}
</script>

<style>
/* 地图页面卡片样式 */
.map-page-card {
  width: 100%;
  height: calc(100vh - 160px); /* 减去header和footer高度 */
  display: flex;
  flex-direction: column;
}

/* 地图页面布局 */
.map-page-layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
  flex: 1; /* 确保布局占据所有可用空间 */
}

/* 左侧地图区域 */
.map-side {
  flex: 3;
  position: relative;
  height: 100%; /* 确保高度为100% */
  min-height: 500px;
  overflow: hidden;
  width: 800px; /* 设置固定宽度为800px */
  background-color: #f5f7f9;
  box-sizing: border-box;
  display: flex; /* 使用flex确保子元素可以填充高度 */
  flex-direction: column;
}

/* 地图容器 */
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 400px; /* 添加最小高度确保容器有高度 */
  flex: 1; /* 确保容器填充所有可用空间 */
  display: flex; /* 使用flex布局 */
  flex-direction: column; /* 纵向布局 */
}

.amap-container {
  width: 100%;
  height: 100%;
  min-height: 400px; /* 添加最小高度确保地图有高度 */
  flex: 1; /* 让地图元素填充所有可用空间 */
}

/* 右侧路线规划区域 */
.route-side {
  flex: 1;
  overflow-y: auto;
  max-height: 100%;
}

.route-card {
  height: 100%;
}

/* 输入框容器 */
.input-container {
  position: relative;
}

/* 地图控件样式 */
.map-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
}

.zoom-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 地图信息样式 */
.map-info {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.location-info {
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.coordinates {
  font-size: 12px;
  color: #666;
}

/* 搜索结果样式 */
.search-results {
  position: absolute;
  z-index: 100;
  background-color: #fff;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
}

.place-item {
  padding: 8px 0;
}

.place-name {
  font-weight: bold;
}

.place-address {
  font-size: 12px;
  color: #999;
}

/* 路线规划结果样式 */
.route-result {
  margin-top: 16px;
}

.route-summary {
  margin-bottom: 16px;
}

.route-steps {
  margin-top: 16px;
}

.step-detail {
  font-size: 12px;
  color: #666;
}

.route-tip {
  color: #8c8c8c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .map-page-layout {
    flex-direction: column;
  }

  .map-side,
  .route-side {
    flex: none;
    width: 100%;
  }

  .map-side {
    height: 60vh;
  }

  .route-side {
    height: auto;
  }

  .map-info {
    left: 8px;
    bottom: 8px;
    padding: 6px 12px;
  }

  .map-controls {
    right: 8px;
    bottom: 8px;
  }
}

/* 地图加载状态样式 */
.map-loading-container,
.map-error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 20;
}

.map-loading-text,
.map-error-text {
  margin-top: 16px;
  font-size: 16px;
  color: #333;
}

.map-error-text {
  margin-bottom: 16px;
  color: #f53f3f;
}

/* API密钥警告样式 */
.api-key-warning {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-key-warning-text {
  margin: 0;
  font-size: 12px;
}

/* API密钥指南样式 */
.api-key-guide {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 16px;
}

.api-key-guide h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #165dff;
  font-size: 16px;
}

.api-key-guide p {
  margin-bottom: 12px;
  line-height: 1.5;
}

.code-block {
  background-color: #f5f7f9;
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  overflow-x: auto;
  white-space: pre;
  line-height: 1.5;
}
</style>
