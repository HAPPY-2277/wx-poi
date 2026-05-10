// 统一请求工具类
// 基于 API 文档的返回结构处理

const { API } = require('./api');
const { MOCK_ENABLED, RESPONSES } = require('./mock');

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
          const response = res.data;
          const adaptedResponse = this.adaptResponse(response);

          if (adaptedResponse.success) {
            resolve(adaptedResponse);
          } else {
            if (adaptedResponse.message) {
              wx.showToast({
                title: adaptedResponse.message,
                icon: 'none'
              });
            }
            reject(adaptedResponse);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  /**
   * 适配两种返回格式
   */
  adaptResponse(response) {
    if (!response) return { success: false, code: 500, message: '未知错误' };

    if (typeof response.success === 'boolean') {
      return this.adaptTimestamp(response);
    }

    if (typeof response.code === 'number') {
      return {
        success: response.code === 0,
        code: 200,
        message: response.msg || (response.code === 0 ? '成功' : '请求失败'),
        data: response.data,
        msg: response.msg
      };
    }

    return response;
  },

  /**
   * 统一时间字段命名
   * API返回 createdAt/updatedAt，部分代码使用 createTime/updateTime
   */
  adaptTimestamp(response) {
    if (!response) return response;
    
    if (Array.isArray(response.data)) {
      response.data = response.data.map(item => this.mapTimestampFields(item));
    } else if (response.data && typeof response.data === 'object') {
      response.data = this.mapTimestampFields(response.data);
    }
    
    return response;
  },

  mapTimestampFields(data) {
    if (data.createdAt !== undefined && data.createTime === undefined) {
      data.createTime = data.createdAt;
    }
    if (data.updatedAt !== undefined && data.updateTime === undefined) {
      data.updateTime = data.updatedAt;
    }
    if (data.taskType !== undefined) {
      if (data.taskType === 'CREATE_NEW') data.type = 'new';
      if (data.taskType === 'UPDATE_EXISTING') data.type = 'update';
    }
    if (data.submissionType !== undefined) {
      if (data.submissionType === 'CREATE') data.submissionType = 'create';
      if (data.submissionType === 'UPDATE') data.submissionType = 'update';
    }
    return data;
  },

  get(url, data, needAuth = true) {
    return this.request({ url, method: 'GET', data, needAuth });
  },

  post(url, data, needAuth = true) {
    return this.request({ url, method: 'POST', data, needAuth });
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