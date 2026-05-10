// 采集表单页面
// 功能：采集者提交POI数据（通过任务流程）

const { API, TENCENT_MAP_KEY } = require('../../../config/api');
const { Request } = require('../../../config/request');
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.js');

var qqmapsdk = new QQMapWX({ key: TENCENT_MAP_KEY });

const CATEGORIES = [
  { id: 'catering', name: '餐饮', icon: '🍜' },
  { id: 'shopping', name: '购物', icon: '🛒' },
  { id: 'life_service', name: '生活服务', icon: '🏪' },
  { id: 'entertainment', name: '休闲娱乐', icon: '🎮' },
  { id: 'hotel', name: '酒店住宿', icon: '🏨' },
  { id: 'scenic', name: '旅游景点', icon: '🏞️' },
  { id: 'medical', name: '医疗健康', icon: '🏥' },
  { id: 'education', name: '教育培训', icon: '🎓' },
  { id: 'transport', name: '交通设施', icon: '🚇' },
  { id: 'other', name: '其他', icon: '📌' }
];

Page({
  data: {
    formData: {
      name: '',
      category: '',
      description: '',
      longitude: '',
      latitude: '',
      address: ''
    },
    categories: CATEGORIES,
    showCategoryPicker: false,
    selectedCategory: null,
    photoList: [],
    maxPhotoCount: 9,
    submitting: false,
    gettingLocation: false,
    errors: {},
    taskId: null,
    taskInfo: null
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId });
      this.loadTaskInfo(options.taskId);
      wx.setNavigationBarTitle({ title: '采集任务' });
    } else {
      wx.setNavigationBarTitle({ title: '新建采集' });
    }
  },

  async loadTaskInfo(taskId) {
    wx.showLoading({ title: '加载任务信息...' });

    try {
      const res = await Request.get(API.TASK.DETAIL(taskId), {}, true);

      if (res.data) {
        const task = res.data;
        this.setData({
          taskInfo: task,
          'formData.address': task.targetAddress || '',
          'formData.latitude': task.targetLatitude || '',
          'formData.longitude': task.targetLongitude || ''
        });
      }
    } catch (err) {
      console.error('加载任务信息失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value, 'errors.name': '' });
  },

  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value, 'errors.description': '' });
  },

  onAddressInput(e) {
    this.setData({ 'formData.address': e.detail.value, 'errors.address': '' });
  },

  showPicker() {
    this.setData({ showCategoryPicker: true });
  },

  hidePicker() {
    this.setData({ showCategoryPicker: false });
  },

  onSelectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id === categoryId);

    if (category) {
      this.setData({
        'formData.category': categoryId,
        selectedCategory: category,
        showCategoryPicker: false,
        'errors.category': ''
      });
    }
  },

  chooseImage() {
    const remainingCount = this.data.maxPhotoCount - this.data.photoList.length;

    if (remainingCount <= 0) {
      wx.showToast({ title: `最多上传${this.data.maxPhotoCount}张图片`, icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ photoList: [...this.data.photoList, ...res.tempFilePaths] });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.photoList[index],
      urls: this.data.photoList
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = this.data.photoList.filter((item, i) => i !== index);
    this.setData({ photoList: newList });
  },

  getLocation() {
    this.setData({ gettingLocation: true });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'formData.latitude': res.latitude,
          'formData.longitude': res.longitude,
          gettingLocation: false
        });
        
        // 调用逆地理编码API获取地址信息
        this.reverseGeocode(res.latitude, res.longitude);
        wx.showToast({ title: '定位成功', icon: 'success' });
      },
      fail: (err) => {
        this.setData({ gettingLocation: false });
        console.error('获取位置失败:', err);

        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置信息，请在设置中开启位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) wx.openSetting();
            }
          });
        } else {
          wx.showToast({ title: '获取位置失败', icon: 'none' });
        }
      }
    });
  },

  // 逆地理编码：根据经纬度获取详细地址
  reverseGeocode(latitude, longitude) {
    wx.showLoading({ title: '解析地址...' });
    
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: (res) => {
        wx.hideLoading();
        const result = res.result;
        // 拼接详细地址（省+市+区+街道+门牌号）
        const fullAddress = result.address || '';
        const formattedAddress = result.formatted_addresses?.recommend || fullAddress;
        
        this.setData({
          'formData.address': formattedAddress || fullAddress
        });
        
        if (formattedAddress || fullAddress) {
          wx.showToast({ title: '地址解析成功', icon: 'success' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('逆地理编码失败:', err);
        wx.showToast({ title: '地址解析失败，请手动输入', icon: 'none' });
      }
    });
  },

  validateForm() {
    const { name, category, longitude, latitude } = this.data.formData;
    const errors = {};

    if (!name || name.trim() === '') {
      errors.name = '请输入POI名称';
    }

    if (!category) {
      errors.category = '请选择POI分类';
    }

    if (!longitude || !latitude) {
      errors.location = '请获取GPS位置';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  submitForm() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善表单信息', icon: 'none' });
      return;
    }

    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    this.submitData().then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('提交失败:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    });
  },

  async submitData() {
    const formData = this.data.formData;
    const userId = wx.getStorageSync('userId');

    const submitData = {
      taskId: this.data.taskId,
      submitterId: userId,
      submissionType: 'CREATE',
      name: formData.name,
      category: formData.category,
      description: formData.description || '',
      longitude: parseFloat(formData.longitude),
      latitude: parseFloat(formData.latitude),
      address: formData.address || ''
    };

    return Request.post(API.SUBMISSION.CREATE, submitData, true);
  },

  preventBubble() {}
});