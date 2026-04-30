// 核验者首页
// 功能：展示核验者角色信息、统计数据和功能入口
const { API } = require('../../../config/api');

Page({
  data: {
    // 用户信息
    userInfo: {},
    displayNickname: '核验者',

    // 统计数据
    stats: {
      pendingCount: 0,
      todayVerified: 0,
      approvalRate: 0
    },

    // 功能入口列表
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

    // 加载状态
    loading: true
  },

  // 页面加载时触发
  onLoad() {
    // 从缓存获取用户信息
    this.getUserInfo();
  },

  // 页面显示时触发
  onShow() {
    // 每次显示页面时刷新统计数据
    this.fetchStats();
  },

  // 获取缓存中的用户信息
  getUserInfo() {
    const nickname = wx.getStorageSync('userNickname') || '核验者';
    const avatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';

    this.setData({
      displayNickname: nickname,
      'userInfo.avatar': avatar
    });
  },

  // 获取统计数据
  fetchStats() {
    this.setData({ loading: true });

    wx.request({
      url: API.VERIFIER.GET_STATS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('loginToken') || ''
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            stats: res.data.data || {
              pendingCount: 0,
              todayVerified: 0,
              approvalRate: 0
            },
            loading: false
          });

          // 更新列表角标
          this.updateBadge();
        } else {
          this.setData({ loading: false });
          console.error('获取统计数据失败:', res.data.message);
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.error('网络请求失败:', err);
        // 使用默认数据
        this.setData({
          stats: {
            pendingCount: 0,
            todayVerified: 0,
            approvalRate: 0
          }
        });
      }
    });
  },

  // 更新角标
  updateBadge() {
    const functionList = this.data.functionList.map(item => {
      if (item.id === 'verify-list') {
        item.badge = this.data.stats.pendingCount;
      }
      return item;
    });

    this.setData({ functionList });
  },

  // 点击功能入口
  onFunctionTap(e) {
    const { path } = e.currentTarget.dataset;

    // 检查权限（如果是地图视图，直接跳转）
    if (id === 'map') {
      wx.navigateTo({ url: path });
      return;
    }

    // 其他功能直接跳转
    wx.navigateTo({ url: path });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});