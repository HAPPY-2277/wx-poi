// 我的审核页
// 功能：展示核验者已完成的审核记录

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

const RESULT_MAP = {
  APPROVED: { label: '已通过', color: '#10b981' },
  REJECTED: { label: '已驳回', color: '#ef4444' }
};

Page({
  data: {
    statistics: {
      totalReviewed: 0,
      approvedCount: 0,
      rejectedCount: 0
    },
    reviewList: [],
    filters: {
      result: 'all'
    },
    filterOptions: [
      { id: 'all', label: '全部' },
      { id: 'APPROVED', label: '已通过' },
      { id: 'REJECTED', label: '已驳回' }
    ],
    isLoading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10
  },

  onLoad() {
    this.fetchMySubmissions();
  },

  onShow() {
    this.fetchMySubmissions();
  },

  async fetchMySubmissions() {
    this.setData({ isLoading: true });

    const userId = wx.getStorageSync('userId');
    if (!userId) {
      this.setData({ isLoading: false });
      return;
    }

    try {
      const res = await Request.get(API.SUBMISSION.SUBMITTER_LIST(userId), {}, true);
      let list = res.data || [];

      if (this.data.filters.result !== 'all') {
        list = list.filter(item => item.status === this.data.filters.result);
      }

      const approvedCount = list.filter(item => item.status === 'APPROVED').length;
      const rejectedCount = list.filter(item => item.status === 'REJECTED').length;

      this.setData({
        reviewList: list,
        statistics: {
          totalReviewed: list.length,
          approvedCount,
          rejectedCount
        },
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
      console.error('获取审核记录失败:', err);
    }
  },

  onFilterChange(e) {
    const result = e.currentTarget.dataset.result;
    this.setData({
      'filters.result': result,
      pageNum: 1
    });
    this.fetchMySubmissions();
  },

  onReviewClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/verifier/verify-detail/index?id=${id}`
    });
  },

  onPullDownRefresh() {
    this.fetchMySubmissions();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    if (!this.data.isLoading) {
      this.setData({ pageNum: this.data.pageNum + 1 });
      this.fetchMySubmissions();
    }
  },

  getResultInfo(status) {
    return RESULT_MAP[status] || { label: '未知', color: '#999999' };
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}/${day} ${hour}:${String(minute).padStart(2, '0')}`;
  }
});