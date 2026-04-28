// 统一 API 配置
// API 文档规范：http://<HOST>:<PORT>/api/auth/...

const API_BASE_URL = 'http://172.16.60.147:8080';

const API = {
  // 认证相关接口
  AUTH: {
    // 登录接口 - POST /api/auth/login
    // 请求：{ code: string } (wx.login() 获取的临时凭证，后端用此换取 openid)
    // 成功返回：{ code: 200, success: true, data: { isNewUser: boolean, loginToken: string } }
    // 失败返回：{ code: 400/500, success: false, message: string }
    LOGIN: `${API_BASE_URL}/api/auth/login`,

    // 注册接口 - POST /api/auth/register
    // 请求：{ code: string, nickname?: string, avatarUrl?: string, role?: string }
    // 成功返回：{ code: 200, success: true, data: { isNewUser: true, loginToken: string } }
    // 失败返回：{ code: 400, success: false, message: string }
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },

  // 用户相关接口
  USER: {
    // 获取用户信息 - GET /api/userinfo
    GET_INFO: `${API_BASE_URL}/api/userinfo`,

    // 更新用户信息 - POST /api/updateUser
    UPDATE: `${API_BASE_URL}/api/updateUser`,
  }
};

module.exports = {
  API,
  API_BASE_URL
};