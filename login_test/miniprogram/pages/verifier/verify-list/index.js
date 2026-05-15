// 核验列表页
// 功能：展示待核验的POI提交列表，支持分类筛选和排序

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');
const { ImageService } = require('../../../config/imageService');
const { SERVER } = require('../../../config/config');

const IMAGE_BASE_URL = SERVER.BASE_URL;

// 任务分类枚举（与API规范保持一致）
const CATEGORIES = [
  { id: 'RESIDENTIAL', name: '居住区', icon: '🏠' },
  { id: 'COMMERCIAL', name: '商业区', icon: '🏬' },
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
    poiList: [],
    filters: {
      category: 'all',
      sortBy: 'newest'
    },
    categoryOptions: [
      { id: 'all', name: '全部' },
      ...CATEGORIES.map(c => ({ id: c.id, name: c.name }))
    ],
    sortOptions: [
      { id: 'newest', name: '最新' },
      { id: 'priority', name: '优先级' },
      { id: 'category', name: '分类' }
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

      // 预处理图片 URL
      list = list.map(item => ({
        ...item,
        _firstImageUrl: this.getFirstImageUrl(item)
      }));

      // 应用分类筛选
      if (this.data.filters.category !== 'all') {
        list = list.filter(item => item.category === this.data.filters.category);
      }

      // 应用排序
      list = this.sortList(list, this.data.filters.sortBy);

      // 如果是刷新，先清空列表；如果是加载更多，需要去重
      const newList = refresh ? list : this.mergeList(this.data.poiList, list);

      this.setData({
        poiList: newList,
        pageNum: page + 1,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
      console.error('获取POI列表失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  // 合并列表（去重）
  mergeList(existingList, newList) {
    const existingIds = new Set(existingList.map(item => item.id));
    const uniqueNewItems = newList.filter(item => !existingIds.has(item.id));
    return [...existingList, ...uniqueNewItems];
  },

  // 排序列表
  sortList(list, sortBy) {
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'priority':
        return list.sort((a, b) => (a.priority || 999) - (b.priority || 999));
      case 'category':
        return list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      default:
        return list;
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

  onSortChange(e) {
    const sortBy = e.currentTarget.dataset.sortby;
    this.setData({
      'filters.sortBy': sortBy,
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

  getFullImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return IMAGE_BASE_URL + url;
  },

  getFirstImageUrl(item) {
    if (!item) return '';

    if (Array.isArray(item.images) && item.images.length > 0) {
      const firstImage = item.images[0];
      const url = typeof firstImage === 'string' ? firstImage : (firstImage.imageUrl || firstImage.url || '');
      return this.getFullImageUrl(url);
    }

    if (Array.isArray(item.photos) && item.photos.length > 0) {
      return this.getFullImageUrl(item.photos[0]);
    }

    return '';
  },

  hasImages(item) {
    if (!item) return false;

    if (Array.isArray(item.images) && item.images.length > 0) {
      return true;
    }

    if (Array.isArray(item.photos) && item.photos.length > 0) {
      return true;
    }

    return false;
  },

  getImageCount(item) {
    if (!item) return 0;

    if (Array.isArray(item.images)) {
      return item.images.length;
    }

    if (Array.isArray(item.photos)) {
      return item.photos.length;
    }

    return 0;
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