// 采集表单页面
// 功能：新建POI采集，包括图片上传、GPS定位、分类选择等
const { API } = require('../../../config/api');

// POI 分类选项
const CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍜' },
  { id: 'shopping', name: '购物', icon: '🛒' },
  { id: 'life', name: '生活服务', icon: '🏪' },
  { id: 'entertainment', name: '休闲娱乐', icon: '🎮' },
  { id: 'hotel', name: '酒店住宿', icon: '🏨' },
  { id: 'tourism', name: '旅游景点', icon: '🏞️' },
  { id: 'medical', name: '医疗健康', icon: '🏥' },
  { id: 'education', name: '教育培训', icon: '🏫' },
  { id: 'transport', name: '交通设施', icon: '🚌' },
  { id: 'other', name: '其他', icon: '📍' }
];

Page({
  data: {
    // 表单数据
    formData: {
      name: '',           // POI名称
      category: '',       // 分类ID
      address: '',        // 地址
      description: '',    // 描述
      phone: '',          // 电话
      businessHours: '',  // 营业时间
      latitude: '',       // 纬度
      longitude: '',      // 经度
      photos: []          // 图片列表
    },

    // 分类选项
    categories: CATEGORIES,

    // 是否显示分类选择器
    showCategoryPicker: false,

    // 选中分类
    selectedCategory: null,

    // 图片列表
    photoList: [],

    // 最大图片数
    maxPhotoCount: 9,

    // 是否正在提交
    submitting: false,

    // 是否正在获取位置
    gettingLocation: false,

    // 表单验证错误
    errors: {}
  },

  // 页面加载
  onLoad(options) {
    // 如果是从任务跳转过来的，填充任务信息
    if (options.taskId) {
      this.loadTaskInfo(options.taskId);
    }
  },

  // 加载任务信息（如果是任务模式）
  loadTaskInfo(taskId) {
    wx.showLoading({ title: '加载任务信息...' });

    wx.request({
      url: `${API.COLLECTOR.GET_TASK_DETAIL}/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || '')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success && res.data.data) {
          const task = res.data.data;
          // 预填充地址和位置信息
          this.setData({
            'formData.address': task.address || '',
            'formData.latitude': task.latitude || '',
            'formData.longitude': task.longitude || ''
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '加载任务信息失败', icon: 'none' });
      }
    });
  },

  // 输入名称
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value,
      'errors.name': ''
    });
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value,
      'errors.description': ''
    });
  },

  // 输入地址
  onAddressInput(e) {
    this.setData({
      'formData.address': e.detail.value,
      'errors.address': ''
    });
  },

  // 输入电话
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value,
      'errors.phone': ''
    });
  },

  // 输入营业时间
  onBusinessHoursInput(e) {
    this.setData({
      'formData.businessHours': e.detail.value
    });
  },

  // 显示分类选择器
  showPicker() {
    this.setData({ showCategoryPicker: true });
  },

  // 隐藏分类选择器
  hidePicker() {
    this.setData({ showCategoryPicker: false });
  },

  // 选择分类
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

  // 选择图片
  chooseImage() {
    const currentCount = this.data.photoList.length;
    const remainingCount = this.data.maxPhotoCount - currentCount;

    if (remainingCount <= 0) {
      wx.showToast({
        title: `最多上传${this.data.maxPhotoCount}张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.setData({
          photoList: [...this.data.photoList, ...tempFilePaths]
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.photoList[index],
      urls: this.data.photoList
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = this.data.photoList.filter((item, i) => i !== index);
    this.setData({ photoList: newList });
  },

  // 获取GPS位置
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
        wx.showToast({
          title: '定位成功',
          icon: 'success'
        });

        // 可选：逆地理编码获取地址
        this.reverseGeocode(res.latitude, res.longitude);
      },
      fail: (err) => {
        this.setData({ gettingLocation: false });
        console.error('获取位置失败:', err);

        // 检查是否是权限问题
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置信息，请在设置中开启位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '获取位置失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 逆地理编码（可选功能）
  reverseGeocode(latitude, longitude) {
    // 这里可以调用腾讯地图或高德地图的逆地理编码接口
    // 将经纬度转换为详细地址
    // 示例：使用腾讯地图
    const that = this;
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: 'YOUR_TENCENT_MAP_KEY', // 需要替换为实际的key
        get_poi: 0
      },
      success: (res) => {
        if (res.data.status === 0 && res.data.result) {
          const address = res.data.result.address;
          that.setData({
            'formData.address': address
          });
        }
      }
    });
  },

  // 表单验证
  validateForm() {
    const { name, category, address, latitude, longitude } = this.data.formData;
    const errors = {};

    // 验证名称
    if (!name || name.trim() === '') {
      errors.name = '请输入POI名称';
    }

    // 验证分类
    if (!category) {
      errors.category = '请选择POI分类';
    }

    // 验证地址
    if (!address || address.trim() === '') {
      errors.address = '请输入详细地址';
    }

    // 验证位置
    if (!latitude || !longitude) {
      errors.location = '请获取GPS位置';
    }

    // 验证图片
    if (this.data.photoList.length === 0) {
      errors.photos = '请至少上传一张图片';
    }

    this.setData({ errors });

    // 返回验证结果
    return Object.keys(errors).length === 0;
  },

  // 提交表单
  submitForm() {
    // 验证表单
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      });
      return;
    }

    // 检查是否正在提交
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    // 上传图片
    this.uploadImages().then((photoUrls) => {
      // 提交表单数据
      return this.submitData(photoUrls);
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('提交失败:', err);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    });
  },

  // 上传图片到服务器
  uploadImages() {
    return new Promise((resolve, reject) => {
      const photoList = this.data.photoList;
      const photoUrls = [];

      if (photoList.length === 0) {
        resolve(photoUrls);
        return;
      }

      let uploadedCount = 0;

      photoList.forEach((tempPath, index) => {
        // 上传单张图片
        wx.uploadFile({
          url: API.COLLECTOR.CREATE_POI + '/upload', // 上传接口（需要后端提供）
          filePath: tempPath,
          name: 'photo',
          header: {
            'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || '')
          },
          success: (res) => {
            const data = JSON.parse(res.data);
            if (data.success) {
              photoUrls.push(data.data.url);
            }

            uploadedCount++;

            // 所有图片上传完成
            if (uploadedCount === photoList.length) {
              resolve(photoUrls);
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    });
  },

  // 提交数据到服务器
  submitData(photoUrls) {
    return new Promise((resolve, reject) => {
      const formData = this.data.formData;

      wx.request({
        url: API.COLLECTOR.CREATE_POI,
        method: 'POST',
        header: {
          'Authorization': 'Bearer ' + (wx.getStorageSync('loginToken') || ''),
          'Content-Type': 'application/json'
        },
        data: {
          name: formData.name,
          category: formData.category,
          address: formData.address,
          description: formData.description,
          phone: formData.phone,
          businessHours: formData.businessHours,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photos: photoUrls
        },
        success: (res) => {
          if (res.data.success) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 阻止事件冒泡
  preventBubble() {}
});
