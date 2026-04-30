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
  },

  // 采集者相关接口
  COLLECTOR: {
    // 获取采集者首页统计数据 - GET /api/collector/stats
    GET_STATS: `${API_BASE_URL}/api/collector/stats`,

    // 创建新的POI采集 - POST /api/collector/poi
    CREATE_POI: `${API_BASE_URL}/api/collector/poi`,

    // 获取我的POI列表 - GET /api/collector/poi/list
    GET_MY_POI_LIST: `${API_BASE_URL}/api/collector/poi/list`,

    // 获取POI详情 - GET /api/collector/poi/:id
    GET_POI_DETAIL: `${API_BASE_URL}/api/collector/poi`,

    // 获取待采集任务列表 - GET /api/collector/tasks
    GET_TASKS: `${API_BASE_URL}/api/collector/tasks`,

    // 获取任务详情 - GET /api/collector/task/:id
    GET_TASK_DETAIL: `${API_BASE_URL}/api/collector/task`,

    // 提交重新采集 - POST /api/collector/task/:id/resubmit
    RESUBMIT_TASK: `${API_BASE_URL}/api/collector/task/resubmit`,
  },

  // 核验者相关接口
  VERIFIER: {
    // 获取核验者首页统计数据 - GET /api/verifier/stats
    GET_STATS: `${API_BASE_URL}/api/verifier/stats`,

    // 获取待核验列表 - GET /api/verifier/pending-list
    PENDING_LIST: `${API_BASE_URL}/api/verifier/pending-list`,

    // 获取POI详情（核验） - GET /api/verifier/poi/:id
    GET_POI_DETAIL: `${API_BASE_URL}/api/verifier/poi`,

    // 提交核验结果 - POST /api/verifier/verify
    VERIFY: `${API_BASE_URL}/api/verifier/verify`,

    // 获取我的审核记录 - GET /api/verifier/my-reviews
    MY_REVIEWS: `${API_BASE_URL}/api/verifier/my-reviews`,

    // 获取我的审核统计 - GET /api/verifier/my-statistics
    MY_STATS: `${API_BASE_URL}/api/verifier/my-statistics`,
  }
};

module.exports = {
  API,
  API_BASE_URL
};