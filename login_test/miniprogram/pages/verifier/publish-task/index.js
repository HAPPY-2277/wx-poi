// 发布任务页面
// 功能：核验者发布POI采集任务，支持选择目标分类和分配采集者

const { API, TENCENT_MAP_KEY } = require('../../../config/api');
const { Request } = require('../../../config/request');
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.js');

var qqmapsdk = new QQMapWX({ key: TENCENT_MAP_KEY });

// POI分类选项（5个新分类）
const CATEGORIES = [
  { id: 'RESIDENTIAL', name: '居住区', icon: '🏠' },
  { id: 'COMMERCIAL', name: '商业区', icon: '🏬' },
  { id: 'PUBLIC_SERVICE', name: '公共服务', icon: '🏢' },
  { id: 'TRANSPORTATION', name: '交通设施', icon: '🚇' },
  { id: 'RECREATION', name: '休闲娱乐', icon: '🎡' }
];

Page({
  data: {
    formData: {
      targetName: '',
      targetCategory: '',
      targetAddress: '',
      targetLongitude: '',
      targetLatitude: '',
      description: ''
    },
    categories: CATEGORIES,
    selectedCategory: null,
    showCategoryPicker: false,
    collectors: [],
    selectedCollectors: [],
    showCollectorPicker: false,
    collectorsLoading: false,
    errors: {},
    submitting: false,
    showAddressSuggestions: false,
    addressSuggestions: [],
    suggestionDebounceTimer: null
  },

  onLoad() {
    this.loadCollectors();
  },

  // 加载采集者列表
  async loadCollectors() {
    this.setData({ collectorsLoading: true });
    try {
      const res = await Request.get(API.USER.COLLECTOR_IDS, {}, true);
      const collectors = res.data || [];
      this.setData({ collectors, collectorsLoading: false });
    } catch (err) {
      console.error('获取采集者列表失败:', err);
      this.setData({ collectorsLoading: false });
      wx.showToast({ title: '获取采集者列表失败', icon: 'none' });
    }
  },

  // 目标名称输入
  onNameInput(e) {
    this.setData({
      'formData.targetName': e.detail.value,
      'errors.targetName': ''
    });
  },

  // 地址输入处理（带防抖）
  onAddressInput(e) {
    const keyword = e.detail.value;
    this.setData({
      'formData.targetAddress': keyword,
      'errors.targetAddress': ''
    });

    if (this.suggestionDebounceTimer) {
      clearTimeout(this.suggestionDebounceTimer);
    }

    if (keyword.length < 2) {
      this.setData({
        showAddressSuggestions: false,
        addressSuggestions: []
      });
      return;
    }

    this.suggestionDebounceTimer = setTimeout(() => {
      this.searchAddressSuggestions(keyword);
    }, 300);
  },

  onAddressFocus() {
    if (this.data.formData.targetAddress.length >= 2 && this.data.addressSuggestions.length > 0) {
      this.setData({ showAddressSuggestions: true });
    }
  },

  // 搜索地址建议
  searchAddressSuggestions(keyword) {
    wx.showLoading({ title: '搜索中...' });

    qqmapsdk.getSuggestion({
      keyword: keyword,
      success: (res) => {
        wx.hideLoading();
        const suggestions = (res.data || []).map(item => ({
          id: item.id,
          title: item.title,
          address: item.address || '',
          location: item.location
        }));
        this.setData({
          addressSuggestions: suggestions,
          showAddressSuggestions: suggestions.length > 0
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('地址搜索失败:', err);
      }
    });
  },

  // 选择地址建议
  onSelectAddress(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.location) {
      wx.showToast({ title: '无法获取位置', icon: 'none' });
      return;
    }

    const fullAddress = item.title + (item.address ? ' ' + item.address : '');

    this.setData({
      'formData.targetAddress': fullAddress,
      'formData.targetLatitude': item.location.lat,
      'formData.targetLongitude': item.location.lng,
      showAddressSuggestions: false,
      addressSuggestions: [],
      'errors.targetAddress': ''
    });

    wx.showToast({ title: '地址已选择', icon: 'success' });
  },

  // 清除地址
  clearAddress() {
    this.setData({
      'formData.targetAddress': '',
      'formData.targetLatitude': '',
      'formData.targetLongitude': '',
      showAddressSuggestions: false,
      addressSuggestions: []
    });
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value });
  },

  // 显示分类选择器
  showCategorySelector() {
    this.setData({ showCategoryPicker: true });
  },

  // 隐藏分类选择器
  hideCategorySelector() {
    this.setData({ showCategoryPicker: false });
  },

  // 选择分类
  onSelectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id === categoryId);

    if (category) {
      this.setData({
        'formData.targetCategory': categoryId,
        selectedCategory: category,
        showCategoryPicker: false,
        'errors.targetCategory': ''
      });
    }
  },

  // 显示采集者选择器
  showCollectorSelector() {
    this.setData({ showCollectorPicker: true });
  },

  // 隐藏采集者选择器
  hideCollectorSelector() {
    this.setData({ showCollectorPicker: false });
  },

  // 切换采集者选择状态
  onToggleCollector(e) {
    const collectorId = e.currentTarget.dataset.id;
    const selected = this.data.selectedCollectors;
    const index = selected.indexOf(collectorId);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(collectorId);
    }

    this.setData({ selectedCollectors: selected });
  },

  // 确认选择采集者
  confirmCollectorSelection() {
    this.setData({ showCollectorPicker: false });
  },

  // 移除已选采集者
  onRemoveCollector(e) {
    const collectorId = e.currentTarget.dataset.id;
    const selected = this.data.selectedCollectors;
    const index = selected.indexOf(collectorId);

    if (index > -1) {
      selected.splice(index, 1);
      this.setData({ selectedCollectors: selected });
    }
  },

  // 获取已选采集者信息
  getSelectedCollectorInfo() {
    return this.data.collectors.filter(c => this.data.selectedCollectors.includes(c.id));
  },

  // 表单验证
  validateForm() {
    const { targetName, targetCategory, targetAddress, targetLongitude, targetLatitude } = this.data.formData;
    const errors = {};

    if (!targetName || targetName.trim() === '') {
      errors.targetName = '请输入目标名称';
    }

    // targetCategory 必填校验
    if (!targetCategory || targetCategory.trim() === '') {
      errors.targetCategory = '请选择目标分类';
    }

    if (!targetAddress || targetAddress.trim() === '') {
      errors.targetAddress = '请输入或选择目标地址';
    }

    if (!targetLongitude || !targetLatitude) {
      errors.targetAddress = '请从建议列表中选择地址以获取位置信息';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 提交表单
  submitForm() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善任务信息', icon: 'none' });
      return;
    }

    if (this.data.submitting) return;

    const selectedCollectorInfo = this.getSelectedCollectorInfo();
    const collectorNames = selectedCollectorInfo.map(c => c.nickname).join('、');
    const selectedCategoryName = this.data.selectedCategory ? this.data.selectedCategory.name : '';

    wx.showModal({
      title: '确认发布',
      content: `确定要发布此采集任务吗？\n目标：${this.data.formData.targetName}\n分类：${selectedCategoryName}\n分配给：${collectorNames || '暂未指定'}`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmit();
        }
      }
    });
  },

  // 执行提交
  async doSubmit() {
    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

    const formData = this.data.formData;
    const userId = wx.getStorageSync('userId');

    const taskData = {
      publisherId: userId,
      taskType: 'CREATE_NEW',
      poiId: null,
      description: formData.description || '',
      targetName: formData.targetName,
      targetCategory: formData.targetCategory,
      targetLongitude: parseFloat(formData.targetLongitude),
      targetLatitude: parseFloat(formData.targetLatitude),
      targetAddress: formData.targetAddress,
      assigneeIds: this.data.selectedCollectors
    };

    try {
      await Request.post(API.TASK.CREATE, taskData, true);
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('发布任务失败:', err);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    }
  },

  preventBubble() {}
});