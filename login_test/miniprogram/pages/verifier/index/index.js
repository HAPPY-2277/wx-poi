// 核验者首页
// 功能：展示核验者角色信息、统计数据和功能入口

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

Page({
  data: {
    userInfo: {},
    displayNickname: '核验者',

    stats: {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    },

    functionList: [
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
    this.getUserInfo();
  },

  onShow() {
    this.fetchStats();
  },

  getUserInfo() {
    const nickname = wx.getStorageSync('userNickname') || '核验者';
    const avatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';

    this.setData({
      displayNickname: nickname,
      'userInfo.avatar': avatar
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
          approvedCount: 0,
          rejectedCount: 0
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

  navigateToFunction(e) {
    const { id, path } = e.currentTarget.dataset;
    if (id === 'map') {
      wx.switchTab({ url: path });
    } else {
      wx.navigateTo({ url: path });
    }
  },

  onPullDownRefresh() {
    this.fetchStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});