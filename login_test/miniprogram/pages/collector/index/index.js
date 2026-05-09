// 采集者首页
// 功能：展示采集者角色头部、统计数据卡片、功能入口卡片

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: ''
    },
    notLoggedIn: false,
    stats: {
      totalPoi: 0,
      approvedPoi: 0,
      pendingPoi: 0,
      pendingTask: 0
    },
    functionList: [
      {
        id: 'new',
        title: '新建采集',
        icon: '/images/icons/add.png',
        desc: '开始采集新POI',
        path: '/pages/collector/collect/index'
      },
      {
        id: 'tasks',
        title: '任务列表',
        icon: '/images/icons/task.png',
        desc: '查看待采集任务',
        path: '/pages/collector/task-list/index',
        badge: 0
      },
      {
        id: 'my',
        title: '我的采集',
        icon: '/images/icons/list.png',
        desc: '查看已提交的POI',
        path: '/pages/collector/my-poi/index'
      },
      {
        id: 'map',
        title: '地图视图',
        icon: '/images/icons/map.png',
        desc: '查看采集点分布',
        path: '/pages/map/map'
      }
    ],
    loading: true
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (!this.data.notLoggedIn) {
      this.fetchMyPOIStats();
    }
  },

  checkLoginStatus() {
    const loginToken = wx.getStorageSync('loginToken');
    const userRole = wx.getStorageSync('userRole');
    const notLoggedIn = !loginToken || userRole !== 'collector';
    this.setData({ notLoggedIn });

    if (!notLoggedIn) {
      this.getUserInfo();
    }
  },

  getUserInfo() {
    const nickname = wx.getStorageSync('userNickname');
    const avatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';
    this.setData({
      'userInfo.nickname': nickname || '采集者',
      'userInfo.avatar': avatar
    });
  },

  async fetchMyPOIStats() {
    this.setData({ loading: true });
    const userId = wx.getStorageSync('userId');

    try {
      const res = await Request.get(API.POI.COLLECTOR_LIST(userId), {}, true);
      const poiList = res.data || [];

      const stats = {
        totalPoi: poiList.length,
        approvedPoi: poiList.filter(p => p.status === 'APPROVED' || p.isActive).length,
        pendingPoi: poiList.filter(p => p.status === 'PENDING_REVIEW').length,
        pendingTask: 0
      };

      this.setData({ stats, loading: false });
      this.updateTaskBadge();
    } catch (err) {
      this.setData({ loading: false });
      console.error('获取统计数据失败:', err);
    }
  },

  updateTaskBadge() {
    const functionList = this.data.functionList.map(item => {
      if (item.id === 'tasks') {
        item.badge = this.data.stats.pendingTask;
      }
      return item;
    });
    this.setData({ functionList });
  },

  onFunctionTap(e) {
    const { path, id } = e.currentTarget.dataset;
    if (id === 'map') {
      wx.switchTab({ url: path });
    } else {
      wx.navigateTo({ url: path });
    }
  },

  onPullDownRefresh() {
    if (this.data.notLoggedIn) {
      wx.stopPullDownRefresh();
      return;
    }
    this.fetchMyPOIStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});