// 核验列表页
// 功能：展示待核验的POI提交列表

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

const CATEGORY_MAP = {
  restaurant: '餐饮',
  shop: '购物',
  hotel: '酒店',
  scenic: '景点',
  bank: '银行'
};

Page({
  data: {
    poiList: [],
    filters: {
      category: 'all'
    },
    categoryOptions: [
      { id: 'all', name: '全部' },
      { id: 'restaurant', name: '餐饮' },
      { id: 'shop', name: '购物' },
      { id: 'hotel', name: '酒店' },
      { id: 'scenic', name: '景点' }
    ],
    isLoading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10
  },

  onLoad() {
    this.fetchPOIList();
  },

  onShow() {
    this.fetchPOIList();
  },

  async fetchPOIList(refresh = false) {
    if (this.data.isLoading) return;

    const page = refresh ? 1 : this.data.pageNum;
    this.setData({ isLoading: true });

    try {
      const res = await Request.get(API.SUBMISSION.PENDING_REVIEW, {}, true);
      let list = res.data || [];

      if (this.data.filters.category !== 'all') {
        list = list.filter(item => item.category === this.data.filters.category);
      }

      this.setData({
        poiList: refresh ? list : [...this.data.poiList, ...list],
        pageNum: page + 1,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
      console.error('获取POI列表失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      'filters.category': category,
      pageNum: 1,
      poiList: []
    });
    this.fetchPOIList(true);
  },

  onPOIClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/verifier/verify-detail/index?id=${id}`
    });
  },

  onPullDownRefresh() {
    this.setData({ pageNum: 1 });
    this.fetchPOIList(true);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    if (!this.data.isLoading) {
      this.fetchPOIList(false);
    }
  },

  getCategoryName(category) {
    return CATEGORY_MAP[category] || category;
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