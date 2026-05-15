// 采集表单页面
// 功能：采集者提交POI数据（通过任务流程）

const { API, TENCENT_MAP_KEY } = require('../../../config/api');
const { Request } = require('../../../config/request');
const { ImageService } = require('../../../config/imageService');
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.js');

const MSG_BASE_URL = require('../../../config/config.js').MSG_SERVER.BASE_URL;
const OCR_TIMEOUT = 15000;

var qqmapsdk = new QQMapWX({ key: TENCENT_MAP_KEY });

const CATEGORIES = [
  { id: 'RESIDENTIAL', name: '居住社区', icon: '🏠' },
  { id: 'COMMERCIAL', name: '商业街区', icon: '🏬' },
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
    taskInfo: null,
    recognizingOCR: false
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
        console.log('[OCR] 选择图片成功:', res.tempFilePaths);
        const newPhotos = res.tempFilePaths;
        this.setData({ photoList: [...this.data.photoList, ...newPhotos] });
        if (newPhotos.length > 0) {
          this.recognizeOCR(newPhotos[0]);
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  recognizeOCR(filePath) {
    console.log('[OCR] recognizeOCR 被调用, filePath:', filePath);
    console.log('[OCR] 当前状态 - recognizingOCR:', this.data.recognizingOCR, 'name:', this.data.formData.name);

    if (this.data.recognizingOCR) {
      console.log('[OCR] 跳过：正在识别中');
      return;
    }
    if (this.data.formData.name && this.data.formData.name.trim() !== '') {
      console.log('[OCR] 跳过：名称已有内容');
      return;
    }

    this.setData({ recognizingOCR: true });
    console.log('[OCR] 开始读取图片为 Base64...');

    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (fileRes) => {
        const base64Data = fileRes.data;
        console.log('[OCR] Base64 长度:', base64Data ? base64Data.length : 0);
        this.callOCRApi(base64Data);
      },
      fail: (err) => {
        this.setData({ recognizingOCR: false });
        console.error('读取图片失败:', err);
      }
    });
  },

  callOCRApi(base64Data) {
    const that = this;
    const ocrUrl = `${MSG_BASE_URL}/api/ocr/recognize`;
    console.log('[OCR] 准备调用接口:', ocrUrl);

    wx.request({
      url: ocrUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { image_data: base64Data },
      timeout: OCR_TIMEOUT,
      success(ocrRes) {
        console.log('[OCR] 接口响应:', ocrRes);

        if (ocrRes.statusCode === 200 && ocrRes.data && ocrRes.data.success) {
          const words = ocrRes.data.words;

          if (words && words.length > 0) {
            const recognizedName = words[0];
            that.setData({ 'formData.name': recognizedName });
            wx.showToast({ title: '已识别到文字', icon: 'success' });
          } else {
            wx.showToast({ title: '未识别到文字', icon: 'none' });
          }
        } else {
          const message = ocrRes.data?.message || 'OCR识别失败';
          console.error('OCR识别失败:', message);
        }
      },
      fail(err) {
        that.setData({ recognizingOCR: false });
        const errorMsg = err.errMsg || '网络错误';

        if (err.errMsg && err.errMsg.includes('timeout')) {
          wx.showToast({ title: 'OCR识别超时', icon: 'none' });
        } else {
          wx.showToast({ title: 'OCR请求失败', icon: 'none' });
        }
        console.error('OCR请求失败:', errorMsg);
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

  submitForm() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善表单信息', icon: 'none' });
      return;
    }

    if (this.data.submitting) return;

    wx.showModal({
      title: '确认提交',
      content: this.data.photoList.length > 0
        ? `将提交POI信息并上传 ${this.data.photoList.length} 张图片`
        : '确定要提交POI信息吗？（建议上传图片）',
      success: (res) => {
        if (res.confirm) {
          this.doSubmitWithImages();
        }
      }
    });
  },

  async doSubmitWithImages() {
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    try {
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

      const res = await Request.post(API.SUBMISSION.CREATE, submitData, true);

      if (res.success) {
        const submissionId = res.data?.submissionId;
        console.log('[Collect] 提交成功，submissionId:', submissionId);
        console.log('[Collect] res.data:', res.data);
        console.log('[Collect] res.data?.submissionId:', submissionId);
        console.log('[Collect] photoList长度:', this.data.photoList.length);

        const shouldUpload = submissionId && this.data.photoList.length > 0;
        console.log('[Collect] shouldUpload条件判断:', shouldUpload);
        console.log('[Collect] - submissionId有效:', !!submissionId);
        console.log('[Collect] - photoList有图片:', this.data.photoList.length > 0);

        if (shouldUpload) {
          await this.uploadImagesAfterSubmission(submissionId);
        } else {
          console.log('[Collect] ⚠️ 跳过图片上传：submissionId或photoList为空');
        }

        wx.hideLoading();
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      } else {
        throw new Error(res.message || '提交失败');
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('提交失败:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },

  async uploadImagesAfterSubmission(submissionId) {
    const photoList = this.data.photoList;

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【采集页面】图片上传流程开始 - Base64方式              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── submissionId:', submissionId);
    console.log('  ├── 图片数量:', photoList.length);
    console.log('  ├── photoList内容:', photoList);
    console.log('  ├── ImageService:', typeof ImageService);
    console.log('  ├── ImageService.uploadAfterSubmission:', typeof ImageService?.uploadAfterSubmission);

    if (photoList.length === 0) {
      console.log('  └── [退出] 没有图片需要上传');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }

    console.log('\n  [Step 1] 调用 ImageService.uploadAfterSubmission()');
    wx.showLoading({ title: `上传图片 (0/${photoList.length})...` });

    try {
      console.log('      开始处理图片上传...');
      const result = await ImageService.uploadAfterSubmission(
        submissionId,
        photoList,
        (completed, total) => {
          console.log(`      [进度回调] ${completed}/${total}`);
          wx.showLoading({ title: `上传图片 (${completed}/${total})...` });
        }
      );

      console.log('\n  [Step 2] 上传完成，结果汇总:');
      console.log('      ├── success:', result.success);
      console.log('      ├── totalCount:', result.totalCount);
      console.log('      ├── successCount:', result.successCount);
      console.log('      ├── failedCount:', result.failedCount);

      if (result.success) {
        console.log('\n  ✅ 【图片上传全部成功】');
      } else if (result.failedCount > 0) {
        console.log('\n  ⚠️ 【部分图片上传失败】');
        console.log('      失败详情:', JSON.stringify(result.failedImages, null, 2));
        wx.showToast({
          title: `${result.successCount}张上传成功，${result.failedCount}张失败`,
          icon: 'none',
          duration: 3000
        });
      }
    } catch (err) {
      console.error('\n  ❌ 【图片上传出错】');
      console.error('      错误详情:', err);
      wx.showToast({ title: '图片上传失败', icon: 'none' });
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【采集页面】图片上传流程结束                          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
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

  preventBubble() {}
});