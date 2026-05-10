// 核验详情页
// 功能：展示POI提交详情，核验者可审核通过或拒绝

const { API } = require('../../../config/api');
const { Request } = require('../../../config/request');

Page({
  data: {
    submissionDetail: {},
    currentImageIndex: 0,
    imageUrls: [],
    selectedAction: null,
    reviewComment: '',
    isSubmitting: false,
    submissionId: null,
    actionOptions: [
      { id: 'approved', label: '通过', icon: '✓', color: '#07c160' },
      { id: 'rejected', label: '不通过', icon: '✗', color: '#f56c6c' }
    ],
    showErrorDescription: false,
    errorDescription: ''
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ submissionId: id });
      this.fetchSubmissionDetail(id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
    }
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.submissionId && Object.keys(this.data.submissionDetail).length) {
      this.fetchSubmissionDetail(this.data.submissionId);
    }
  },

  async fetchSubmissionDetail(id) {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      const res = await Request.get(API.SUBMISSION.DETAIL(id), {}, true);
      if (res.data) {
        this.setData({
          submissionDetail: res.data,
          imageUrls: res.data.photos || []
        });
      }
    } catch (err) {
      console.error('获取详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  onImageSwiperChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  onImagePreview(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      current: this.data.imageUrls[index],
      urls: this.data.imageUrls
    });
  },

  onActionSelect(e) {
    const { action } = e.currentTarget.dataset;
    this.setData({
      selectedAction: action,
      showErrorDescription: action === 'rejected'
    });
  },

  onErrorDescriptionInput(e) {
    this.setData({ errorDescription: e.detail.value });
  },

  onReviewCommentInput(e) {
    this.setData({ reviewComment: e.detail.value });
  },

  submitVerification() {
    if (!this.data.selectedAction) {
      wx.showToast({ title: '请选择审核操作', icon: 'none' });
      return;
    }

    if (this.data.selectedAction === 'rejected' && !this.data.errorDescription.trim()) {
      wx.showToast({ title: '请填写驳回原因', icon: 'none' });
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

  async doSubmitVerification() {
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...' });

    const userId = wx.getStorageSync('userId');
    const { submissionId, selectedAction, errorDescription } = this.data;

    try {
      if (selectedAction === 'approved') {
        await Request.post(API.SUBMISSION.APPROVE(submissionId), {
          reviewerId: userId,
          reviewComment: '审核通过'
        }, true);
      } else {
        await Request.post(API.SUBMISSION.REJECT(submissionId), {
          reviewerId: userId,
          reviewComment: errorDescription || '审核驳回'
        }, true);
      }

      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
    } catch (err) {
      console.error('提交失败:', err);
      wx.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
    }
  },

  onViewMap() {
    const { latitude, longitude } = this.data.submissionDetail;
    if (latitude && longitude) {
      wx.openLocation({
        latitude,
        longitude,
        name: this.data.submissionDetail.name,
        address: this.data.submissionDetail.address,
        scale: 15
      });
    } else {
      wx.showToast({ title: '暂无位置信息', icon: 'none' });
    }
  }
});