<template>
  <div class="route-map-container">
    <!-- 地图加载状态 -->
    <div v-if="mapLoading && !mapLoadError" class="map-loading-container">
      <a-spin :size="40" />
      <div class="map-loading-text">地图加载中...</div>
    </div>

    <!-- 地图加载错误 -->
    <div v-if="mapLoadError" class="map-error-container">
      <icon-exclamation-circle-fill style="fontsize: 24px; color: #f53f3f" />
      <div class="map-error-text">地图加载失败</div>
      <a-button type="primary" size="small" @click="reloadMap"
        >重新加载</a-button
      >
    </div>

    <!-- 地图渲染区域 -->
    <div id="route-map-container" class="amap-container"></div>

    <!-- 路线信息 -->
    <div class="route-info-overlay" v-if="routeCoordinates">
      <div class="route-points">
        <div class="start-point">
          <icon-play-circle-fill style="color: #00b42a" />
          <span>{{ routeCoordinates.startName || "起点" }}</span>
        </div>
        <div class="route-line-indicator"></div>
        <div class="end-point">
          <icon-close-circle-fill style="color: #f53f3f" />
          <span>{{ routeCoordinates.endName || "终点" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  shallowRef,
  nextTick,
  PropType,
} from "vue";
import { RouteCoordinates } from "../services/hiking-routes.service";
import { Message } from "@arco-design/web-vue";
import {
  IconPlayCircleFill,
  IconCloseCircleFill,
  IconExclamationCircleFill,
} from "@arco-design/web-vue/es/icon";
export default {
  name: "RouteMap",
  components: {
    IconPlayCircleFill,
    IconCloseCircleFill,
    IconExclamationCircleFill,
  },
  props: {
    routeCoordinates: {
      type: Object as PropType<RouteCoordinates | null | undefined>,
      default: null,
    },
  },
  setup(props) {
    // 扩展Window接口，添加AMap
    window._AMapSecurityConfig = {
      securityJsCode: "45273a1adf814a6d97ae30dc5c998d72",
    };

    // 地图API密钥
    const API_KEY = "9b4bcf86e95f14cc8ce348f2e59dd32f";

    // 地图实例
    const mapInstance = shallowRef<any>(null);
    const routeLine = shallowRef<any>(null);
    const startMarker = shallowRef<any>(null);
    const endMarker = shallowRef<any>(null);
    const wayPointMarkers = shallowRef<any[]>([]);

    // 地图加载状态
    const mapLoading = ref(true);
    const mapLoadError = ref(false);

    // 监听路线坐标变化，更新地图
    watch(
      () => props.routeCoordinates,
      (newCoordinates, oldCoordinates) => {
        console.log("路线坐标变化:", newCoordinates);

        // 先清除所有之前的对象
        clearMapObjects();

        if (newCoordinates && mapInstance.value) {
          // 如果有更详细的变化判断，可以在这里添加
          const oldStartLng = oldCoordinates?.startLng;
          const oldStartLat = oldCoordinates?.startLat;
          const newStartLng = newCoordinates.startLng;
          const newStartLat = newCoordinates.startLat;

          // 如果起点或终点坐标发生变化，记录日志
          if (oldStartLng !== newStartLng || oldStartLat !== newStartLat) {
            console.log(
              "起点坐标变化:",
              oldStartLng,
              oldStartLat,
              "->",
              newStartLng,
              newStartLat
            );
          }

          // 重新绘制路线
          try {
            drawRouteOnMap(newCoordinates);
          } catch (error) {
            console.error("路线绘制过程中发生错误:", error);

            // 尝试使用最简单的绘制方式
            try {
              // 清除之前可能存在的部分绘制
              clearMapObjects();

              // 仅显示起点和终点标记
              const startLng = Number(newCoordinates.startLng);
              const startLat = Number(newCoordinates.startLat);
              const endLng = Number(newCoordinates.endLng);
              const endLat = Number(newCoordinates.endLat);

              if (
                !isNaN(startLng) &&
                !isNaN(startLat) &&
                startLng !== 0 &&
                startLat !== 0
              ) {
                startMarker.value = new window.AMap.Marker({
                  position: [startLng, startLat],
                  icon: "https://webapi.amap.com/theme/v1.3/markers/n/start.png",
                  map: mapInstance.value,
                  title: newCoordinates.startName || "起点",
                });
              }

              if (
                !isNaN(endLng) &&
                !isNaN(endLat) &&
                endLng !== 0 &&
                endLat !== 0
              ) {
                endMarker.value = new window.AMap.Marker({
                  position: [endLng, endLat],
                  icon: "https://webapi.amap.com/theme/v1.3/markers/n/end.png",
                  map: mapInstance.value,
                  title: newCoordinates.endName || "终点",
                });
              }

              if (startMarker.value && endMarker.value) {
                mapInstance.value.setFitView(
                  [startMarker.value, endMarker.value],
                  false,
                  [50, 50, 50, 50]
                );
              } else if (startMarker.value) {
                mapInstance.value.setFitView(
                  [startMarker.value],
                  false,
                  [50, 50, 50, 50]
                );
              } else if (endMarker.value) {
                mapInstance.value.setFitView(
                  [endMarker.value],
                  false,
                  [50, 50, 50, 50]
                );
              }
            } catch (e) {
              console.error("备用绘制方式也失败:", e);
            }
          }
        }
      },
      { immediate: true, deep: true }
    );

    // 在地图上绘制路线
    async function drawRouteOnMap(coordinates: RouteCoordinates) {
      if (!mapInstance.value) return;

      // 清除之前的标记和路线
      clearMapObjects();

      console.log("绘制路线:", coordinates);

      // 验证坐标有效性
      const startLng = Number(coordinates.startLng);
      const startLat = Number(coordinates.startLat);
      const endLng = Number(coordinates.endLng);
      const endLat = Number(coordinates.endLat);

      if (
        isNaN(startLng) ||
        isNaN(startLat) ||
        isNaN(endLng) ||
        isNaN(endLat) ||
        startLng === 0 ||
        startLat === 0 ||
        endLng === 0 ||
        endLat === 0
      ) {
        console.error("坐标数据无效，无法创建路线");
        return;
      }

      // 检查起点和终点坐标是否相同或距离太近
      const isSamePoint = startLng === endLng && startLat === endLat;
      const distance = Math.sqrt(
        Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
      );

      if (isSamePoint) {
        console.warn("起点和终点坐标相同，仅添加一个标记点");
        startMarker.value = new window.AMap.Marker({
          position: [startLng, startLat],
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          map: mapInstance.value,
          title: coordinates.startName || "位置",
        });

        // 调整地图视图
        mapInstance.value.setZoomAndCenter(15, [startLng, startLat]);
        return;
      }

      try {
        // 创建起点标记
        startMarker.value = new window.AMap.Marker({
          position: [startLng, startLat],
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/start.png",
          map: mapInstance.value,
          title: coordinates.startName || "起点",
        });

        // 创建终点标记
        endMarker.value = new window.AMap.Marker({
          position: [endLng, endLat],
          icon: "https://webapi.amap.com/theme/v1.3/markers/n/end.png",
          map: mapInstance.value,
          title: coordinates.endName || "终点",
        });

        // 设置途经点标记
        if (coordinates.waypoints && coordinates.waypoints.length > 0) {
          coordinates.waypoints.forEach((waypoint, index) => {
            const wpLng = Number(waypoint.lng);
            const wpLat = Number(waypoint.lat);
            if (
              typeof wpLng === "number" &&
              typeof wpLat === "number" &&
              !isNaN(wpLng) &&
              !isNaN(wpLat) &&
              wpLng !== 0 &&
              wpLat !== 0
            ) {
              const marker = new window.AMap.Marker({
                position: [wpLng, wpLat],
                icon: "https://webapi.amap.com/theme/v1.3/markers/n/middle.png",
                map: mapInstance.value,
                title: `途经点${index + 1}`,
              });
              wayPointMarkers.value.push(marker);
            }
          });
        }

        // 使用步行规划
        console.log("使用步行路线规划");
        createWalkingRoute(coordinates);
      } catch (error) {
        console.error("路径绘制错误:", error);
        // 降级使用直线连接
        if (!routeLine.value) {
          console.log("降级使用直线连接方案");
          createDirectLines(coordinates);
        }
      }
    }

    // 创建步行路线规划
    function createWalkingRoute(coordinates: RouteCoordinates) {
      console.log("创建步行路径规划");

      try {
        if (!mapInstance.value || !window.AMap || !window.AMap.Walking) {
          console.error("地图实例或步行规划插件未初始化");
          createDirectLines(coordinates); // 降级使用直线
          return;
        }

        // 验证坐标有效性
        const startLng = Number(coordinates.startLng);
        const startLat = Number(coordinates.startLat);
        const endLng = Number(coordinates.endLng);
        const endLat = Number(coordinates.endLat);

        // 创建步行规划实例
        const walking = new window.AMap.Walking({
          map: mapInstance.value,
          hideMarkers: true, // 隐藏起终点标记，因为我们已经创建了自定义标记
          autoFitView: false, // 不自动调整视图，我们会手动调整
        });

        // 设置起终点坐标
        const startPoint = new window.AMap.LngLat(startLng, startLat);
        const endPoint = new window.AMap.LngLat(endLng, endLat);

        // 清除之前可能的规划结果
        if (routeLine.value) {
          mapInstance.value.remove(routeLine.value);
          routeLine.value = null;
        }

        // 搜索步行路径
        walking.search(startPoint, endPoint, (status: string, result: any) => {
          if (status === "complete") {
            console.log("步行路径规划成功", result);
            // 路径规划成功，结果已经自动添加到地图上
            // 保存路线引用，以便后续清除
            if (result && result.routes && result.routes.length > 0) {
              // 路线已经由步行插件绘制，我们只需调整视图
              routeLine.value = result; // 保存引用以便清除

              // 获取所有可见点以调整视图
              const viewPoints = [];
              if (startMarker.value) viewPoints.push(startMarker.value);
              if (endMarker.value) viewPoints.push(endMarker.value);

              if (wayPointMarkers.value.length > 0) {
                for (const marker of wayPointMarkers.value) {
                  if (marker) viewPoints.push(marker);
                }
              }

              if (viewPoints.length > 0) {
                // 使用更小的边距，使视图更加紧凑
                mapInstance.value.setFitView(
                  viewPoints,
                  false,
                  [10, 10, 10, 10]
                );

                // 获取当前缩放级别并设置为更大的值（更近距离查看）
                setTimeout(() => {
                  const currentZoom = mapInstance.value.getZoom();
                  console.log("当前缩放级别:", currentZoom);
                  // 设置更大的缩放级别，使视图更聚焦
                  const newZoom = Math.min(currentZoom + 2, 18); // 增加2级但不超过最大值18
                  console.log("设置新缩放级别:", newZoom);
                  mapInstance.value.setZoom(newZoom);

                  // 将地图中心设置为起点
                  if (startLng && startLat) {
                    console.log("设置地图中心为起点:", [startLng, startLat]);
                    mapInstance.value.setCenter([startLng, startLat]);
                  }
                }, 100);
              }
            }
          } else {
            console.error("步行路径规划失败", status, result);
            // 降级使用直线连接
            createDirectLines(coordinates);
          }
        });
      } catch (error) {
        console.error("创建步行路径出错:", error);
        // 降级使用直线连接
        createDirectLines(coordinates);
      }
    }

    // 创建直线连接各点
    function createDirectLines(coordinates: RouteCoordinates) {
      console.log("创建直线路径");

      try {
        if (!mapInstance.value) {
          console.error("地图实例未初始化");
          return;
        }

        // 先确保之前的路线已清除
        if (routeLine.value) {
          mapInstance.value.remove(routeLine.value);
          routeLine.value = null;
        }

        // 验证坐标有效性
        const startLng = Number(coordinates.startLng);
        const startLat = Number(coordinates.startLat);
        const endLng = Number(coordinates.endLng);
        const endLat = Number(coordinates.endLat);

        if (
          isNaN(startLng) ||
          isNaN(startLat) ||
          isNaN(endLng) ||
          isNaN(endLat) ||
          startLng === 0 ||
          startLat === 0 ||
          endLng === 0 ||
          endLat === 0
        ) {
          console.error("坐标数据无效，无法创建路线");
          return;
        }

        // 构建路径点
        let path = [[startLng, startLat]];
        const validWaypoints: Array<[number, number]> = [];

        // 筛选有效的途经点
        if (coordinates.waypoints && coordinates.waypoints.length > 0) {
          coordinates.waypoints.forEach((waypoint) => {
            const wpLng = Number(waypoint.lng);
            const wpLat = Number(waypoint.lat);
            if (!isNaN(wpLng) && !isNaN(wpLat) && wpLng !== 0 && wpLat !== 0) {
              validWaypoints.push([wpLng, wpLat]);
            }
          });
        }

        // 按照与起点的距离排序途经点
        if (validWaypoints.length > 1) {
          validWaypoints.sort((a, b) => {
            const distA = Math.sqrt(
              Math.pow(a[0] - startLng, 2) + Math.pow(a[1] - startLat, 2)
            );
            const distB = Math.sqrt(
              Math.pow(b[0] - startLng, 2) + Math.pow(b[1] - startLat, 2)
            );
            return distA - distB;
          });
        }

        // 添加有效的途经点
        path = path.concat(validWaypoints);

        // 添加终点
        path.push([endLng, endLat]);

        console.log("路径点数组:", path);
        console.log("途经点数量:", validWaypoints.length);

        // 创建折线
        try {
          const polylineOptions = {
            path: path,
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
          };

          // 尝试添加平滑曲线效果
          try {
            // @ts-ignore - 类型定义中可能没有包含所有API选项
            polylineOptions.geodesic = true;
          } catch (e) {
            console.warn("不支持geodesic选项");
          }

          routeLine.value = new window.AMap.Polyline(polylineOptions);
        } catch (e) {
          console.error("创建折线出错:", e);

          // 降级使用最简单的折线配置
          routeLine.value = new window.AMap.Polyline({
            path: path,
            strokeColor: "#3366FF",
            strokeWeight: 6,
          });
        }

        // 将折线添加到地图
        mapInstance.value.add(routeLine.value);

        // 调整地图视图
        const viewPoints = [];
        if (startMarker.value) viewPoints.push(startMarker.value);
        if (endMarker.value) viewPoints.push(endMarker.value);

        if (wayPointMarkers.value.length > 0) {
          for (const marker of wayPointMarkers.value) {
            if (marker) viewPoints.push(marker);
          }
        }

        if (viewPoints.length > 0) {
          // 使用更小的边距，使视图更加紧凑
          mapInstance.value.setFitView(viewPoints, false, [10, 10, 10, 10]);

          // 获取当前缩放级别并设置为更大的值（更近距离查看）
          setTimeout(() => {
            const currentZoom = mapInstance.value.getZoom();
            console.log("当前缩放级别:", currentZoom);
            // 设置更大的缩放级别，使视图更聚焦
            const newZoom = Math.min(currentZoom + 2, 18); // 增加2级但不超过最大值18
            console.log("设置新缩放级别:", newZoom);
            mapInstance.value.setZoom(newZoom);

            // 将地图中心设置为起点
            if (startLng && startLat) {
              console.log("设置地图中心为起点:", [startLng, startLat]);
              mapInstance.value.setCenter([startLng, startLat]);
            }
          }, 100);
        }
      } catch (error) {
        console.error("创建直线路径出错:", error);
      }
    }

    // 清除地图上的对象
    function clearMapObjects() {
      console.log("清除地图上的所有标记和路线");

      if (mapInstance.value) {
        try {
          // 清除起点标记
          if (startMarker.value) {
            mapInstance.value.remove(startMarker.value);
            startMarker.value = null;
          }

          // 清除终点标记
          if (endMarker.value) {
            mapInstance.value.remove(endMarker.value);
            endMarker.value = null;
          }

          // 清除路线
          if (routeLine.value) {
            mapInstance.value.remove(routeLine.value);
            routeLine.value = null;
          }

          // 清除途经点标记
          if (wayPointMarkers.value.length > 0) {
            wayPointMarkers.value.forEach((marker) => {
              if (marker) {
                mapInstance.value.remove(marker);
              }
            });
            wayPointMarkers.value = [];
          }

          // 尝试清除地图上的所有覆盖物
          try {
            mapInstance.value.clearMap();
          } catch (e) {
            console.warn("清除所有覆盖物失败，可能不支持此方法");
          }

          console.log("地图对象清除完成");
        } catch (error) {
          console.error("清除地图对象时出错:", error);
        }
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

    // 初始化地图
    function initMap() {
      console.log("初始化路线地图...");

      // 检查容器元素
      const container = document.getElementById("route-map-container");
      console.log("地图容器是否存在:", !!container);

      if (!container) {
        console.error("地图容器不存在");
        mapLoadError.value = true;
        return;
      }

      // 确保容器尺寸正确
      console.log("容器尺寸:", container.clientWidth, container.clientHeight);

      // 如果尺寸异常，尝试强制设置尺寸
      if (container.clientHeight < 100) {
        console.warn("容器高度异常，尝试强制设置");
        container.style.height = "300px";
        // 触发回流
        container.offsetHeight;
      }

      if (window.AMap && container) {
        try {
          mapLoading.value = true;

          // 创建地图实例
          mapInstance.value = new window.AMap.Map("route-map-container", {
            zoom: 13, // 稍微调大默认缩放级别
            center: props.routeCoordinates
              ? [
                  props.routeCoordinates.startLng,
                  props.routeCoordinates.startLat,
                ]
              : [104.066801, 30.657034], // 默认成都
            resizeEnable: true,
            viewMode: "2D",
          });

          // 添加加载完成事件监听
          mapInstance.value.on("complete", () => {
            console.log("地图加载完成");
            mapLoading.value = false;

            // 为地图Canvas设置willReadFrequently属性
            setTimeout(() => {
              const mapContainer = document.getElementById(
                "route-map-container"
              );
              if (mapContainer) {
                const canvasElements = mapContainer.querySelectorAll("canvas");
                canvasElements.forEach((canvas) => {
                  canvas.setAttribute("willReadFrequently", "true");
                });
              }
            }, 100);

            // 如果有路线坐标，绘制路线
            if (props.routeCoordinates) {
              // 先确保清除之前可能存在的标记和路线
              clearMapObjects();
              console.log("地图加载完成后绘制路线:", props.routeCoordinates);
              setTimeout(() => {
                if (props.routeCoordinates) {
                  drawRouteOnMap(props.routeCoordinates);
                }
              }, 200); // 短暂延迟确保地图完全初始化
            }
          });

          // 添加比例尺控件
          mapInstance.value.addControl(
            new window.AMap.Scale({
              position: "LB", // 左下角
            })
          );

          // 添加缩放控件
          mapInstance.value.addControl(
            new window.AMap.ToolBar({
              position: "RB", // 右下角
            })
          );
        } catch (error) {
          console.error("地图初始化错误:", error);
          mapLoadError.value = true;
          Message.error(`地图初始化失败: ${error}`);
        }
      } else {
        console.error("无法初始化地图: AMap未加载或容器不存在");
        mapLoadError.value = true;
      }
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

    // 组件挂载时加载地图
    onMounted(async () => {
      console.log("路线地图组件已挂载");

      try {
        // 如果存在之前的地图实例，先销毁
        if (window.AMap && mapInstance.value) {
          console.log("发现旧地图实例，先销毁");
          clearMapObjects();
          mapInstance.value.destroy();
          mapInstance.value = null;
        }

        await loadAMapScript();

        // 确保DOM已渲染
        await nextTick();

        // 延长初始化时间，确保DOM已完全渲染和布局计算完成
        setTimeout(() => {
          initMap();
        }, 500);
      } catch (error) {
        console.error("地图加载失败:", error);
        mapLoadError.value = true;
      }
    });

    // 提供一个刷新坐标数据的方法，可从父组件调用
    function refreshCoordinates() {
      if (props.routeCoordinates && mapInstance.value) {
        console.log("刷新坐标数据");
        clearMapObjects();
        drawRouteOnMap(props.routeCoordinates);
      }
    }

    // 组件卸载时清除资源
    onUnmounted(() => {
      console.log("路线地图组件卸载");
      clearMapObjects();

      // 销毁地图实例
      if (mapInstance.value) {
        mapInstance.value.destroy();
        mapInstance.value = null;
      }
    });

    return {
      mapLoading,
      mapLoadError,
      reloadMap,
      // 额外返回所需方法
      drawRouteOnMap,
      clearMapObjects,
      refreshCoordinates,
    };
  },
};
</script>

<style scoped>
.route-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.amap-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
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

/* 路线信息覆盖层 */
.route-info-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-width: 200px;
}

.route-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.start-point,
.end-point {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.route-line-indicator {
  width: 2px;
  height: 20px;
  background-color: #86909c;
  margin-left: 8px;
}
</style> 