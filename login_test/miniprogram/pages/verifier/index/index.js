// 核验者首页
// 功能：展示核验者角色头部、统计数据卡片、功能入口卡片

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');
const { getAvatarByUserInfo } = require('../../../utils/avatar');

Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: ''
    },
    notLoggedIn: false,
    stats: {
      pendingCount: 0,
      todayVerified: 0,
      approvalRate: 0
    },
    functionList: [
      {
        id: 'publish-task',
        title: '发布任务',
        icon: '/images/icons/task.png',
        desc: '发布POI采集任务',
        path: '/pages/verifier/publish-task/index'
      },
      {
        id: 'verify-list',
        title: '审核列表',
        icon: '/images/icons/list.png',
        desc: '查看待审核POI',
        path: '/pages/verifier/verify-list/index',
        badge: 0
      },
      {
        id: 'my-review',
        title: '我的审核',
        icon: '/images/icons/review.png',
        desc: '查看审核记录',
        path: '/pages/verifier/my-review/index'
      },
      {
        id: 'map',
        title: '地图视图',
        icon: '/images/icons/map.png',
        desc: '查看POI分布',
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
      this.fetchStats();
    }
  },

  checkLoginStatus() {
    const loginToken = wx.getStorageSync('loginToken');
    const userRole = wx.getStorageSync('userRole');
    const notLoggedIn = !loginToken || userRole !== 'verifier';
    this.setData({ notLoggedIn });

    if (!notLoggedIn) {
      this.getUserInfo();
    }
  },

  getUserInfo() {
    const nickname = wx.getStorageSync('userNickname');
    const userRole = wx.getStorageSync('userRole');
    this.setData({
      'userInfo.nickname': nickname || '核验者',
      'userInfo.avatar': getAvatarByUserInfo({ role: userRole })
    });
  },

  async fetchStats() {
    this.setData({ loading: true });

    try {
      const res = await Request.get(API.SUBMISSION.PENDING_REVIEW, {}, true);
      const pendingList = res.data || [];

      this.setData({
        stats: {
          pendingCount: pendingList.length,
          todayVerified: 0,
          approvalRate: 0
        },
        loading: false
      });

      this.updateBadge();
    } catch (err) {
      this.setData({ loading: false });
      console.error('获取统计数据失败:', err);
    }
  },

  updateBadge() {
    const functionList = this.data.functionList.map(item => {
      if (item.id === 'verify-list') {
        item.badge = this.data.stats.pendingCount;
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
    this.fetchStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
