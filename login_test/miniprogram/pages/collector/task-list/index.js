// 任务列表页面
// 功能：展示待采集的任务列表，支持按状态筛选，点击查看详情
const { API } = require('../../../config/api');

// 任务状态枚举
const TASK_STATUS = {
  PENDING: 'pending',      // 待采集
  IN_PROGRESS: 'in_progress',  // 采集中
  COMPLETED: 'completed',   // 已完成
  EXPIRED: 'expired'        // 已过期
};

// 任务状态映射
const STATUS_MAP = {
  pending: { label: '待采集', color: '#f59e0b', icon: '⏰' },
  in_progress: { label: '采集中', color: '#3b82f6', icon: '🔄' },
  completed: { label: '已完成', color: '#10b981', icon: '✓' },
  expired: { label: '已过期', color: '#999999', icon: '❌' }
};

Page({
  data: {
    // 任务列表
    taskList: [],

    // 筛选状态
    filterStatus: 'all',  // all, pending, in_progress, completed

    // 加载状态
    loading: false,

    // 是否有更多数据
    hasMore: true,

    // 当前页码
    page: 1,

    // 每页数量
    pageSize: 10,

    // 状态选项
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待采集' },
      { value: 'in_progress', label: '采集中' },
      { value: 'completed', label: '已完成' }
    ]
  },

  // 页面加载
  onLoad(options) {
    // 如果传入了状态筛选
    if (options.status) {
      this.setData({ filterStatus: options.status });
    }
  },

  // 页面显示
  onShow() {
    this.loadTasks(true);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTasks(true);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTasks(false);
    }
  },

  // 加载任务列表
  loadTasks(refresh = false) {
    if (this.data.loading) {
      return;
    }

    const page = refresh ? 1 : this.data.page;
    const status = this.data.filterStatus;

    this.setData({ loading: true });

    wx.request({
      url: API.COLLECTOR.GET_TASKS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || '')
      },
      data: {
        page: page,
        pageSize: this.data.pageSize,
        status: status === 'all' ? '' : status
      },
      success: (res) => {
        if (res.data.success) {
          const data = res.data.data || [];
          let newList = refresh ? data : [...this.data.taskList, ...data];

          this.setData({
            taskList: newList,
            page: page + 1,
            hasMore: data.length >= this.data.pageSize,
            loading: false
          });
        } else {
          this.setData({ loading: false });
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.error('加载任务列表失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 切换筛选状态
  onFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      filterStatus: status,
      taskList: [],
      page: 1,
      hasMore: true
    });
    this.loadTasks(true);
  },

  // 查看任务详情
  onTaskTap(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/collector/collect/index?taskId=${taskId}`
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取状态信息
  getStatusInfo(status) {
    return STATUS_MAP[status] || { label: '未知', color: '#999999', icon: '?' };
  }
});
