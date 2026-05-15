// 图片服务模块
// 功能：封装图片上传、查询、删除逻辑，支持 Submission 和 POI 两种图片管理
// 引用方式：const ImageService = require('../../config/imageService');

const { API, IMAGE_CONFIG } = require('./api');
const { Request } = require('./request');

const ImageService = {
  /**
   * 上传 Submission 图片（Base64方式）
   * @param {string} submissionId 提交记录ID
   * @param {Array<string>} filePaths 图片文件路径数组
   * @param {Function} onProgress 进度回调函数 (completed, total)
   * @returns {Promise<Object>} 上传结果
   */
  async uploadSubmissionImages(submissionId, filePaths, onProgress) {
    const url = API.SUBMISSION.UPLOAD_IMAGES(submissionId);
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【ImageService】uploadSubmissionImages() - Base64模式  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── submissionId:', submissionId);
    console.log('  ├── 生成URL:', url);
    console.log('  ├── 文件数量:', filePaths.length);
    console.log('  └── 调用 Request.uploadImagesByBase64()');

    const result = await Request.uploadImagesByBase64(url, filePaths, onProgress);

    console.log('  └── Request.uploadImagesByBase64() 返回:', result.success ? '成功' : '失败');
    return result;
  },

  /**
   * 上传 POI 图片（Base64方式）
   * @param {string} poiId POI ID
   * @param {Array<string>} filePaths 图片文件路径数组
   * @param {Function} onProgress 进度回调函数 (completed, total)
   * @returns {Promise<Object>} 上传结果
   */
  async uploadPoiImages(poiId, filePaths, onProgress) {
    const url = API.POI.UPLOAD_IMAGES(poiId);
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【ImageService】uploadPoiImages() - Base64模式          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── poiId:', poiId);
    console.log('  ├── 生成URL:', url);
    console.log('  ├── 文件数量:', filePaths.length);
    console.log('  └── 调用 Request.uploadImagesByBase64()');

    const result = await Request.uploadImagesByBase64(url, filePaths, onProgress);

    console.log('  └── Request.uploadImagesByBase64() 返回:', result.success ? '成功' : '失败');
    return result;
  },

  /**
   * 获取 Submission 图片列表
   * @param {string} submissionId 提交记录ID
   * @returns {Promise<Array>} 图片列表
   */
  async getSubmissionImages(submissionId) {
    try {
      const res = await Request.get(API.SUBMISSION.GET_IMAGES(submissionId), {}, true);
      return res.success ? (res.data || []) : [];
    } catch (err) {
      console.error('[ImageService] 获取 Submission 图片列表失败:', err);
      return [];
    }
  },

  /**
   * 获取 POI 图片列表
   * @param {string} poiId POI ID
   * @returns {Promise<Array>} 图片列表
   */
  async getPoiImages(poiId) {
    try {
      const res = await Request.get(API.POI.GET_IMAGES(poiId), {}, true);
      return res.success ? (res.data || []) : [];
    } catch (err) {
      console.error('[ImageService] 获取 POI 图片列表失败:', err);
      return [];
    }
  },

  /**
   * 删除 Submission 图片
   * @param {string} imageId 图片ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteSubmissionImage(imageId) {
    try {
      const res = await Request.delete(API.SUBMISSION.DELETE_IMAGE(imageId), {}, true);
      return res.success;
    } catch (err) {
      console.error('[ImageService] 删除 Submission 图片失败:', err);
      return false;
    }
  },

  /**
   * 删除 POI 图片
   * @param {string} imageId 图片ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deletePoiImage(imageId) {
    try {
      const res = await Request.delete(API.POI.DELETE_IMAGE(imageId), {}, true);
      return res.success;
    } catch (err) {
      console.error('[ImageService] 删除 POI 图片失败:', err);
      return false;
    }
  },

  /**
   * 从数据中提取图片列表（兼容 images 数组）
   * @param {Object} data API 返回的数据对象
   * @returns {Array} 图片列表
   */
  extractImagesFromData(data) {
    if (!data) return [];

    if (Array.isArray(data.images)) {
      return data.images;
    }

    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.images && Array.isArray(item.images)) {
          return item.images;
        }
        return [];
      }).flat();
    }

    return [];
  },

  /**
   * 获取图片 URL（兼容本地路径和网络路径）
   * @param {Object|string} image 图片对象或 URL 字符串
   * @returns {string} 图片 URL
   */
  getImageUrl(image) {
    if (!image) return '';

    if (typeof image === 'string') {
      return image;
    }

    return image.imageUrl || image.url || image.src || '';
  },

  /**
   * 验证图片文件（大小和数量）
   * @param {Array<string>} filePaths 文件路径数组
   * @returns {Promise<Object>} 验证结果 { valid, errors }
   */
  async validateImages(filePaths) {
    const errors = [];

    if (filePaths.length > IMAGE_CONFIG.MAX_COUNT) {
      errors.push(`最多只能上传 ${IMAGE_CONFIG.MAX_COUNT} 张图片`);
      return { valid: false, errors };
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 上传并返回图片信息（提交后上传场景）
   * @param {string} submissionId 提交记录ID
   * @param {Array<string>} filePaths 图片文件路径数组
   * @param {Function} onProgress 进度回调
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAfterSubmission(submissionId, filePaths, onProgress) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【ImageService】uploadAfterSubmission() - Base64模式   ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── submissionId:', submissionId);
    console.log('  ├── 文件数量:', filePaths ? filePaths.length : 0);

    if (!filePaths || filePaths.length === 0) {
      console.log('  └── [退出] 没有图片需要上传');
      return {
        success: true,
        uploadedImages: [],
        failedImages: [],
        message: '没有图片需要上传'
      };
    }

    console.log('\n  [Step A] 验证图片文件...');
    const validation = await this.validateImages(filePaths);
    console.log('      验证结果:', validation.valid ? '通过' : '失败');
    if (!validation.valid) {
      console.log('      验证错误:', validation.errors);
      return {
        success: false,
        uploadedImages: [],
        failedImages: filePaths.map(f => ({ filePath: f, error: validation.errors.join(', ') })),
        message: '图片验证失败'
      };
    }

    console.log('\n  [Step B] 调用 uploadSubmissionImages() - Base64方式');
    console.log('      URL:', API.SUBMISSION.UPLOAD_IMAGES(submissionId));
    const result = await this.uploadSubmissionImages(submissionId, filePaths, onProgress);

    console.log('\n  [Step C] 上传完成，结果汇总:');
    console.log('      ├── success:', result.success);
    console.log('      ├── totalCount:', result.totalCount);
    console.log('      ├── successCount:', result.successCount);
    console.log('      ├── failedCount:', result.failedCount);
    console.log('      └── uploadedImages:', result.uploadedImages);

    return result;
  }
};

module.exports = {
  ImageService
};