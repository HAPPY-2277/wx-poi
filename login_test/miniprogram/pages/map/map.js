// 地图服务页面
// 功能：展示地图、搜索周边地点、显示当前位置

var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');

var qqmapsdk = new QQMapWX({
  key: 'UWVBZ-RNWKQ-FVZ54-BUNSC-AGBIZ-WVB3Y'
});

Page({
  data: {
    latitude: 39.980014,
    longitude: 116.313972,
    scale: 16,
    markers: [],
    keyword: '',
    userNickname: ''
  },

  onLoad() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录'
    });
    this.getCurrentLocation();
  },

  onShow() {
    this.setData({
      userNickname: wx.getStorageSync('userNickname') || '未登录'
    });
  },

  getCurrentLocation() {
    wx.showLoading({ title: '定位中...' });
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.hideLoading();
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '定位失败，使用默认位置',
          icon: 'none'
        });
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
        var mks = [];
        for (var i = 0; i < res.data.length; i++) {
          mks.push({
            id: i,
            title: res.data[i].title,
            latitude: res.data[i].location.lat,
            longitude: res.data[i].location.lng,
            iconPath: '/images/marker.png',
            width: 30,
            height: 30
          });
        }
        this.setData({
          markers: mks
        });
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
    var markers = this.data.markers;
    if (markers[markerId]) {
      wx.showModal({
        title: markers[markerId].title,
        content: '是否查看详情？',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({ title: '查看详情功能开发中', icon: 'none' });
          }
        }
      });
    }
  },

  onRegionChange(e) {
    console.log('地图区域变化', e.type);
  },

  onControltap(e) {
    if (e.controlId === 1) {
      this.getCurrentLocation();
    }
  }
});