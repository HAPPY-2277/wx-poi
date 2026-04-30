// 采集者首页
// 功能：展示采集者角色头部、统计数据卡片、功能入口卡片
const { API } = require('../../../config/api');

// 页面初始化数据
Page({
  data: {
    // 用户信息
    userInfo: {
      nickname: '',
      avatar: ''
    },

    // 统计数据
    stats: {
      newTasks: 0,       // 新任务数
      pendingTasks: 0,   // 待处理任务数
      myCollections: 0  // 我的采集数
    },

    // 功能入口列表
    functionList: [
      {
        id: 'new',
        title: '新建采集',
        icon: '/images/icons/add.png',
        desc: '添加新的POI信息',
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
    const nickname = wx.getStorageSync('userNickname');
    const avatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';

    this.setData({
      'userInfo.nickname': nickname || '采集者',
      'userInfo.avatar': avatar
    });
  },

  // 获取统计数据
  fetchStats() {
    this.setData({ loading: true });

    wx.request({
      url: API.COLLECTOR.GET_STATS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || '')
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            stats: res.data.data || {
              newTasks: 0,
              pendingTasks: 0,
              myCollections: 0
            },
            loading: false
          });

          // 更新任务列表角标
          this.updateTaskBadge();
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
            newTasks: 0,
            pendingTasks: 0,
            myCollections: 0
          }
        });
      }
    });
  },

  // 更新任务角标
  updateTaskBadge() {
    const functionList = this.data.functionList.map(item => {
      if (item.id === 'tasks') {
        item.badge = this.data.stats.newTasks + this.data.stats.pendingTasks;
      }
      return item;
    });

    this.setData({ functionList });
  },

  // 点击功能入口
  onFunctionTap(e) {
    const { path } = e.currentTarget.dataset;
    const { id } = e.currentTarget.dataset;

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
