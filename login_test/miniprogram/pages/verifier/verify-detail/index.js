// 核验详情页
// 功能：展示POI详细信息，核验者可以审核通过、拒绝或标记为不确定
// 采用 MVVM 架构，逻辑与视图分离

const { API } = require('../../../config/api');

Page({
  data: {
    // POI 详情数据
    poiDetail: {},

    // 图片轮播相关
    currentImageIndex: 0,
    imageUrls: [],

    // 审核操作
    selectedAction: null,
    errorDescription: '',

    // 审核操作选项
    actionOptions: [
      { id: 'approved', label: '通过', icon: '✓', color: '#67c23a' },
      { id: 'rejected', label: '拒绝', icon: '✗', color: '#f56c6c' },
      { id: 'uncertain', label: '不确定', icon: '?', color: '#e6a23c' }
    ],

    // 提交状态
    isSubmitting: false,

    // 是否显示拒绝原因输入框
    showErrorDescription: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.fetchPOIDetail(id);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  /**
   * 获取POI详情
   */
  fetchPOIDetail(id) {
    const loginToken = wx.getStorageSync('loginToken');

    if (!loginToken) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '加载中...'
    });

    wx.request({
      url: API.VERIFIER.GET_POI_DETAIL,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      }
    });
  },

  /**
   * 处理POI详情数据
   */
  processPOIDetail(data) {
    const imageUrls = data.photos || ['/images/default-goods-image.png'];

    this.setData({
      poiDetail: data,
      imageUrls: imageUrls
    });
  },

  /**
   * 设置模拟POI详情数据（接口未实现时使用）
   */
  setMockPOIDetail(id) {
    const mockDetail = {
      id: id,
      name: '西湖风景区',
      category: 'scenic',
      categoryName: '景点',
      address: '杭州市西湖区西湖街道',
      description: '西湖是中国大陆主要的观赏性淡水湖泊之一，也是《世界遗产名录》中少数几个，是中国唯一一个湖泊类文化遗产。',
      submitTime: '2026-04-30 09:30:00',
      submitter: '张三',
      photos: [
        '/images/ai_example1.png',
        '/images/ai_example2.png',
        '/images/avatar.png'
      ],
      location: {
        latitude: 30.246,
        longitude: 120.148
      }
    };

    this.processPOIDetail(mockDetail);
  },

  /**
   * 图片轮播切换事件
   */
  onImageSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  /**
   * 图片点击预览
   */
  onImagePreview(e) {
    const { index } = e.currentTarget.dataset;

    wx.previewImage({
      current: this.data.imageUrls[index],
      urls: this.data.imageUrls
    });
  },

  /**
   * 选择审核操作
   */
  onActionSelect(e) {
    const { action } = e.currentTarget.dataset;

    this.setData({
      selectedAction: action,
      showErrorDescription: action === 'rejected',
      errorDescription: ''
    });
  },

  /**
   * 拒绝原因输入
   */
  onErrorDescriptionInput(e) {
    this.setData({
      errorDescription: e.detail.value
    });
  },

  /**
   * 提交审核结果
   */
  submitVerification() {
    if (!this.data.selectedAction) {
      wx.showToast({
        title: '请选择审核操作',
        icon: 'none'
      });
      return;
    }

    if (this.data.selectedAction === 'rejected' && !this.data.errorDescription.trim()) {
      wx.showToast({
        title: '请填写拒绝原因',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认提交',
      content: '确定要提交审核结果吗？',
      success: (res) => {
        if (res.confirm) {
          this.doSubmitVerification();
        }
      }
    });
  },

  /**
   * 执行提交审核结果
   */
  doSubmitVerification() {
    const loginToken = wx.getStorageSync('loginToken');

    if (!loginToken) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSubmitting: true });

    wx.showLoading({
      title: '提交中...'
    });

    const requestData = {
      poiId: this.data.poiDetail.id,
      result: this.data.selectedAction,
      errorDescription: this.data.errorDescription.trim() || ''
    };

    wx.request({
      url: API.VERIFIER.VERIFY,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        const { success, message } = res.data;

        if (success) {
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
      }
    });
  },

  /**
   * 查看地图位置
   */
  onViewMap() {
    const { latitude, longitude } = this.data.poiDetail.location;
    if (latitude && longitude) {
      wx.openLocation({
        latitude: latitude,
        longitude: longitude,
        name: this.data.poiDetail.name,
        address: this.data.poiDetail.address,
        scale: 15
      });
    } else {
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      });
    }
  }
});