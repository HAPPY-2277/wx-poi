// 我的采集列表页面
// 功能：展示用户已提交的POI列表，支持按状态筛选

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

const STATUS_MAP = {
  PENDING_REVIEW: { label: '待审核', color: '#f59e0b', icon: '⏰' },
  APPROVED: { label: '已通过', color: '#10b981', icon: '✓' },
  REJECTED: { label: '已驳回', color: '#ef4444', icon: '✗' }
};

Page({
  data: {
    poiList: [],
    filterStatus: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'PENDING_REVIEW', label: '待审核' },
      { value: 'APPROVED', label: '已通过' },
      { value: 'REJECTED', label: '已驳回' }
    ],
    stats: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    }
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ filterStatus: options.status });
    }
  },

  onShow() {
    this.loadMyPOI(true);
  },

  onPullDownRefresh() {
    this.loadMyPOI(true);
    setTimeout(() => { wx.stopPullDownRefresh(); }, 1000);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMyPOI(false);
    }
  },

  async loadMyPOI(refresh = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    const userId = wx.getStorageSync('userId');
    if (!userId) {
      this.setData({ loading: false });
      return;
    }

    try {
      const res = await Request.get(API.POI.COLLECTOR_LIST(userId), {}, true);
      let poiList = res.data || [];

      if (this.data.filterStatus !== 'all') {
        poiList = poiList.filter(p => p.status === this.data.filterStatus);
      }

      const stats = {
        total: poiList.length,
        approved: poiList.filter(p => p.status === 'APPROVED').length,
        pending: poiList.filter(p => p.status === 'PENDING_REVIEW').length,
        rejected: poiList.filter(p => p.status === 'REJECTED').length
      };

      this.setData({
        poiList,
        stats,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载我的POI列表失败:', err);
    }
  },

  onFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      filterStatus: status,
      poiList: [],
      page: 1,
      hasMore: true
    });
    this.loadMyPOI(true);
  },

  onPOITap(e) {
    const poiId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poi/detail/index?id=${poiId}`
    });
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getStatusInfo(status) {
    return STATUS_MAP[status] || { label: '未知', color: '#999999', icon: '?' };
  }
});