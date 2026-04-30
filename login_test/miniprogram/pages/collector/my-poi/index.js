// 我的采集列表页面
// 功能：展示用户已提交的POI列表，支持按状态筛选，查看详情
const { API } = require('../../../config/api');

// POI状态枚举
const POI_STATUS = {
  PENDING: 'pending',      // 待审核
  APPROVED: 'approved',     // 已通过
  REJECTED: 'rejected',     // 已拒绝
  DRAFT: 'draft'            // 草稿
};

// 状态映射
const STATUS_MAP = {
  pending: { label: '待审核', color: '#f59e0b', icon: '⏰', bgColor: '#fffbeb' },
  approved: { label: '已通过', color: '#10b981', icon: '✓', bgColor: '#ecfdf5' },
  rejected: { label: '已拒绝', color: '#ef4444', icon: '✗', bgColor: '#fef2f2' },
  draft: { label: '草稿', color: '#999999', icon: '📝', bgColor: '#f5f5f5' }
};

Page({
  data: {
    // POI列表
    poiList: [],

    // 筛选状态
    filterStatus: 'all',  // all, pending, approved, rejected, draft

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
      { value: 'pending', label: '待审核' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已拒绝' },
      { value: 'draft', label: '草稿' }
    ],

    // 统计信息
    stats: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    }
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
    this.loadMyPOI(true);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMyPOI(true);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMyPOI(false);
    }
  },

  // 加载我的POI列表
  loadMyPOI(refresh = false) {
    if (this.data.loading) {
      return;
    }

    const page = refresh ? 1 : this.data.page;
    const status = this.data.filterStatus;

    this.setData({ loading: true });

    wx.request({
      url: API.COLLECTOR.GET_MY_POI_LIST,
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
          const newList = refresh ? data : [...this.data.poiList, ...data];

          this.setData({
            poiList: newList,
            page: page + 1,
            hasMore: data.length >= this.data.pageSize,
            loading: false
          });

          // 更新统计信息
          if (res.data.stats) {
            this.setData({ stats: res.data.stats });
          }
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
        console.error('加载我的POI列表失败:', err);
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
      poiList: [],
      page: 1,
      hasMore: true
    });
    this.loadMyPOI(true);
  },

  // 查看POI详情
  onPOITap(e) {
    const poiId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poi/detail/index?id=${poiId}`
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
    return STATUS_MAP[status] || { label: '未知', color: '#999999', icon: '?', bgColor: '#f5f5f5' };
  },

  // 删除草稿
  onDeleteDraft(e) {
    const poiId = e.currentTarget.dataset.id;
    const that = this;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条草稿吗？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          that.deleteDraft(poiId);
        }
      }
    });
  },

  // 删除草稿请求
  deleteDraft(poiId) {
    wx.request({
      url: `${API.COLLECTOR.GET_POI_DETAIL}/${poiId}`,
      method: 'DELETE',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || '')
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });

          // 从列表中移除
          const newList = this.data.poiList.filter(item => item.id !== poiId);
          this.setData({ poiList: newList });
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  }
});
