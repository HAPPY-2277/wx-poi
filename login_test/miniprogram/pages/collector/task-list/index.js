// 任务列表页面
// 功能：展示待采集的任务列表，支持按状态筛选，点击查看详情

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

// 任务状态映射（对应后端状态）
const STATUS_MAP = {
  PENDING_COLLECTION: { label: '待采集', color: '#f59e0b', icon: '⏰' },
  PENDING_REVIEW: { label: '审核中', color: '#3b82f6', icon: '🔄' },
  COMPLETED: { label: '已完成', color: '#10b981', icon: '✓' },
  REJECTED: { label: '已驳回', color: '#ef4444', icon: '❌' }
};

Page({
  data: {
    taskList: [],
    filterStatus: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'PENDING_COLLECTION', label: '待采集' },
      { value: 'PENDING_REVIEW', label: '审核中' },
      { value: 'COMPLETED', label: '已完成' }
    ]
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ filterStatus: options.status });
    }
  },

  onShow() {
    this.loadTasks(true);
  },

  onPullDownRefresh() {
    this.loadTasks(true);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTasks(false);
    }
  },

  async loadTasks(refresh = false) {
    if (this.data.loading) return;

    const page = refresh ? 1 : this.data.page;
    this.setData({ loading: true });

    const userId = wx.getStorageSync('userId');
    if (!userId) {
      this.setData({ loading: false });
      return;
    }

    try {
      const res = await Request.get(API.TASK.COLLECTOR_LIST(userId), {}, true);
      let taskList = res.data || [];

      if (this.data.filterStatus !== 'all') {
        taskList = taskList.filter(t => t.status === this.data.filterStatus);
      }

      this.setData({
        taskList: refresh ? taskList : [...this.data.taskList, ...taskList],
        page: page + 1,
        hasMore: taskList.length >= this.data.pageSize,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载任务列表失败:', err);
    }
  },

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

  onTaskTap(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/collector/collect/index?taskId=${taskId}`
    });
  },

  getStatusInfo(status) {
    return STATUS_MAP[status] || { label: '未知', color: '#999999', icon: '?' };
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});