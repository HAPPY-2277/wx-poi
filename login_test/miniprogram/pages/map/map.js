// 地图服务页面
// 功能：展示地图、搜索周边地点、显示当前位置、显示任务标记点、路径规划

var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
const { TENCENT_MAP_KEY, API } = require('../../config/api.js');
const { Request } = require('../../config/request');

var qqmapsdk = new QQMapWX({
  key: TENCENT_MAP_KEY
});

// 标记点配置 - 根据任务类型区分颜色
const MARKER_CONFIG = {
  PENDING_COLLECTION: { color: '#FF9500', size: 32 },
  PENDING_REVIEW: { color: '#007AFF', size: 32 },
  HIGH_PRIORITY: { color: '#FF3B30', size: 36 },
  NORMAL_PRIORITY: { color: '#FF9500', size: 32 },
  LOW_PRIORITY: { color: '#8E8E93', size: 32 },
  COMPLETED: { color: '#34C759', size: 32 },
  SEARCH_RESULT: { color: '#07c160', size: 32 },
  default: { color: '#8E8E93', size: 32 }
};

// 腾讯地图 polyline 解码函数
// polyline 是前向差分压缩数组：[lat1, lng1, dlat2, dlng2, dlat3, dlng3, ...]
// 前两个元素为绝对坐标，后续元素为差值
function decodePolyline(polyline) {
  const points = [];
  const kr = 1000000;
  const coords = [...polyline];
  
  // 前向差分解码：coors[i] = coors[i-2] + coors[i]/1e6
  for (let i = 2; i < coords.length; i++) {
    coords[i] = Number(coords[i - 2]) + Number(coords[i]) / kr;
  }
  
  // 提取坐标点
  for (let i = 0; i < coords.length; i += 2) {
    points.push({
      latitude: coords[i],
      longitude: coords[i + 1]
    });
  }
  
  return points;
}

Page({
  data: {
    latitude: 30.574,
    longitude: 114.292,
    scale: 13,
    markers: [],
    keyword: '',
    userNickname: '',
    isLocating: false,
    cachedLocation: null,
    poiList: [],
    userRole: '',
    suggestions: [],
    showSuggestions: false,
    selectedMarker: null,
    routeInfo: null,
    searchDebounceTimer: null,
    isSearching: false
  },

  onLoad() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录',
      userRole: wx.getStorageSync('userRole') || ''
    });
    this.useCachedLocation();
    this.loadMarkersByRole();
  },

  onShow() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录',
      userRole: wx.getStorageSync('userRole') || ''
    });
  },

  useCachedLocation() {
    const cached = wx.getStorageSync('lastLocation');
    if (cached) {
      this.setData({
        latitude: cached.latitude,
        longitude: cached.longitude,
        cachedLocation: cached
      });
    }
    this.getCurrentLocation();
  },

  loadMarkersByRole() {
    const role = this.data.userRole;
    if (role === 'collector') {
      this.loadCollectorTasks();
    } else if (role === 'verifier') {
      this.loadVerifierSubmissions();
    } else {
      this.loadVerifierSubmissions();
    }
  },

  async loadCollectorTasks() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    try {
      const res = await Request.get(API.TASK.COLLECTOR_LIST(userId), {}, true);
      const taskList = res.data || [];
      const pendingTasks = taskList.filter(t => t.status === 'PENDING_COLLECTION');
      this.setData({ poiList: pendingTasks });
      this.convertToMarkers(pendingTasks, 'PENDING_COLLECTION');
    } catch (err) {
      console.error('获取采集者任务列表失败:', err);
    }
  },

  async loadVerifierSubmissions() {
    try {
      const res = await Request.get(API.SUBMISSION.PENDING_REVIEW, {}, true);
      if (res.data) {
        this.setData({ poiList: res.data });
        this.convertToMarkers(res.data, 'PENDING_REVIEW');
      }
    } catch (err) {
      console.error('获取待核验列表失败:', err);
    }
  },

  convertToMarkers(poiList, type) {
    if (!poiList || poiList.length === 0) {
      this.setData({ markers: [] });
      return;
    }

    const markers = poiList.map((poi, index) => {
      const markerType = this.getMarkerType(poi);
      const config = MARKER_CONFIG[markerType] || MARKER_CONFIG.default;

      return {
        id: poi.id || index,
        title: poi.name || poi.targetName || '未知地点',
        latitude: poi.latitude || poi.targetLatitude || 30.574,
        longitude: poi.longitude || poi.targetLongitude || 114.292,
        iconPath: '/images/marker.png',
        width: config.size,
        height: config.size,
        callout: {
          content: (poi.name || poi.targetName) + '\n' + this.getCategoryLabel(poi),
          color: '#333333',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#ffffff',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center'
        }
      };
    });

    this.setData({ markers });
    if (markers.length > 0) {
      this.adjustMapView(markers);
    }
  },

  getMarkerType(poi) {
    if (poi.priority === 'high' || poi.priority === 'HIGH') {
      return 'HIGH_PRIORITY';
    }
    if (poi.status === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (this.data.userRole === 'collector') {
      return 'PENDING_COLLECTION';
    }
    return 'PENDING_REVIEW';
  },

  getCategoryLabel(poi) {
    if (poi.categoryName) return poi.categoryName;
    if (poi.category) return poi.category;
    if (poi.priority) {
      const priorityMap = { high: '高优先级', medium: '普通优先级', low: '低优先级' };
      return priorityMap[poi.priority] || '待处理';
    }
    return '待处理';
  },

  adjustMapView(markers) {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      this.setData({
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
        scale: 16
      });
      return;
    }

    let minLat = markers[0].latitude;
    let maxLat = markers[0].latitude;
    let minLng = markers[0].longitude;
    let maxLng = markers[0].longitude;

    markers.forEach(marker => {
      if (marker.latitude < minLat) minLat = marker.latitude;
      if (marker.latitude > maxLat) maxLat = marker.latitude;
      if (marker.longitude < minLng) minLng = marker.longitude;
      if (marker.longitude > maxLng) maxLng = marker.longitude;
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let scale = 13;
    if (maxDiff < 0.01) scale = 16;
    else if (maxDiff < 0.05) scale = 14;
    else if (maxDiff < 0.1) scale = 13;
    else if (maxDiff < 0.5) scale = 11;
    else if (maxDiff < 1) scale = 9;

    this.setData({
      latitude: centerLat,
      longitude: centerLng,
      scale: scale
    });
  },

  getCurrentLocation() {
    if (this.data.isLocating) return;

    this.setData({ isLocating: true });
    wx.showLoading({ title: '定位中...' });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.hideLoading();
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          isLocating: false,
          cachedLocation: res
        });
        wx.setStorageSync('lastLocation', {
          latitude: res.latitude,
          longitude: res.longitude,
          timestamp: Date.now()
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isLocating: false });
        if (!this.data.cachedLocation) {
          wx.showToast({
            title: '定位失败，使用默认位置',
            icon: 'none'
          });
        }
      }
    });
  },

  onKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (keyword.length < 2) {
      this.setData({ showSuggestions: false, suggestions: [] });
      return;
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchSuggestions(keyword);
    }, 300);
  },

  searchSuggestions(keyword) {
    if (this.data.isSearching) return;

    this.setData({ isSearching: true });
    const { latitude, longitude } = this.data;

    qqmapsdk.getSuggestion({
      keyword: keyword,
      location: `${latitude},${longitude}`,
      success: (res) => {
        const suggestions = (res.data || []).map(item => ({
          id: item.id,
          title: item.title,
          address: item.address || '',
          location: item.location
        }));
        this.setData({
          suggestions: suggestions,
          showSuggestions: suggestions.length > 0,
          isSearching: false
        });
      },
      fail: (err) => {
        this.setData({ isSearching: false });
        console.error('搜索建议失败:', err);
      }
    });
  },

  onSelectSuggestion(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.location) {
      wx.showToast({ title: '无法获取位置', icon: 'none' });
      return;
    }

    this.setData({
      showSuggestions: false,
      suggestions: [],
      keyword: item.title
    });

    const newMarker = {
      id: 'search_' + Date.now(),
      title: item.title,
      latitude: item.location.lat,
      longitude: item.location.lng,
      iconPath: '/images/marker.png',
      width: 32,
      height: 32,
      callout: {
        content: item.title + '\n' + item.address,
        color: '#333333',
        fontSize: 12,
        borderRadius: 8,
        bgColor: '#ffffff',
        padding: 8,
        display: 'ALWAYS',
        textAlign: 'center'
      }
    };

    this.setData({
      latitude: item.location.lat,
      longitude: item.location.lng,
      scale: 16,
      markers: [...this.data.markers, newMarker],
      selectedMarker: newMarker,
      routeInfo: null
    });
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value || this.data.keyword;
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    this.setData({ showSuggestions: false });
    this.searchLocation(keyword);
  },

  searchLocation(keyword) {
    wx.showLoading({ title: '搜索中...' });

    qqmapsdk.search({
      keyword: keyword,
      location: this.data.latitude + ',' + this.data.longitude,
      success: (res) => {
        wx.hideLoading();
        const MAX_MARKERS = 20;
        const limitedData = res.data.slice(0, MAX_MARKERS);

        const mks = limitedData.map((item, index) => ({
          id: item.id || ('search_' + index),
          title: item.title,
          latitude: item.location.lat,
          longitude: item.location.lng,
          iconPath: '/images/marker.png',
          width: 28,
          height: 28,
          callout: {
            content: item.title,
            color: '#333333',
            fontSize: 11,
            borderRadius: 6,
            bgColor: '#ffffff',
            padding: 6,
            display: 'ALWAYS'
          }
        }));

        this.setData({ markers: mks });

        if (res.data.length > MAX_MARKERS) {
          wx.showToast({
            title: `已显示前${MAX_MARKERS}个结果`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (res) => {
        wx.hideLoading();
        wx.showToast({ title: '搜索失败', icon: 'none' });
      }
    });
  },

  onMarkerTap(e) {
    const markerId = e.markerId;
    const markers = this.data.markers;
    const marker = markers.find(m => m.id === markerId);

    if (marker) {
      this.setData({ selectedMarker: marker, routeInfo: null });
    }
  },

  closeMarkerPopup() {
    this.setData({ selectedMarker: null });
  },

  calculateRoute() {
    const { selectedMarker, cachedLocation, latitude, longitude } = this.data;

    if (!selectedMarker) return;

    const userLat = cachedLocation?.latitude || latitude;
    const userLng = cachedLocation?.longitude || longitude;

    wx.showLoading({ title: '规划路线中...' });

    // 调用腾讯地图WebService API计算步行路线
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/walking/',
      data: {
        from: `${userLat},${userLng}`,
        to: `${selectedMarker.latitude},${selectedMarker.longitude}`,
        key: TENCENT_MAP_KEY
      },
      success: (res) => {
        wx.hideLoading();

        if (res.data.status === 0 && res.data.result && res.data.result.routes && res.data.result.routes.length > 0) {
          const route = res.data.result.routes[0];
          const routePoints = decodePolyline(route.polyline);
          
          const distance = route.distance;
          const distanceText = distance >= 1000
            ? (distance / 1000).toFixed(1) + '公里'
            : distance + '米';
          
          // 步行速度约5km/h = 83.33米/分钟
          const durationMinutes = Math.ceil(distance / 83.33);
          const durationText = durationMinutes + '分钟';

          this.setData({
            routeInfo: {
              polyline: route.polyline,
              routePoints: routePoints,
              distance: distanceText,
              duration: durationText,
              destination: {
                latitude: selectedMarker.latitude,
                longitude: selectedMarker.longitude
              },
              name: selectedMarker.title
            }
          });

          // 调整地图视野并绘制路线
          this.drawRouteOnMap(userLat, userLng, selectedMarker.latitude, selectedMarker.longitude, routePoints);
        } else {
          wx.showToast({ title: '未找到可行路线', icon: 'none' });
          console.log('路线规划响应:', res.data);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('路径规划失败:', err);
        wx.showToast({ title: '路线规划失败', icon: 'none' });
      }
    });
  },

  drawRouteOnMap(startLat, startLng, endLat, endLng, routePoints) {
    // 计算中心点和缩放级别
    const centerLat = (startLat + endLat) / 2;
    const centerLng = (startLng + endLng) / 2;
    const latDiff = Math.abs(endLat - startLat);
    const lngDiff = Math.abs(endLng - startLng);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let scale = 15;
    if (maxDiff < 0.002) scale = 18;
    else if (maxDiff < 0.005) scale = 16;
    else if (maxDiff < 0.01) scale = 14;
    else if (maxDiff < 0.02) scale = 13;
    else if (maxDiff < 0.05) scale = 12;
    else if (maxDiff < 0.1) scale = 11;
    else if (maxDiff < 0.5) scale = 9;
    else scale = 7;

    this.setData({
      latitude: centerLat,
      longitude: centerLng,
      scale: scale,
      polyline: [{
        points: routePoints,
        color: '#07c160',
        width: 6,
        dottedLine: false
      }]
    });
  },

  startNavigation() {
    const { routeInfo } = this.data;

    if (routeInfo && routeInfo.destination) {
      wx.openLocation({
        latitude: routeInfo.destination.latitude,
        longitude: routeInfo.destination.longitude,
        name: routeInfo.name,
        scale: 18
      });
    } else {
      wx.showToast({ title: '请先规划路线', icon: 'none' });
    }
  },

  closeRoutePanel() {
    this.setData({ routeInfo: null });
  },

  goToDetail() {
    const { selectedMarker } = this.data;
    if (!selectedMarker) return;

    const markerId = selectedMarker.id;
    if (String(markerId).startsWith('search_')) {
      wx.showToast({ title: '搜索结果无法查看详情', icon: 'none' });
      return;
    }

    const userRole = this.data.userRole;
    let url = '';

    if (userRole === 'collector') {
      url = `/pages/collector/collect/index?taskId=${markerId}`;
    } else {
      url = `/pages/verifier/verify-detail/index?id=${markerId}`;
    }

    wx.navigateTo({ url });
  },

  onRegionChange(e) {},

  onControltap(e) {
    if (e.controlId === 1) {
      this.getCurrentLocation();
    }
  }
});
