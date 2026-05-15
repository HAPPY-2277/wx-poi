// 统一请求工具类
// 基于 API 文档的返回结构处理

const { API, IMAGE_CONFIG } = require('./api');
const { MOCK_ENABLED, RESPONSES } = require('./mock');

/**
 * API响应状态码常量
 */
const API_CODE = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

/**
 * 解析API错误信息
 */
const parseErrorMessage = (response, err) => {
  if (response && response.message) {
    return response.message;
  }
  if (response && response.msg) {
    return response.msg;
  }
  if (err && err.message) {
    return err.message;
  }
  return '请求失败';
};

const Request = {
  /**
   * 获取 Mock 响应数据（支持动态路径匹配）
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @returns {Object|null} Mock 响应数据
   */
  getMockResponse(url, data) {
    if (!MOCK_ENABLED) return null;
    const fullPath = url.replace(/^https?:\/\/[^/]+/, '');
    const path = fullPath.split('?')[0];
    console.log('[Mock] 请求路径:', path);

    let mockData = RESPONSES[path];
    if (mockData) {
      console.log('[Mock] 直接匹配成功');
      return typeof mockData === 'function' ? mockData(data) : mockData;
    }

    mockData = this.matchWildcardPath(path, Object.keys(RESPONSES));
    if (mockData) {
      console.log('[Mock] 通配符匹配成功');
      const matchedKey = this.getMatchedKey(path, Object.keys(RESPONSES));
      const originalData = RESPONSES[matchedKey];
      return typeof originalData === 'function' ? originalData(data) : originalData;
    }

    console.log('[Mock] 未找到匹配的Mock数据');
    return null;
  },

  /**
   * 通配符路径匹配
   * @param {string} path 请求路径
   * @param {Array} keys Mock配置的keys
   * @returns {string|null} 匹配的key
   */
  matchWildcardPath(path, keys) {
    for (const key of keys) {
      if (key.includes('*')) {
        const regex = new RegExp('^' + key.replace(/\*/g, '[^/]+') + '$');
        if (regex.test(path)) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * 获取匹配的key
   * @param {string} path 请求路径
   * @param {Array} keys Mock配置的keys
   * @returns {string|null} 匹配的key
   */
  getMatchedKey(path, keys) {
    for (const key of keys) {
      if (key.includes('*')) {
        const regex = new RegExp('^' + key.replace(/\*/g, '[^/]+') + '$');
        if (regex.test(path)) {
          return key;
        }
      }
    }
    return null;
  },

  /**
   * 统一请求方法
   * @param {Object} options 请求配置
   * @param {string} options.url 请求地址
   * @param {string} options.method 请求方法 (GET/POST/PUT/DELETE)
   * @param {Object} options.data 请求数据
   * @param {boolean} options.needAuth 是否需要认证
   * @returns {Promise<Object>} API响应数据
   */
  request(options) {
    const { url, method = 'GET', data = {}, needAuth = true } = options;

    const mockResponse = this.getMockResponse(url, data);
    if (mockResponse) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResponse), 100);
      });
    }

    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json'
      };

      if (needAuth) {
        const loginToken = wx.getStorageSync('loginToken');
        if (loginToken) {
          header['Authorization'] = 'Bearer ' + loginToken;
        }
      }

      wx.request({
        url,
        method,
        data,
        header,
        success: (res) => {
          const statusCode = res.statusCode;
          
          if (statusCode === API_CODE.UNAUTHORIZED || statusCode === API_CODE.FORBIDDEN) {
            wx.removeStorageSync('loginToken');
            wx.removeStorageSync('userId');
            wx.navigateTo({ url: '/pages/index/index' });
            reject({ success: false, code: statusCode, message: '登录已过期，请重新登录' });
            return;
          }

          const response = res.data;
          const adaptedResponse = this.adaptResponse(response);

          if (adaptedResponse.success) {
            const normalizedData = this.normalizeListData(adaptedResponse);
            resolve(normalizedData);
          } else {
            const errorMsg = parseErrorMessage(adaptedResponse, null);
            if (errorMsg && errorMsg !== '请求失败') {
              wx.showToast({ title: errorMsg, icon: 'none' });
            }
            reject(adaptedResponse);
          }
        },
        fail: (err) => {
          const errorMsg = err.errMsg || '网络请求失败';
          wx.showToast({ title: errorMsg, icon: 'none' });
          reject({ success: false, code: API_CODE.SERVER_ERROR, message: errorMsg });
        }
      });
    });
  },

  /**
   * 适配多种API返回格式
   * @param {Object} response API响应原始数据
   * @returns {Object} 统一格式的响应
   */
  adaptResponse(response) {
    if (!response) {
      return { success: false, code: API_CODE.SERVER_ERROR, message: '未知错误' };
    }

    if (typeof response.success === 'boolean') {
      return {
        success: response.success,
        code: response.code || (response.success ? API_CODE.SUCCESS : API_CODE.SERVER_ERROR),
        message: response.message || '',
        data: response.data
      };
    }

    if (typeof response.code === 'number') {
      return {
        success: response.code === 0 || response.code === API_CODE.SUCCESS,
        code: response.code,
        message: response.msg || (response.code === 0 ? '成功' : '请求失败'),
        data: response.data
      };
    }

    return response;
  },

  /**
   * 规范化列表数据，统一字段命名
   * @param {Object} response API响应
   * @returns {Object} 规范化后的响应
   */
  normalizeListData(response) {
    if (!response) return response;

    const normalizeItem = (item) => {
      if (!item) return item;

      const normalized = { ...item };

      if (item.createdAt !== undefined && item.createTime === undefined) {
        normalized.createTime = item.createdAt;
      }
      if (item.updatedAt !== undefined && item.updateTime === undefined) {
        normalized.updateTime = item.updatedAt;
      }

      if (item.taskType === 'CREATE_NEW') normalized.type = 'new';
      if (item.taskType === 'UPDATE_EXISTING') normalized.type = 'update';

      if (item.submissionType === 'CREATE') normalized.submissionType = 'create';
      if (item.submissionType === 'UPDATE') normalized.submissionType = 'update';

      if (item.targetAddress === undefined && item.address !== undefined) {
        normalized.targetAddress = item.address;
      }
      if (item.targetName === undefined && item.name !== undefined) {
        normalized.targetName = item.name;
      }
      if (item.targetCategory === undefined && item.category !== undefined) {
        normalized.targetCategory = item.category;
      }
      if (item.targetLongitude === undefined && item.longitude !== undefined) {
        normalized.targetLongitude = item.longitude;
      }
      if (item.targetLatitude === undefined && item.latitude !== undefined) {
        normalized.targetLatitude = item.latitude;
      }

      return normalized;
    };

    const result = { ...response };
    
    if (Array.isArray(response.data)) {
      result.data = response.data.map(normalizeItem);
    } else if (response.data && typeof response.data === 'object') {
      result.data = normalizeItem(response.data);
    }

    return result;
  },

  get(url, data, needAuth = true) {
    return this.request({ url, method: 'GET', data, needAuth });
  },

  post(url, data, needAuth = true) {
    return this.request({ url, method: 'POST', data, needAuth });
  },

  put(url, data, needAuth = true) {
    return this.request({ url, method: 'PUT', data, needAuth });
  },

  delete(url, data, needAuth = true) {
    return this.request({ url, method: 'DELETE', data, needAuth });
  },

  login(code) {
    return this.post(API.AUTH.LOGIN, { code }, false);
  },

  register(params) {
    return this.post(API.AUTH.REGISTER, params, false);
  },

  /**
   * Base64方式上传单张图片
   * @param {string} url 上传地址
   * @param {Object} imageData 图片数据 { filePath, filename, contentType }
   * @returns {Promise<Object>} 上传结果
   */
  uploadSingleImageByBase64(url, imageData) {
    return new Promise((resolve, reject) => {
      const { filePath, filename, contentType } = imageData;
      const loginToken = wx.getStorageSync('loginToken');
      const header = {
        'Content-Type': 'application/json',
        'Authorization': loginToken ? 'Bearer ' + loginToken : ''
      };

      // 读取文件为Base64
      const fileManager = wx.getFileSystemManager();
      fileManager.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          const base64Data = res.data;
          const base64WithPrefix = `data:${contentType};base64,${base64Data}`;

          console.log('[Base64上传] 开始上传图片:');
          console.log('[Base64上传] URL:', url);
          console.log('[Base64上传] 文件名:', filename);
          console.log('[Base64上传] 内容类型:', contentType);
          console.log('[Base64上传] Base64数据长度:', base64Data.length);
          console.log('[Base64上传] Base64总长度:', base64WithPrefix.length);

          wx.request({
            url: url,
            method: 'POST',
            data: {
              images: [{
                filename: filename,
                contentType: contentType,
                base64Data: base64WithPrefix
              }]
            },
            header: header,
            timeout: IMAGE_CONFIG.UPLOAD_TIMEOUT,
            success: (res) => {
              console.log('[Base64上传] HTTP响应状态:', res.statusCode);
              console.log('[Base64上传] 请求数据:', JSON.stringify({
                images: [{
                  filename: filename,
                  contentType: contentType,
                  base64Data: base64WithPrefix.substring(0, 50) + '...'
                }]
              }));
              console.log('[Base64上传] 响应数据:', res.data);

              const response = res.data;
              const adaptedResponse = this.adaptResponse(response);

              if (adaptedResponse.success) {
                console.log('[Base64上传] 上传成功');
                resolve(adaptedResponse);
              } else {
                const errorMsg = parseErrorMessage(adaptedResponse, null);
                console.error('[Base64上传] 上传失败:', errorMsg);
                reject({
                  success: false,
                  code: adaptedResponse.code || 500,
                  message: errorMsg || '图片上传失败',
                  filePath: filePath
                });
              }
            },
            fail: (err) => {
              console.error('[Base64上传] 请求失败:', err);
              console.error('[Base64上传] 错误信息:', err.errMsg);
              reject({
                success: false,
                code: 500,
                message: err.errMsg || '图片上传失败',
                filePath: filePath,
                error: err
              });
            }
          });
        },
        fail: (err) => {
          console.error('[Base64上传] 读取文件失败:', err);
          console.error('[Base64上传] 文件路径:', filePath);
          reject({
            success: false,
            code: 500,
            message: '读取图片文件失败',
            filePath: filePath,
            error: err
          });
        }
      });
    });
  },

  /**
   * 根据文件扩展名获取MIME类型
   * @param {string} filename 文件名
   * @returns {string} MIME类型
   */
  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  },

  /**
   * 从文件路径提取文件名
   * @param {string} filePath 文件路径
   * @returns {string} 文件名
   */
  getFilenameFromPath(filePath) {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'image.jpg';
  },

  /**
   * Base64方式批量上传图片
   * @param {string} url 上传地址
   * @param {Array<string>} filePaths 文件路径数组
   * @param {Function} onProgress 进度回调 (completed, total)
   * @returns {Promise<Object>} 上传结果 { success, uploadedImages, failedImages }
   */
  async uploadImagesByBase64(url, filePaths, onProgress) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【Base64上传】uploadImagesByBase64() 进入              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── URL:', url);
    console.log('  ├── 文件数量:', filePaths.length);
    console.log('  ├── 文件列表:', filePaths);

    const total = filePaths.length;
    const uploadedImages = [];
    const failedImages = [];

    console.log('\n  [开始逐个上传图片]');

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const filename = this.getFilenameFromPath(filePath);
      const contentType = this.getContentType(filename);

      console.log(`\n  ┌──────────────────────────────────────┐`);
      console.log(`  │ 第 ${i + 1}/${total} 张图片上传中...`);
      console.log(`  └──────────────────────────────────────┘`);
      console.log(`      文件路径: ${filePath}`);
      console.log(`      文件名: ${filename}`);
      console.log(`      内容类型: ${contentType}`);

      try {
        console.log(`      [调用] uploadSingleImageByBase64()`);
        const result = await this.uploadSingleImageByBase64(url, {
          filePath,
          filename,
          contentType
        });

        if (result.success && result.data) {
          console.log(`      [成功] 图片上传完成`);
          uploadedImages.push({
            ...result.data,
            localPath: filePath
          });
        } else {
          console.log(`      [失败] 图片上传失败: ${result.message}`);
          failedImages.push({
            filePath: filePath,
            error: result.message
          });
        }
      } catch (err) {
        console.error(`      [异常] 上传出错: ${err.message || err}`);
        failedImages.push({
          filePath: filePath,
          error: err.message || '上传失败'
        });
      }

      if (onProgress) {
        console.log(`      [回调] 通知进度: ${i + 1}/${total}`);
        onProgress(i + 1, total);
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║ 【Base64上传】uploadImagesByBase64() 完成              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('  ├── 成功:', uploadedImages.length, '张');
    console.log('  ├── 失败:', failedImages.length, '张');
    console.log('  ├── 总计:', total, '张');
    console.log('  └── 整体状态:', failedImages.length === 0 ? '✅ 全部成功' : '⚠️ 部分失败');

    return {
      success: failedImages.length === 0,
      uploadedImages,
      failedImages,
      totalCount: total,
      successCount: uploadedImages.length,
      failedCount: failedImages.length
    };
  }
};

module.exports = {
  Request
};