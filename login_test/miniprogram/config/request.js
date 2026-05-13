// 统一请求工具类
// 基于 API 文档的返回结构处理

const { API } = require('./api');
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
  }
};

module.exports = {
  Request
};