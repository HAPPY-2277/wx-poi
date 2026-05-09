// 地图服务页面
// 功能：展示地图、搜索周边地点、显示当前位置、显示待核验POI

var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
const { TENCENT_MAP_KEY, API } = require('../../config/api.js');
const { Request } = require('../../config/request');

var qqmapsdk = new QQMapWX({
  key: TENCENT_MAP_KEY
});

// POI类别对应的图标配置（使用网络图片URL）
const CATEGORY_ICONS = {
  restaurant: {
    // 餐饮类 - 橙色标记
    iconPath: 'https://api.map.baidu.com/img/markers.png',
    iconOffset: { x: 0, y: 0 },  // 可用于裁剪图标
    width: 32,
    height: 32
  },
  shop: {
    // 购物类 - 蓝色标记
    iconPath: 'https://api.map.baidu.com/img/markers.png',
    iconOffset: { x: 0, y: 0 },
    width: 32,
    height: 32
  },
  hotel: {
    // 酒店类 - 紫色标记
    iconPath: 'https://api.map.baidu.com/img/markers.png',
    iconOffset: { x: 0, y: 0 },
    width: 32,
    height: 32
  },
  scenic: {
    // 景点类 - 绿色标记
    iconPath: 'https://api.map.baidu.com/img/markers.png',
    iconOffset: { x: 0, y: 0 },
    width: 32,
    height: 32
  },
  bank: {
    // 银行类 - 深蓝色标记
    iconPath: 'https://api.map.baidu.com/img/markers.png',
    iconOffset: { x: 0, y: 0 },
    width: 32,
    height: 32
  },
  default: {
    // 默认图标
    iconPath: '/images/marker.png',
    width: 32,
    height: 32
  }
};

Page({
  data: {
    latitude: 30.574,  // 武汉市区默认中心点
    longitude: 114.292,
    scale: 13,
    markers: [],
    keyword: '',
    userNickname: '',
    isLocating: false,  // 防止重复定位
    cachedLocation: null,  // 缓存定位结果
    poiList: []  // 待核验POI列表
  },

  onLoad() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录'
    });
    // 优先使用缓存位置
    this.useCachedLocation();
    // 获取待核验POI列表
    this.fetchPendingPOIList();
  },

  onShow() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录'
    });
  },

  // 使用缓存的位置信息，避免每次都重新定位
  useCachedLocation() {
    const cached = wx.getStorageSync('lastLocation');
    if (cached) {
      this.setData({
        latitude: cached.latitude,
        longitude: cached.longitude,
        cachedLocation: cached
      });
    }
    // 异步更新位置，不阻塞UI
    this.getCurrentLocation();
  },

  // 获取待核验POI列表并在地图上显示
  async fetchPendingPOIList() {
    try {
      const res = await Request.get(API.SUBMISSION.PENDING_REVIEW, {}, true);
      
      if (res.data) {
        this.setData({ poiList: res.data });
        this.convertPOIToMarkers(res.data);
      }
    } catch (err) {
      console.error('获取POI列表失败:', err);
    }
  },

  // 将POI列表转换为地图标记
  convertPOIToMarkers(poiList) {
    const markers = poiList.map((poi, index) => {
      const iconConfig = CATEGORY_ICONS[poi.category] || CATEGORY_ICONS.default;
      
      return {
        id: poi.id,
        title: poi.name,
        latitude: poi.latitude || 30.574,
        longitude: poi.longitude || 114.292,
        iconPath: iconConfig.iconPath,
        width: iconConfig.width,
        height: iconConfig.height,
        callout: {
          content: poi.name + '\n' + (poi.categoryName || poi.category || ''),
          color: '#333333',
          fontSize: 14,
          borderRadius: 10,
          bgColor: '#ffffff',
          padding: 10,
          display: 'ALWAYS',
          textAlign: 'center'
        }
      };
    });

    this.setData({ markers });
    
    // 如果有POI数据，调整地图视野显示所有标记
    if (markers.length > 0) {
      this.adjustMapView(markers);
    }
  },

  // 根据类别获取标记颜色
  getMarkerColor(category) {
    const colors = {
      restaurant: '#FF6B35',  // 橙色 - 餐饮
      shop: '#409EFF',         // 蓝色 - 购物
      hotel: '#9B59B6',        // 紫色 - 酒店
      scenic: '#27AE60',       // 绿色 - 景点
      bank: '#2C3E50',         // 深蓝色 - 银行
      default: '#95A5A6'       // 灰色 - 默认
    };
    return colors[category] || colors.default;
  },

  // 调整地图视野以显示所有标记
  adjustMapView(markers) {
    if (markers.length === 0) return;
    
    // 如果只有一个标记，直接移动到该位置
    if (markers.length === 1) {
      this.setData({
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
        scale: 16
      });
      return;
    }

    // 计算所有标记的经纬度范围
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

    // 计算中心点和缩放级别
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // 根据经纬度差异计算缩放级别
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
    // 防止重复定位
    if (this.data.isLocating) {
      return;
    }
    
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
        // 缓存位置信息，减少下次启动时的定位请求
        wx.setStorageSync('lastLocation', {
          latitude: res.latitude,
          longitude: res.longitude,
          timestamp: Date.now()
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isLocating: false });
        // 只有在首次加载且没有缓存时才提示
        if (!this.data.cachedLocation) {
          wx.showToast({
            title: '定位失败，使用默认位置',
            icon: 'none'
          });
        }
      }
    });
  },

  onSearch(e) {
    var keyword = e.detail.value.keyword;
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '搜索中...' });

    qqmapsdk.search({
      keyword: keyword,
      location: this.data.latitude + ',' + this.data.longitude,
      success: (res) => {
        wx.hideLoading();
        
        // 限制markers数量，最多显示20个，避免过度渲染
        const MAX_MARKERS = 20;
        const limitedData = res.data.slice(0, MAX_MARKERS);
        
        // 使用id确保markers稳定更新
        var mks = limitedData.map((item, index) => ({
          id: item.id || index,
          title: item.title,
          latitude: item.location.lat,
          longitude: item.location.lng,
          iconPath: '/images/marker.png',
          width: 30,
          height: 30
        }));
        
        this.setData({
          markers: mks
        });
        
        // 如果结果被截断，提示用户
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
        console.log(res);
      }
    });
  },

  onMarkerTap(e) {
    var markerId = e.markerId;
    var poiList = this.data.poiList;
    
    // 查找对应的POI
    const poi = poiList.find(item => item.id == markerId);
    
    if (poi) {
      wx.showModal({
        title: poi.name,
        content: poi.address + '\n\n是否查看详情？',
        success: (res) => {
          if (res.confirm) {
            // 跳转到详情页
            wx.navigateTo({
              url: '/pages/verifier/verify-detail/index?id=' + poi.id
            });
          }
        }
      });
    }
  },

  onRegionChange(e) {
    // 可以在地图区域变化时做一些优化，比如延迟搜索
  },

  onControltap(e) {
    if (e.controlId === 1) {
      this.getCurrentLocation();
    }
  }
});