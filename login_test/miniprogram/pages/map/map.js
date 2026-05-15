// 地图服务页面
// 功能：展示地图、搜索周边地点、显示当前位置、任务标记管理、路径规划
// 重构要点：
// 1. 身份权限控制：采集者自动加载其任务点
// 2. 标记样式：按类别显示，完成状态统一绿色
// 3. 实时更新：定时刷新机制

var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
const { TENCENT_MAP_KEY, API } = require('../../config/api.js');
const { Request } = require('../../config/request');
const { ImageService } = require('../../config/imageService');

var qqmapsdk = new QQMapWX({
  key: TENCENT_MAP_KEY
});

// ==================== 标记配置 ====================
// POI分类图标映射 - 对应任务类别
const CATEGORY_MARKER_ICONS = {
  RESIDENTIAL: { icon: '🏠', label: '居住社区' },
  COMMERCIAL: { icon: '🏬', label: '商业街区' },
  PUBLIC_SERVICE: { icon: '🏢', label: '公共服务' },
  TRANSPORTATION: { icon: '🚇', label: '交通设施' },
  RECREATION: { icon: '🎡', label: '休闲娱乐' }
};

// 状态图标路径配置 - 不同状态使用不同图标
const MARKER_ICONS = {
  PENDING_COLLECTION: '/images/marker-orange.png',
  PENDING_REVIEW: '/images/marker-blue.png',
  HIGH_PRIORITY: '/images/marker-red.png',
  NORMAL_PRIORITY: '/images/marker-orange.png',
  LOW_PRIORITY: '/images/marker-gray.png',
  COMPLETED: '/images/marker-green.png',
  SEARCH_RESULT: '/images/marker-green.png',
  default: '/images/marker.png'
};

// 图标颜色配置 - 备用方案：当图标不存在时使用colorFill
const MARKER_COLORS = {
  PENDING_COLLECTION: '#FF9500',
  PENDING_REVIEW: '#007AFF',
  HIGH_PRIORITY: '#FF3B30',
  NORMAL_PRIORITY: '#FF9500',
  LOW_PRIORITY: '#8E8E93',
  COMPLETED: '#34C759',
  SEARCH_RESULT: '#34C759',
  default: '#8E8E93'
};

// 标记大小配置
const MARKER_SIZES = {
  HIGH_PRIORITY: 36,
  default: 32
};

// 优先级标签映射
const PRIORITY_LABELS = {
  high: '高优先级',
  medium: '普通优先级',
  low: '低优先级'
};

// 腾讯地图 polyline 解码函数
// polyline 是前向差分压缩数组：[lat1, lng1, dlat2, dlng2, dlat3, dlng3, ...]
// 前两个元素为绝对坐标，后续元素为差值
function decodePolyline(polyline) {
  const points = [];
  const kr = 1000000;
  const coords = [...polyline];
  
  for (let i = 2; i < coords.length; i++) {
    coords[i] = Number(coords[i - 2]) + Number(coords[i]) / kr;
  }
  
  for (let i = 0; i < coords.length; i += 2) {
    points.push({
      latitude: coords[i],
      longitude: coords[i + 1]
    });
  }
  
  return points;
}

// 防抖函数 - 避免频繁触发
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
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
    isSearching: false,
    isRefreshing: false,
    lastRefreshTime: null
  },

  // ==================== 生命周期 ====================
  onLoad() {
    this.initUserInfo();
    this.initLocation();
    this.initRefreshTimer();
  },

  onShow() {
    this.refreshUserInfo();
    this.onPageResume();
  },

  onUnload() {
    this.clearRefreshTimer();
  },

  // ==================== 初始化方法 ====================
  initUserInfo() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录',
      userRole: wx.getStorageSync('userRole') || ''
    });
  },

  refreshUserInfo() {
    const role = wx.getStorageSync('userRole') || '';
    const nickname = wx.getStorageSync('userNickname') || '未登录';
    const roleChanged = role !== this.data.userRole;
    
    this.setData({
      userNickname: nickname,
      userRole: role
    });

    // 角色切换时重新加载标记
    if (roleChanged && role) {
      this.refreshMarkers();
    }
  },

  initLocation() {
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

  // ==================== 实时更新机制 ====================
  refreshTimer: null,

  initRefreshTimer() {
    this.clearRefreshTimer();
    // 每30秒刷新一次标记数据
    this.refreshTimer = setInterval(() => {
      this.refreshMarkers();
    }, 30000);
  },

  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  // 页面恢复时刷新（从其他页面返回时）
  onPageResume() {
    this.refreshMarkersDebounced();
  },

  // 防抖刷新
  refreshMarkersDebounced: debounce(function() {
    this.refreshMarkers();
  }, 1000),

  // 主动刷新方法 - 供外部调用
  forceRefresh() {
    this.refreshMarkers();
  },

  // ==================== 核心数据加载 ====================
  async refreshMarkers() {
    const { userRole } = this.data;
    
    // 未登录不加载
    if (!userRole) {
      console.log('[Map] 未检测到用户角色，跳过标记加载');
      return;
    }

    this.setData({ isRefreshing: true });
    
    try {
      if (userRole === 'collector') {
        // 采集者：加载分配给自己的任务点
        await this.loadCollectorTasks();
      } else if (userRole === 'verifier') {
        // 核验者：加载待核验列表
        await this.loadVerifierSubmissions();
      } else {
        // 其他角色默认加载待核验列表
        await this.loadVerifierSubmissions();
      }
      
      this.setData({ 
        lastRefreshTime: new Date().toLocaleTimeString(),
        isRefreshing: false 
      });
      
      console.log('[Map] 标记刷新完成，时间:', this.data.lastRefreshTime);
    } catch (err) {
      console.error('[Map] 标记刷新失败:', err);
      this.setData({ isRefreshing: false });
    }
  },

  // 加载采集者任务列表
  async loadCollectorTasks() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      console.log('[Map] 未找到用户ID');
      return;
    }

    try {
      const res = await Request.get(API.TASK.COLLECTOR_LIST(userId), {}, true);
      const taskList = res.data || [];
      
      // 根据状态过滤并处理任务
      this.setData({ poiList: taskList });
      this.convertToMarkers(taskList);
      
      console.log(`[Map] 采集者任务加载完成，共 ${taskList.length} 个任务`);
    } catch (err) {
      console.error('[Map] 获取采集者任务列表失败:', err);
      wx.showToast({ title: '加载任务失败', icon: 'none' });
    }
  },

  // 加载核验者待核验列表
  async loadVerifierSubmissions() {
    try {
      const res = await Request.get(API.SUBMISSION.PENDING_REVIEW, {}, true);
      
      if (res.data && Array.isArray(res.data)) {
        this.setData({ poiList: res.data });
        this.convertToMarkers(res.data);
        console.log(`[Map] 待核验列表加载完成，共 ${res.data.length} 个POI`);
      }
    } catch (err) {
      console.error('[Map] 获取待核验列表失败:', err);
      wx.showToast({ title: '加载核验列表失败', icon: 'none' });
    }
  },

  // ==================== 标记转换 ====================
  convertToMarkers(poiList) {
    if (!poiList || poiList.length === 0) {
      this.setData({ markers: [] });
      return;
    }

    const markers = poiList.map((poi, index) => {
      const markerType = this.getMarkerType(poi);
      const iconPath = MARKER_ICONS[markerType] || MARKER_ICONS.default;
      const size = MARKER_SIZES[markerType] || MARKER_SIZES.default;
      const markerOptions = {
        id: poi.id || poi.taskId || index,
        title: poi.name || poi.targetName || '未知地点',
        latitude: poi.latitude || poi.targetLatitude || this.data.latitude,
        longitude: poi.longitude || poi.targetLongitude || this.data.longitude,
        width: size,
        height: size,
        callout: {
          content: this.formatCallout(poi),
          color: '#333333',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#ffffff',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center'
        }
      };
      
      markerOptions.iconPath = iconPath;
      
      return markerOptions;
    });

    this.setData({ markers });
    
    if (markers.length > 0) {
      this.adjustMapView(markers);
    }
  },

  // 获取标记类型
  getMarkerType(poi) {
    // 已完成状态 - 统一使用绿色
    if (poi.status === 'COMPLETED') {
      return 'COMPLETED';
    }
    
    // 高优先级判定
    if (poi.priority === 'high' || poi.priority === 'HIGH') {
      return 'HIGH_PRIORITY';
    }
    
    // 采集者角色
    if (this.data.userRole === 'collector') {
      if (poi.status === 'PENDING_COLLECTION') {
        return 'PENDING_COLLECTION';
      }
      if (poi.priority === 'low' || poi.priority === 'LOW') {
        return 'LOW_PRIORITY';
      }
      return 'NORMAL_PRIORITY';
    }
    
    // 核验者角色
    return 'PENDING_REVIEW';
  },

  // 格式化气泡信息 - 包含分类图标
  formatCallout(poi) {
    const name = poi.name || poi.targetName || '未知地点';
    const status = this.getStatusLabel(poi);
    return `${name}\n${status}`;
  },

  // 获取分类图标emoji
  getCategoryIcon(poi) {
    const category = poi.category || poi.targetCategory || poi.categoryName;
    const categoryInfo = CATEGORY_MARKER_ICONS[category];
    return categoryInfo ? categoryInfo.icon : '';
  },

  // 获取分类标签
  getCategoryLabel(poi) {
    const category = poi.category || poi.targetCategory || poi.categoryName;
    const categoryInfo = CATEGORY_MARKER_ICONS[category];
    if (categoryInfo) {
      return categoryInfo.icon + ' ' + categoryInfo.label;
    }
    return poi.categoryName || poi.category || '待处理';
  },

  // 获取状态标签 - 所有任务显示类别图标，已完成任务标记已完成
  getStatusLabel(poi) {
    const category = poi.category || poi.targetCategory || poi.categoryName;
    const categoryInfo = CATEGORY_MARKER_ICONS[category];
    
    // 获取基础标签
    let baseLabel = '';
    if (categoryInfo) {
      baseLabel = categoryInfo.icon + ' ' + categoryInfo.label;
    } else if (poi.categoryName) {
      baseLabel = poi.categoryName;
    } else if (poi.priority) {
      baseLabel = PRIORITY_LABELS[poi.priority] || '待处理';
    } else {
      baseLabel = '待处理';
    }
    
    // 已完成状态追加标记
    if (poi.status === 'COMPLETED') {
      return baseLabel + ' ✓ 已完成';
    }
    
    return baseLabel;
  },

  // 获取 POI 图片数量
  getImageCount(poi) {
    if (!poi) return 0;

    if (Array.isArray(poi.images)) {
      return poi.images.length;
    }

    if (Array.isArray(poi.photos)) {
      return poi.photos.length;
    }

    return 0;
  },

  // 获取第一张图片 URL
  getFirstImageUrl(poi) {
    if (!poi) return '';

    if (Array.isArray(poi.images) && poi.images.length > 0) {
      const firstImage = poi.images[0];
      return typeof firstImage === 'string'
        ? firstImage
        : (firstImage.imageUrl || firstImage.url || '');
    }

    if (Array.isArray(poi.photos) && poi.photos.length > 0) {
      return poi.photos[0];
    }

    return '';
  },

  // 是否有图片
  hasImages(poi) {
    return this.getImageCount(poi) > 0;
  },

  // ==================== 地图视图调整 ====================
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

  // ==================== 定位功能 ====================
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

  // ==================== 搜索功能 ====================
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
        console.error('[Map] 搜索建议失败:', err);
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
      iconPath: MARKER_ICONS.SEARCH_RESULT,
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
          iconPath: MARKER_ICONS.SEARCH_RESULT,
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

  // ==================== 标记交互 ====================
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

  // ==================== 路径规划 ====================
  calculateRoute() {
    const { selectedMarker, cachedLocation, latitude, longitude } = this.data;

    if (!selectedMarker) return;

    const userLat = cachedLocation?.latitude || latitude;
    const userLng = cachedLocation?.longitude || longitude;

    wx.showLoading({ title: '规划路线中...' });

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

          this.drawRouteOnMap(userLat, userLng, selectedMarker.latitude, selectedMarker.longitude, routePoints);
        } else {
          wx.showToast({ title: '未找到可行路线', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('[Map] 路径规划失败:', err);
        wx.showToast({ title: '路线规划失败', icon: 'none' });
      }
    });
  },

  drawRouteOnMap(startLat, startLng, endLat, endLng, routePoints) {
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

  // ==================== 详情跳转 ====================
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

  // ==================== 事件处理 ====================
  onRegionChange(e) {},

  onControltap(e) {
    if (e.controlId === 1) {
      this.getCurrentLocation();
    }
  }
});