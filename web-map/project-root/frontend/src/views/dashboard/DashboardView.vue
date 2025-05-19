<template>
  <DefaultLayout>
    <!-- 页面标题 -->
    <div class="routes-header">
      <div class="title-area">
        <h1 class="page-title">徒步路线</h1>
        <p class="page-desc">
          精选全国各地高品质徒步路线，根据难度和特点分类，助您畅享户外乐趣
        </p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <a-row :gutter="[16, 16]" align="center">
        <a-col :span="8">
          <a-input-search
            placeholder="搜索路线名称、地点"
            allow-clear
            v-model="searchQuery"
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="5">
          <a-select
            placeholder="难度等级"
            v-model="difficultyFilter"
            allow-clear
            @change="applyFilters"
          >
            <a-option value="easy">初级路线</a-option>
            <a-option value="medium">中级路线</a-option>
            <a-option value="hard">高级路线</a-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            placeholder="路线长度"
            v-model="distanceFilter"
            allow-clear
            @change="applyFilters"
          >
            <a-option value="short">短距离 (≤5公里)</a-option>
            <a-option value="medium">中等距离 (5-10公里)</a-option>
            <a-option value="long">长距离 (>10公里)</a-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            placeholder="所需时间"
            v-model="durationFilter"
            allow-clear
            @change="applyFilters"
          >
            <a-option value="short">短时间 (≤3小时)</a-option>
            <a-option value="medium">中等时间 (3-6小时)</a-option>
            <a-option value="long">长时间 (>6小时)</a-option>
          </a-select>
        </a-col>
      </a-row>
    </div>

    <!-- 路线列表 -->
    <a-divider style="margin: 16px 0" />

    <div class="routes-container">
      <a-row :gutter="[24, 24]">
        <a-col :span="8" v-for="route in filteredRoutes" :key="route.id">
          <a-card
            class="route-card"
            hoverable
            @click="viewRouteDetail(route.id)"
          >
            <template #cover>
              <div
                class="route-image"
                :style="{ backgroundImage: `url(${route.image})` }"
              >
                <div class="route-difficulty" :class="route.difficultyClass">
                  {{ route.difficulty }}
                </div>
              </div>
            </template>
            <a-card-meta :title="route.title">
              <template #description>
                <div class="route-info">
                  <div class="route-detail">
                    <icon-clock-circle class="info-icon" />
                    <span>{{ route.duration }}</span>
                  </div>
                  <div class="route-detail">
                    <icon-compass class="info-icon" />
                    <span>{{ route.distance }}</span>
                  </div>
                  <div class="route-detail">
                    <icon-fire class="info-icon" />
                    <span>{{ route.elevation }}</span>
                  </div>
                </div>
                <p class="route-summary">{{ route.description }}</p>
                <div class="route-meta">
                  <a-rate
                    :default-value="route.rating"
                    size="small"
                    readonly
                    allow-half
                  />
                  <span class="review-count">{{ route.reviews }}条评价</span>
                </div>
              </template>
            </a-card-meta>

            <div class="route-footer">
              <div class="route-extra-info">
                <div class="location">
                  <icon-location />
                  <span>{{ route.location }}</span>
                </div>
                <div class="seasons">
                  <template
                    v-for="(season, index) in route.seasons"
                    :key="index"
                  >
                    <a-tag :color="getSeasonColor(season)">{{ season }}</a-tag>
                  </template>
                </div>
              </div>
              <a-button
                type="primary"
                shape="round"
                @click.stop="openRouteDetail(route)"
              >
                查看详情
                <template #icon><icon-right /></template>
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMoreRoutes">
        <a-button type="text" @click="loadMoreRoutes">
          加载更多路线
          <template #icon><icon-down /></template>
        </a-button>
      </div>
    </div>

    <!-- 路线详情弹窗 -->
    <a-modal
      v-model:visible="detailVisible"
      :title="selectedRoute?.title"
      :footer="false"
      :maskClosable="true"
      width="700px"
    >
      <div v-if="selectedRoute" class="route-detail-modal">
        <!-- 路线地图 -->
        <div
          v-if="
            selectedRoute.coordinates &&
            isValidCoordinates(selectedRoute.coordinates)
          "
          class="route-detail-map"
        >
          <RouteMap :routeCoordinates="selectedRoute.coordinates" />
          <div class="route-difficulty" :class="selectedRoute.difficultyClass">
            {{ selectedRoute.difficulty }}
          </div>
        </div>

        <!-- 路线图片（当没有有效坐标时显示） -->
        <div
          v-else
          class="route-detail-image"
          :style="{ backgroundImage: `url(${selectedRoute.image})` }"
        >
          <div class="route-difficulty" :class="selectedRoute.difficultyClass">
            {{ selectedRoute.difficulty }}
          </div>
        </div>

        <!-- 路线基本信息 -->
        <div class="route-detail-info">
          <div class="info-row">
            <div class="info-item">
              <icon-clock-circle class="info-icon" />
              <span>时长: {{ selectedRoute.duration }}</span>
            </div>
            <div class="info-item">
              <icon-compass class="info-icon" />
              <span>距离: {{ selectedRoute.distance }}</span>
            </div>
            <div class="info-item">
              <icon-fire class="info-icon" />
              <span>海拔: {{ selectedRoute.elevation }}</span>
            </div>
          </div>

          <div class="info-item location">
            <icon-location class="info-icon" />
            <span>位置: {{ selectedRoute.location }}</span>
          </div>

          <div class="info-item seasons">
            <span>最佳季节: </span>
            <template
              v-for="(season, index) in selectedRoute.seasons"
              :key="index"
            >
              <a-tag :color="getSeasonColor(season)">{{ season }}</a-tag>
            </template>
          </div>
        </div>

        <!-- 路线描述 -->
        <a-divider>路线详情</a-divider>
        <div class="route-description">
          <p>{{ selectedRoute.description }}</p>
        </div>

        <!-- 路线起终点信息 -->
        <a-divider
          v-if="
            selectedRoute.coordinates &&
            isValidCoordinates(selectedRoute.coordinates)
          "
          >坐标信息</a-divider
        >
        <div
          class="route-coordinates-info"
          v-if="
            selectedRoute.coordinates &&
            isValidCoordinates(selectedRoute.coordinates)
          "
        >
          <div class="coordinate-actions">
            <a-button
              type="primary"
              size="small"
              @click="showEditCoordinates = true"
            >
              编辑坐标
            </a-button>
            <a-tag
              v-if="coordinateSource"
              :color="coordinateSourceColor"
              style="margin-left: 8px"
            >
              {{ coordinateSource }}
            </a-tag>
          </div>
          <div class="coordinate-item">
            <span class="coordinate-label">起点:</span>
            <span class="coordinate-value">{{
              selectedRoute.coordinates.startName || "起点"
            }}</span>
            <div class="coordinate-details">
              经度: {{ Number(selectedRoute.coordinates.startLng).toFixed(6) }},
              纬度: {{ Number(selectedRoute.coordinates.startLat).toFixed(6) }}
            </div>
          </div>
          <div class="coordinate-item">
            <span class="coordinate-label">终点:</span>
            <span class="coordinate-value">{{
              selectedRoute.coordinates.endName || "终点"
            }}</span>
            <div class="coordinate-details">
              经度: {{ Number(selectedRoute.coordinates.endLng).toFixed(6) }},
              纬度: {{ Number(selectedRoute.coordinates.endLat).toFixed(6) }}
            </div>
          </div>
        </div>

        <!-- 没有坐标时显示添加坐标按钮 -->
        <div v-else class="no-coordinates-info">
          <p>该路线暂无坐标信息</p>
          <a-button type="primary" @click="showEditCoordinates = true">
            添加坐标
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 坐标编辑弹窗 -->
    <a-modal
      v-model:visible="showEditCoordinates"
      title="编辑路线坐标"
      :width="600"
      @before-ok="handleSaveCoordinates"
      @before-cancel="cancelEditCoordinates"
      ok-text="保存坐标"
      cancel-text="取消"
    >
      <a-alert type="info" show-icon closable style="margin-bottom: 16px">
        <template #message>
          提示：服务器连接不可用时，坐标数据将自动保存在本地浏览器中。
        </template>
        <template #description>
          <p>经度范围：-180 ~ 180，纬度范围：-90 ~ 90</p>
          <p>中国大陆经度大约在73 ~ 135之间，纬度在18 ~ 53之间。</p>
          <p v-if="coordinateSource">
            当前数据来源：<a-tag :color="coordinateSourceColor">{{
              coordinateSource
            }}</a-tag>
          </p>
        </template>
      </a-alert>

      <a-form :model="editingCoordinates" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item field="startName" label="起点名称">
              <a-input
                v-model="editingCoordinates.startName"
                placeholder="例如: 成都东门"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="startLng" label="起点经度" required>
              <a-input-number
                v-model="editingCoordinates.startLng"
                placeholder="例如: 104.066801"
                :precision="6"
                :min="-180"
                :max="180"
                style="width: 100%"
              />
              <div class="form-help-text">中国经度范围: 73 ~ 135</div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="startLat" label="起点纬度" required>
              <a-input-number
                v-model="editingCoordinates.startLat"
                placeholder="例如: 30.657034"
                :precision="6"
                :min="-90"
                :max="90"
                style="width: 100%"
              />
              <div class="form-help-text">中国纬度范围: 18 ~ 53</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item field="endName" label="终点名称">
              <a-input
                v-model="editingCoordinates.endName"
                placeholder="例如: 成都西门"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="endLng" label="终点经度" required>
              <a-input-number
                v-model="editingCoordinates.endLng"
                placeholder="例如: 104.055701"
                :precision="6"
                :min="-180"
                :max="180"
                style="width: 100%"
              />
              <div class="form-help-text">中国经度范围: 73 ~ 135</div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="endLat" label="终点纬度" required>
              <a-input-number
                v-model="editingCoordinates.endLat"
                placeholder="例如: 30.649028"
                :precision="6"
                :min="-90"
                :max="90"
                style="width: 100%"
              />
              <div class="form-help-text">中国纬度范围: 18 ~ 53</div>
            </a-form-item>
          </a-col>
        </a-row>

        <div class="coordinates-tips">
          <div class="tips-title">
            <icon-info-circle style="margin-right: 4px; font-size: 18px" />
            坐标获取提示
          </div>
          <p>您可以从以下地图服务复制经纬度坐标：</p>
          <ul>
            <li>高德地图：右击地图位置 → 复制经纬度</li>
            <li>百度地图：点击右下角"更多" → 复制坐标</li>
            <li>腾讯地图：右击地图 → 在此添加标注 → 查看坐标</li>
          </ul>
          <p>经度范围：-180° 到 180°，中国大致在 73° 到 135° 之间</p>
          <p>纬度范围：-90° 到 90°，中国大致在 3° 到 53° 之间</p>
        </div>
      </a-form>
    </a-modal>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import {
  hikingRoutesService,
  HikingRoute,
  RouteCoordinates,
} from "../../services/hiking-routes.service";
import {
  IconClockCircle,
  IconCompass,
  IconFire,
  IconLocation,
  IconRight,
  IconDown,
  IconInfoCircle,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
// 导入地图组件
import RouteMap from "../../components/RouteMap.vue";

const router = useRouter();

// 筛选和搜索状态
const searchQuery = ref("");
const difficultyFilter = ref("");
const distanceFilter = ref("");
const durationFilter = ref("");
const currentPage = ref(1);
const hasMoreRoutes = ref(true);

// 路线数据，初始为空数组
const allRoutes = ref<HikingRoute[]>([]);
const loading = ref(true);

// 添加弹窗状态管理
const detailVisible = ref(false);
const selectedRoute = ref<HikingRoute | null>(null);
const showEditCoordinates = ref(false);
const coordinateSource = ref<string>(""); // 坐标数据来源
const coordinateSourceColor = ref<string>("blue"); // 数据来源标签颜色
const editingCoordinates = ref<RouteCoordinates>({
  id: 0,
  routeId: 0,
  startName: "",
  startLat: 0,
  startLng: 0,
  endName: "",
  endLat: 0,
  endLng: 0,
  waypoints: [],
});

// 从API获取路线数据
const fetchRoutes = async () => {
  try {
    loading.value = true;
    const routes = await hikingRoutesService.getAllRoutes();
    allRoutes.value = routes;
  } catch (error) {
    console.error("获取路线数据失败:", error);
    Message.error("获取路线数据失败，请刷新页面重试");
  } finally {
    loading.value = false;
  }
};

// 计算筛选后的路线
const filteredRoutes = computed(() => {
  let result = [...allRoutes.value];
  console.log("筛选前路线数:", result.length);

  // 应用搜索查询
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (route) =>
        route.title.toLowerCase().includes(query) ||
        route.location.toLowerCase().includes(query)
    );
    console.log("搜索后路线数:", result.length);
  }

  // 应用难度筛选
  if (difficultyFilter.value) {
    result = result.filter(
      (route) => route.difficultyClass === difficultyFilter.value
    );
    console.log("难度筛选后路线数:", result.length);
  }

  // 应用距离筛选
  if (distanceFilter.value) {
    result = result.filter((route) => {
      // 提取数字部分
      const distanceStr = route.distance.replace(/[^0-9.]/g, "");
      const distance = parseFloat(distanceStr);

      if (distanceFilter.value === "short") return distance <= 5;
      if (distanceFilter.value === "medium")
        return distance > 5 && distance <= 10;
      if (distanceFilter.value === "long") return distance > 10;
      return true;
    });
    console.log("距离筛选后路线数:", result.length);
  }

  // 应用时间筛选
  if (durationFilter.value) {
    result = result.filter((route) => {
      // 提取数字部分
      const durationStr = route.duration.replace(/[^0-9.]/g, "");
      const duration = parseFloat(durationStr);

      if (durationFilter.value === "short") return duration <= 3;
      if (durationFilter.value === "medium")
        return duration > 3 && duration <= 6;
      if (durationFilter.value === "long") return duration > 6;
      return true;
    });
    console.log("时间筛选后路线数:", result.length);
  }

  return result;
});

// 处理搜索
function handleSearch() {
  console.log("执行搜索:", searchQuery.value);
  applyFilters();
}

// 应用筛选
function applyFilters() {
  console.log("应用筛选条件:", {
    搜索: searchQuery.value,
    难度: difficultyFilter.value,
    距离: distanceFilter.value,
    时间: durationFilter.value,
  });

  currentPage.value = 1;
  hasMoreRoutes.value = filteredRoutes.value.length > 6;

  if (filteredRoutes.value.length === 0) {
    Message.info("没有符合条件的路线，请尝试其他筛选条件");
  }
}

// 获取季节标签颜色
function getSeasonColor(season: string) {
  switch (season) {
    case "春季":
      return "green";
    case "夏季":
      return "blue";
    case "秋季":
      return "orange";
    case "冬季":
      return "arcoblue";
    default:
      return "gray";
  }
}

// 打开路线详情弹窗
async function openRouteDetail(route: HikingRoute) {
  selectedRoute.value = route;
  detailVisible.value = true;
  coordinateSource.value = ""; // 重置数据来源

  // 如果路线没有坐标信息，尝试获取
  if (!route.coordinates || !isValidCoordinates(route.coordinates)) {
    try {
      const coordinates = await hikingRoutesService.getRouteCoordinates(
        route.id
      );

      if (coordinates && isValidCoordinates(coordinates)) {
        selectedRoute.value = {
          ...selectedRoute.value,
          coordinates: coordinates,
        };

        // 设置坐标数据来源
        if (coordinates.id > 0) {
          coordinateSource.value = "服务器数据";
          coordinateSourceColor.value = "green";
        } else if (localStorage.getItem("hiking-route-coordinates")) {
          const savedCoords = JSON.parse(
            localStorage.getItem("hiking-route-coordinates") || "{}"
          );
          if (savedCoords[route.id]) {
            coordinateSource.value = "本地存储";
            coordinateSourceColor.value = "orange";
          } else {
            coordinateSource.value = "模拟数据";
            coordinateSourceColor.value = "gray";
          }
        } else {
          coordinateSource.value = "模拟数据";
          coordinateSourceColor.value = "gray";
        }
      }
    } catch (error) {
      console.error("获取路线坐标失败:", error);
      coordinateSource.value = "模拟数据";
      coordinateSourceColor.value = "gray";
    }
  } else {
    // 路线自带坐标信息
    coordinateSource.value = "路线内置";
    coordinateSourceColor.value = "blue";
  }
}

// 查看路线详情
async function viewRouteDetail(id: number) {
  const route = allRoutes.value.find((r) => r.id === id);
  if (route) {
    await openRouteDetail(route);
  } else {
    Message.error("未找到路线详情");
  }
}

// 验证坐标有效性
function isValidCoordinates(coordinates: any) {
  if (!coordinates) return false;

  const startLng = Number(coordinates.startLng);
  const startLat = Number(coordinates.startLat);
  const endLng = Number(coordinates.endLng);
  const endLat = Number(coordinates.endLat);

  return !(
    isNaN(startLng) ||
    isNaN(startLat) ||
    isNaN(endLng) ||
    isNaN(endLat) ||
    startLng === 0 ||
    startLat === 0 ||
    endLng === 0 ||
    endLat === 0
  );
}

// 验证坐标是否在有效范围内
function isValidCoordinateRange(lng: number, lat: number) {
  // 全球范围检查
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;

  return true;
}

// 检查坐标是否在中国大陆范围内
function isInChinaMainland(lng: number, lat: number) {
  // 中国大陆范围的简单检查
  // 经度约为73°E至135°E，纬度约为18°N至53°N
  return lng >= 73 && lng <= 135 && lat >= 18 && lat <= 53;
}

// 加载更多路线
function loadMoreRoutes() {
  currentPage.value++;
  // 模拟加载更多路线
  // 实际应用中，这里应该调用API获取下一页的路线
  Message.success("加载更多路线成功");
  // 当没有更多路线时
  if (currentPage.value >= 3) {
    hasMoreRoutes.value = false;
  }
}

// 打开坐标编辑弹窗
function openEditCoordinates() {
  if (!selectedRoute.value) return;

  // 深拷贝已有坐标，如果有的话
  if (
    selectedRoute.value.coordinates &&
    isValidCoordinates(selectedRoute.value.coordinates)
  ) {
    editingCoordinates.value = JSON.parse(
      JSON.stringify(selectedRoute.value.coordinates)
    );
  } else {
    // 创建新坐标对象
    editingCoordinates.value = {
      id: 0,
      routeId: selectedRoute.value.id,
      startName: "起点",
      startLat: 0,
      startLng: 0,
      endName: "终点",
      endLat: 0,
      endLng: 0,
      waypoints: [],
    };
  }

  showEditCoordinates.value = true;
}

// 取消编辑坐标
function cancelEditCoordinates(): boolean {
  editingCoordinates.value = {
    id: 0,
    routeId: 0,
    startName: "",
    startLat: 0,
    startLng: 0,
    endName: "",
    endLat: 0,
    endLng: 0,
    waypoints: [],
  };
  showEditCoordinates.value = false;
  return true;
}

// 保存坐标
async function handleSaveCoordinates() {
  if (!selectedRoute.value) return false;

  try {
    // 显示加载状态
    Message.loading({
      content: "正在保存坐标信息...",
      duration: 1000,
    });

    // 确保设置了路线ID
    editingCoordinates.value.routeId = selectedRoute.value.id;

    // 检查坐标有效性
    if (!isValidCoordinates(editingCoordinates.value)) {
      Message.error("请输入有效的坐标信息，坐标不能为0");
      return false;
    }

    // 检查坐标范围
    const { startLng, startLat, endLng, endLat } = editingCoordinates.value;
    if (
      !isValidCoordinateRange(startLng, startLat) ||
      !isValidCoordinateRange(endLng, endLat)
    ) {
      Message.error("坐标超出有效范围，经度范围：-180~180，纬度范围：-90~90");
      return false;
    }

    // 检查是否在中国大陆
    if (
      !isInChinaMainland(startLng, startLat) ||
      !isInChinaMainland(endLng, endLat)
    ) {
      // 不阻止保存，但提示用户
      Message.warning("输入的坐标不在中国大陆范围内，请确认是否正确");
    }

    let success = false;
    let savedToLocalOnly = false;

    // 格式化坐标数据，确保字段名与数据库表结构一致
    const formattedCoordinates = {
      ...editingCoordinates.value,
      // 确保字段名与后端route_coordinates表字段匹配
      route_id: selectedRoute.value.id,
      start_name: editingCoordinates.value.startName,
      start_lat: editingCoordinates.value.startLat,
      start_lng: editingCoordinates.value.startLng,
      end_name: editingCoordinates.value.endName,
      end_lat: editingCoordinates.value.endLat,
      end_lng: editingCoordinates.value.endLng,
      // 保留原始字段以兼容前端格式
      routeId: selectedRoute.value.id,
    };

    console.log("准备保存的格式化坐标数据:", formattedCoordinates);

    try {
      // 导入坐标服务
      const coordinatesService = (await import("@/services/coordinates"))
        .default;
      let response;

      // 优先使用简单API（用于故障转移）
      try {
        console.log("尝试使用简单API保存坐标");
        response = await coordinatesService.saveCoordinatesSimple(
          formattedCoordinates
        );
        console.log("简单API保存坐标响应:", response);

        if (response && response.success) {
          success = true;
          savedToLocalOnly = true; // 简单API只接收数据，不真正存入数据库
          console.log("使用简单API保存坐标成功");
        }
      } catch (simpleApiError) {
        console.error("简单API保存失败:", simpleApiError);

        // 如果简单API失败，尝试常规API
        try {
          console.log("尝试使用常规API保存坐标");
          // 如果当前路线已有坐标ID，则更新；否则创建新坐标
          if (editingCoordinates.value.id) {
            success = await hikingRoutesService.updateRouteCoordinates(
              selectedRoute.value.id,
              formattedCoordinates
            );
          } else {
            // 尝试保存坐标
            success = await hikingRoutesService.saveRouteCoordinates(
              selectedRoute.value.id,
              formattedCoordinates
            );
          }
        } catch (regularApiError) {
          console.error("常规API保存失败:", regularApiError);
          throw regularApiError; // 传递错误到外层catch
        }
      }

      // API调用成功返回true，即使实际保存到了localStorage
      if (success) {
        // 检查是否存在localStorage中的数据，判断是否是本地保存
        const storageKey = "hiking-route-coordinates";
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const savedCoords = JSON.parse(savedData);
          if (savedCoords[selectedRoute.value.id]) {
            // 如果数据在localStorage中存在，可能是降级保存
            savedToLocalOnly = true;
          }
        }
      }
    } catch (error) {
      console.error("API调用失败，尝试本地保存:", error);
      // 手动保存到localStorage
      try {
        const storageKey = "hiking-route-coordinates";
        let savedCoordinates = {};
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          savedCoordinates = JSON.parse(savedData);
        }

        // 更新当前路线的坐标
        savedCoordinates = {
          ...savedCoordinates,
          [selectedRoute.value.id]: formattedCoordinates,
        };

        // 保存到localStorage
        localStorage.setItem(storageKey, JSON.stringify(savedCoordinates));
        console.log(
          `坐标数据已手动保存到localStorage, routeId=${selectedRoute.value.id}`
        );
        success = true;
        savedToLocalOnly = true;
      } catch (e) {
        console.error("本地存储保存失败:", e);
        Message.error("坐标保存失败，无法保存到本地存储");
        return false;
      }
    }

    if (success) {
      // 更新当前选中路线的坐标
      selectedRoute.value = {
        ...selectedRoute.value,
        coordinates: JSON.parse(JSON.stringify(editingCoordinates.value)),
      };

      // 更新坐标数据来源标识
      if (savedToLocalOnly) {
        coordinateSource.value = "本地存储";
        coordinateSourceColor.value = "orange";
        Message.success("路线坐标已保存至本地");
      } else {
        coordinateSource.value = "服务器数据";
        coordinateSourceColor.value = "green";
        Message.success("路线坐标保存成功，已存入数据库");
      }

      // 更新路线列表中的对应路线
      const index = allRoutes.value.findIndex(
        (r) => r.id === selectedRoute.value?.id
      );
      if (index !== -1) {
        allRoutes.value[index].coordinates = JSON.parse(
          JSON.stringify(editingCoordinates.value)
        );
      }

      showEditCoordinates.value = false;
      return true;
    } else {
      Message.error("路线坐标保存失败，请稍后重试");
      return false;
    }
  } catch (error) {
    console.error("保存坐标出错:", error);
    Message.error("保存坐标时发生错误");
    return false;
  }
}

// 监听showEditCoordinates变化
// 当打开编辑弹窗时，初始化数据
watch(showEditCoordinates, (newVal) => {
  if (newVal && selectedRoute.value) {
    openEditCoordinates();
  }
});

onMounted(() => {
  fetchRoutes();
});
</script>

<style scoped>
.routes-header {
  padding: 40px 0;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d2129;
}

.page-desc {
  font-size: 16px;
  color: #4e5969;
  max-width: 700px;
  margin: 0 auto;
}

.filter-section {
  margin-bottom: 20px;
}

.routes-container {
  margin-top: 20px;
  margin-bottom: 60px;
}

.route-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.route-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.route-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.route-difficulty {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.easy {
  background-color: #3dd2b4;
}

.medium {
  background-color: #f59b42;
}

.hard {
  background-color: #f4664a;
}

.route-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  margin-top: 4px;
}

.route-detail {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #86909c;
}

.info-icon {
  font-size: 14px;
  margin-right: 4px;
}

.route-summary {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  color: #86909c;
  font-size: 12px;
}

.review-count {
  margin-left: 8px;
}

.route-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  border-top: 1px solid #f2f3f5;
  padding-top: 16px;
}

.route-extra-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #4e5969;
}

.seasons {
  display: flex;
  gap: 4px;
}

.load-more {
  text-align: center;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .filter-section :deep(.arco-col) {
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-desc {
    font-size: 14px;
  }
}

/* 添加弹窗样式 */
.route-detail-modal {
  padding: 0;
}

.route-detail-image {
  height: 280px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 8px;
  margin-bottom: 20px;
}

.route-detail-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 8px;
}

.route-description {
  line-height: 1.8;
  color: #4e5969;
  text-align: justify;
  margin-bottom: 20px;
}

.route-detail-map {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.route-coordinates-info {
  margin-top: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.coordinate-item {
  margin-bottom: 12px;
}

.coordinate-item:last-child {
  margin-bottom: 0;
}

.coordinate-label {
  font-weight: 600;
  margin-right: 8px;
  color: #1d2129;
}

.coordinate-value {
  color: #4e5969;
}

.coordinate-details {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  margin-left: 20px;
}

.coordinate-actions {
  margin-bottom: 12px;
}

.no-coordinates-info {
  text-align: center;
  padding: 20px;
}

.coordinates-tips {
  margin-top: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.tips-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.form-help-text {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  line-height: 1.4;
}

/* 坐标数据来源标签 */
.coordinate-source {
  margin-left: 10px;
  display: inline-block;
}
</style> 