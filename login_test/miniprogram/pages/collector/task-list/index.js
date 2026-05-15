// 任务列表页面
// 功能：展示待采集的任务列表，支持按状态筛选，提供导航和提交功能
// API端点：GET /api/task/collector/{collectorId}

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

// API响应处理常量
const TASK_STATUS = {
  PENDING_COLLECTION: { label: '待采集', color: '#f59e0b', icon: '⏰' },
  PENDING_REVIEW: { label: '审核中', color: '#3b82f6', icon: '🔄' },
  COMPLETED: { label: '已完成', color: '#10b981', icon: '✓' }
};

// 任务分类枚举（与API规范保持一致）
const CATEGORIES = [
  { id: 'RESIDENTIAL', name: '居住社区', icon: '🏠' },
  { id: 'COMMERCIAL', name: '商业街区', icon: '🏬' },
  { id: 'PUBLIC_SERVICE', name: '公共服务', icon: '🏢' },
  { id: 'TRANSPORTATION', name: '交通设施', icon: '🚇' },
  { id: 'RECREATION', name: '休闲娱乐', icon: '🎡' }
];

// POI分类映射（与CATEGORIES保持一致）
const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {});

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
    ],
    notLoggedIn: false,
    apiError: null
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

  /**
   * 加载任务列表
   * @param {boolean} refresh 是否刷新（重新加载）
   */
  async loadTasks(refresh = false) {
    if (this.data.loading) return;

    const page = refresh ? 1 : this.data.page;
    this.setData({ loading: true, apiError: null });

    const userId = this.getUserId();
    if (!userId) {
      console.log('userid:',userId);
      this.setData({ loading: false, notLoggedIn: true });
      return;
    }

    try {
      const apiUrl = API.TASK.COLLECTOR_LIST(userId);
      console.log('[TaskList] 请求API:', apiUrl);

      const res = await Request.get(apiUrl, {}, true);
      console.log('[TaskList] API响应:', res);

      let taskList = this.extractDataList(res);

      if (!Array.isArray(taskList)) {
        taskList = [];
      }

      // 应用状态筛选
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
      console.error('[TaskList] 加载失败:', err);
      this.setData({
        loading: false,
        apiError: err.message || '加载失败，请重试'
      });
      wx.showToast({
        title: err.message || '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 获取用户ID
   * @returns {string|null} 用户ID
   */
  getUserId() {
    return wx.getStorageSync('userId');
  },

  /**
   * 从API响应中提取数据列表
   * @param {Object} res API响应
   * @returns {Array} 数据列表
   */
  extractDataList(res) {
    if (!res) return [];
    
    if (Array.isArray(res)) {
      return res;
    }
    
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    
    return [];
  },

  /**
   * 筛选状态变更处理
   */
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

  /**
   * 获取状态信息
   * @param {string} status 状态值
   * @returns {Object} 状态信息
   */
  getStatusInfo(status) {
    return TASK_STATUS[status] || { label: '未知', color: '#999999', icon: '?' };
  },

  /**
   * 获取分类名称
   * @param {string} category 分类值
   * @returns {string} 分类名称
   */
  getCategoryName(category) {
    return CATEGORY_MAP[category] || category || '';
  },

  /**
   * 格式化时间
   * @param {string|number} timestamp 时间戳
   * @returns {string} 格式化后的时间
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  /**
   * 导航按钮点击处理
   */
  onNavigate(e) {
    const task = e.currentTarget.dataset.task;
    const latitude = parseFloat(task.targetLatitude);
    const longitude = parseFloat(task.targetLongitude);

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      wx.showToast({ title: '暂无位置信息', icon: 'none' });
      return;
    }

    const name = task.targetName || '目标位置';
    const address = task.targetAddress || '';

    wx.openLocation({
      latitude,
      longitude,
      name,
      address,
      scale: 18,
      success: () => console.log('导航成功'),
      fail: (err) => {
        console.error('导航失败:', err);
        wx.showToast({ title: '导航失败，请检查位置信息', icon: 'none' });
      }
    });
  },

  /**
   * 提交按钮点击处理
   */
  onSubmit(e) {
    const task = e.currentTarget.dataset.task;
    const taskId = e.currentTarget.dataset.taskid;

    if (task.status !== 'PENDING_COLLECTION') {
      const statusText = task.status === 'PENDING_REVIEW' ? '审核中' : '已完成';
      wx.showToast({ title: `任务${statusText}，无法提交`, icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/collector/collect/index?taskId=${taskId}`
    });
  },

  /**
   * 点击任务项查看详情
   */
  onTaskTap(e) {
    const taskId = e.currentTarget.dataset.id;
    if (taskId) {
      wx.navigateTo({
        url: `/pages/collector/collect/index?taskId=${taskId}`
      });
    }
  }
});