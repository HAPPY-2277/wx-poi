// 统一 API 配置
// 基于 PROJECT_API_AND_SCHEMA.md 后端接口文档

const { SERVER, MSG_SERVER, THIRD_PARTY } = require('./config.js');

const API_BASE_URL = SERVER.BASE_URL;
const MSG_BASE_URL = MSG_SERVER.BASE_URL;

const TENCENT_MAP_KEY = THIRD_PARTY.TENCENT_MAP_KEY;

const API = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },

  POI: {
    LIST: `${API_BASE_URL}/api/poi`,
    DETAIL: (id) => `${API_BASE_URL}/api/poi/${id}`,
    COLLECTOR_LIST: (collectorId) => `${API_BASE_URL}/api/poi/collector/${collectorId}`,
  },

  TASK: {
    CREATE: `${API_BASE_URL}/api/task`,
    DETAIL: (id) => `${API_BASE_URL}/api/task/${id}`,
    PUBLISHER_LIST: (publisherId) => `${API_BASE_URL}/api/task/publisher/${publisherId}`,
    COLLECTOR_LIST: (collectorId) => `${API_BASE_URL}/api/task/collector/${collectorId}`,
    PENDING_REVIEW: `${API_BASE_URL}/api/task/pending-review`,
  },

  USER: {
    COLLECTOR_IDS: `${API_BASE_URL}/api/users/collector-ids`,
    COLLECTORS: `${API_BASE_URL}/api/user/collectors`,
    VERIFIERS: `${API_BASE_URL}/api/user/verifiers`,
  },

  CATEGORY: {
    LIST: `${API_BASE_URL}/api/category`,
  },

  SUBMISSION: {
    CREATE: `${API_BASE_URL}/api/submission`,
    DETAIL: (id) => `${API_BASE_URL}/api/submission/${id}`,
    TASK_LIST: (taskId) => `${API_BASE_URL}/api/submission/task/${taskId}`,
    SUBMITTER_LIST: (submitterId) => `${API_BASE_URL}/api/submission/submitter/${submitterId}`,
    PENDING_REVIEW: `${API_BASE_URL}/api/submission/pending-review`,
    APPROVE: (id) => `${API_BASE_URL}/api/submission/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/api/submission/${id}/reject`,
    RESUBMIT: `${API_BASE_URL}/api/submission/resubmit`,
  },

  MSG: {
    SEND: `${MSG_BASE_URL}/api/messages/send`,
    GET_UNREAD: (userId) => `${MSG_BASE_URL}/api/messages/unread/${userId}`,
    GET_SYSTEM: (userId, limit = 50, offset = 0) => `${MSG_BASE_URL}/api/messages/system/${userId}?limit=${limit}&offset=${offset}`,
    MARK_READ: `${MSG_BASE_URL}/api/messages/read`,
    PRIVATE_HISTORY: `${MSG_BASE_URL}/api/messages/history/private`,
    GROUP_HISTORY: `${MSG_BASE_URL}/api/messages/history/group`,
    SUBMIT_OBJECTION: `${MSG_BASE_URL}/api/messages/objection`,
    WS_URL: (userId) => `ws://${MSG_SERVER.WS_HOST}:${MSG_SERVER.WS_PORT}/ws/${userId}`,
  }
};

module.exports = {
  API,
  API_BASE_URL,
  MSG_BASE_URL,
  TENCENT_MAP_KEY
};