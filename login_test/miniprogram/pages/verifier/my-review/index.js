// 我的审核页
// 功能：展示核验者已完成的审核记录，包含统计数据和审核列表
// 采用 MVVM 架构，逻辑与视图分离

const { API } = require('../../../config/api');

Page({
  data: {
    // 统计数据
    statistics: {
      totalReviewed: 0,
      approvedCount: 0,
      rejectedCount: 0,
      uncertainCount: 0
    },

    // 预先计算的百分比（避免WXML中使用表达式）
    approvedRate: '0',
    rejectedRate: '0',
    uncertainRate: '0',

    // 审核记录列表
    reviewList: [],

    // 筛选条件
    filters: {
      result: 'all'
    },

    // 筛选选项
    filterOptions: [
      { id: 'all', name: '全部' },
      { id: 'approved', name: '已通过' },
      { id: 'rejected', name: '已拒绝' },
      { id: 'uncertain', name: '不确定' }
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
    this.fetchStatistics();
    this.fetchReviewList();
  },

  onShow() {
    this.fetchStatistics();
    this.fetchReviewList();
  },

  /**
   * 计算并更新审核通过率
   */
  updateRates() {
    const { totalReviewed, approvedCount, rejectedCount, uncertainCount } = this.data.statistics;

    if (totalReviewed > 0) {
      const approvedRate = ((approvedCount / totalReviewed) * 100).toFixed(1);
      const rejectedRate = ((rejectedCount / totalReviewed) * 100).toFixed(1);
      const uncertainRate = ((uncertainCount / totalReviewed) * 100).toFixed(1);

      this.setData({
        approvedRate: approvedRate,
        rejectedRate: rejectedRate,
        uncertainRate: uncertainRate
      });
    } else {
      this.setData({
        approvedRate: '0',
        rejectedRate: '0',
        uncertainRate: '0'
      });
    }
  },

  /**
   * 获取审核统计数据
   */
  fetchStatistics() {
    const loginToken = wx.getStorageSync('loginToken');

    if (!loginToken) {
      return;
    }

    wx.request({
      url: API.VERIFIER.MY_STATS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        const { success, data, message } = res.data;

        if (success && data) {
          this.setData({
            statistics: {
              totalReviewed: data.totalReviewed || 0,
              approvedCount: data.approvedCount || 0,
              rejectedCount: data.rejectedCount || 0,
              uncertainCount: data.uncertainCount || 0
            }
          }, () => {
            this.updateRates();
          });
        } else {
          this.setMockStatistics();
        }
      },
      fail: () => {
        this.setMockStatistics();
      }
    });
  },

  /**
   * 设置模拟统计数据
   */
  setMockStatistics() {
    this.setData({
      statistics: {
        totalReviewed: 156,
        approvedCount: 120,
        rejectedCount: 25,
        uncertainCount: 11
      }
    }, () => {
      this.updateRates();
    });
  },

  /**
   * 获取审核记录列表
   */
  fetchReviewList() {
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
      url: API.VERIFIER.MY_REVIEWS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      },
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        result: this.data.filters.result
      },
      success: (res) => {
        const { success, data, message } = res.data;

        if (success && data) {
          this.setData({
            reviewList: data.list || [],
            hasMore: data.hasMore || false
          });
        } else {
          this.setMockReviewList();
        }
      },
      fail: () => {
        this.setMockReviewList();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 设置模拟审核记录列表
   */
  setMockReviewList() {
    const mockList = [
      {
        id: 1,
        poiName: '西湖风景区',
        categoryName: '景点',
        result: 'approved',
        resultText: '已通过',
        resultColor: '#67c23a',
        reviewTime: '2026-04-30 10:30',
        errorDescription: ''
      },
      {
        id: 2,
        poiName: '外婆家餐厅',
        categoryName: '餐饮',
        result: 'rejected',
        resultText: '已拒绝',
        resultColor: '#f56c6c',
        reviewTime: '2026-04-30 09:45',
        errorDescription: '地址信息不准确'
      },
      {
        id: 3,
        poiName: '杭州希尔顿酒店',
        categoryName: '酒店',
        result: 'uncertain',
        resultText: '不确定',
        resultColor: '#e6a23c',
        reviewTime: '2026-04-29 16:30',
        errorDescription: '需要实地考察'
      }
    ];

    let filteredList = mockList;
    if (this.data.filters.result !== 'all') {
      filteredList = mockList.filter(item => item.result === this.data.filters.result);
    }

    this.setData({
      reviewList: filteredList,
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

    this.fetchReviewList();
  },

  /**
   * 筛选结果变化处理
   */
  onFilterChange(e) {
    const { result } = e.currentTarget.dataset;
    this.setData({
      'filters.result': result,
      pageNum: 1
    });
    this.fetchReviewList();
  },

  /**
   * 点击审核记录查看详情
   */
  onReviewClick(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/verifier/verify-detail/index?id=${id}&mode=review`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ pageNum: 1 });
    this.fetchStatistics();
    this.fetchReviewList();

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