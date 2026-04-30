// 核验列表页
// 功能：展示待核验的POI列表，支持分类筛选、日期排序
// 采用 MVVM 架构，逻辑与视图分离

const { API } = require('../../../config/api');

Page({
  data: {
    // POI 列表数据
    poiList: [],

    // 筛选条件
    filters: {
      category: 'all',
      sortBy: 'date-desc'
    },

    // 分类选项
    categoryOptions: [
      { id: 'all', name: '全部' },
      { id: 'scenic', name: '景点' },
      { id: 'restaurant', name: '餐饮' },
      { id: 'hotel', name: '酒店' },
      { id: 'shop', name: '购物' }
    ],

    // 排序选项
    sortOptions: [
      { id: 'date-desc', name: '最新提交' },
      { id: 'date-asc', name: '最早提交' },
      { id: 'priority', name: '优先级' }
    ],

    // 加载状态
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,

    // 分页
    pageNum: 1,
    pageSize: 10
  },

  onLoad() {
    this.fetchPOIList();
  },

  onShow() {
    this.fetchPOIList();
  },

  /**
   * 获取POI列表数据
   */
  fetchPOIList() {
    const loginToken = wx.getStorageSync('loginToken');

    if (!loginToken) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true });

    wx.request({
      url: API.VERIFIER.PENDING_LIST,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      },
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        category: this.data.filters.category,
        sortBy: this.data.filters.sortBy
      },
      success: (res) => {
        const { success, data, message } = res.data;

        if (success && data) {
          this.setData({
            poiList: data.list || [],
            hasMore: data.hasMore || false
          });
        } else {
          this.setMockPOIList();
        }
      },
      fail: () => {
        this.setMockPOIList();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 设置模拟POI列表数据（接口未实现时使用）
   */
  setMockPOIList() {
    const mockList = [
      {
        id: 1,
        name: '西湖风景区',
        category: 'scenic',
        categoryName: '景点',
        address: '杭州市西湖区西湖街道',
        submitTime: '2026-04-30 09:30',
        priority: 1,
        photos: ['/images/ai_example1.png']
      },
      {
        id: 2,
        name: '外婆家餐厅',
        category: 'restaurant',
        categoryName: '餐饮',
        address: '杭州市西湖区文三路123号',
        submitTime: '2026-04-30 08:45',
        priority: 2,
        photos: ['/images/ai_example2.png']
      },
      {
        id: 3,
        name: '杭州希尔顿酒店',
        category: 'hotel',
        categoryName: '酒店',
        address: '杭州市下城区武林广场',
        submitTime: '2026-04-29 16:20',
        priority: 3,
        photos: ['/images/avatar.png']
      }
    ];

    this.setData({
      poiList: mockList,
      hasMore: false
    });
  },

  /**
   * 加载更多数据
   */
  loadMore() {
    if (this.data.isLoadingMore || !this.data.hasMore) {
      return;
    }

    this.setData({
      isLoadingMore: true,
      pageNum: this.data.pageNum + 1
    });

    this.fetchPOIList();
  },

  /**
   * 分类筛选变化处理
   */
  onCategoryChange(e) {
    const { category } = e.currentTarget.dataset;
    this.setData({
      'filters.category': category,
      pageNum: 1
    });
    this.fetchPOIList();
  },

  /**
   * 排序方式变化处理
   */
  onSortChange(e) {
    const { sortby } = e.currentTarget.dataset;
    this.setData({
      'filters.sortBy': sortby,
      pageNum: 1
    });
    this.fetchPOIList();
  },

  /**
   * 点击POI项跳转到详情页
   */
  onPOIClick(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/verifier/verify-detail/index?id=${id}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ pageNum: 1 });
    this.fetchPOIList();

    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 滚动到底部加载更多
   */
  onReachBottom() {
    this.loadMore();
  }
});