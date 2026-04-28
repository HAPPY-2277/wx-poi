// 统一请求工具类
// 基于 API 文档的返回结构处理

const { API } = require('./api');

const Request = {
  /**
   * 统一请求方法
   * @param {Object} options 请求配置
   * @param {string} options.url 请求地址
   * @param {string} options.method 请求方法 (GET/POST/PUT/DELETE)
   * @param {Object} options.data 请求数据
   * @param {boolean} options.needAuth 是否需要认证 (默认 true)
   * @returns {Promise} 返回 Promise 对象
   */
  request(options) {
    const { url, method = 'GET', data = {}, needAuth = true } = options;

    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json'
      };

      // 添加认证 token
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

          // 根据 API 文档：以 success 字段作为主要判断依据
          if (response.success) {
            resolve(response);
          } else {
            // 显示错误提示
            if (response.message) {
              wx.showToast({
                title: response.message,
                icon: 'none'
              });
            }
            reject(response);
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
   * GET 请求
   */
  get(url, data, needAuth = true) {
    return this.request({
      url,
      method: 'GET',
      data,
      needAuth
    });
  },

  /**
   * POST 请求
   */
  post(url, data, needAuth = true) {
    return this.request({
      url,
      method: 'POST',
      data,
      needAuth
    });
  },

  /**
   * 登录请求
   * @param {string} openid 微信用户唯一标识（通过云函数获取）
   * @param {string} code 微信登录凭证
   */
  login(openid, code) {
    return this.post(API.AUTH.LOGIN, { openid, code }, false);
  },

  /**
   * 注册请求
   * @param {Object} params 注册参数 { openid, code, nickname, avatarUrl }
   */
  register(params) {
    return this.post(API.AUTH.REGISTER, params, false);
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return this.get(API.USER.GET_INFO, {}, true);
  }
};

module.exports = {
  Request
};