// 统一 API 配置
// 基于 API 文档 api-doc_YAML.yaml / api-docs_json.json
// POI列表相关接口:
//   - GET /api/poi                    => 获取所有POI列表 (ApiResponseListPoiResponse)
//   - GET /api/poi/{id}               => 获取POI详情 (ApiResponsePoiResponse)
//   - GET /api/poi/collector/{id}      => 获取采集者的POI (ApiResponseListPoiResponse)

const { SERVER, MSG_SERVER, THIRD_PARTY } = require('./config.js');

const API_BASE_URL = SERVER.BASE_URL;
const MSG_BASE_URL = MSG_SERVER.BASE_URL;

const TENCENT_MAP_KEY = THIRD_PARTY.TENCENT_MAP_KEY;

// 图片上传配置常量
const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 单张图片最大 2MB
  MAX_COUNT: 9,                      // 最多上传9张
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  UPLOAD_TIMEOUT: 30000              // 上传超时 30秒
};

const API = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },

  POI: {
    LIST: `${API_BASE_URL}/api/poi`,
    DETAIL: (id) => `${API_BASE_URL}/api/poi/${id}`,
    COLLECTOR_LIST: (collectorId) => `${API_BASE_URL}/api/poi/collector/${collectorId}`,
    UPLOAD_IMAGES: (poiId) => `${API_BASE_URL}/api/poi/${poiId}/images`,
    GET_IMAGES: (poiId) => `${API_BASE_URL}/api/poi/${poiId}/images`,
    DELETE_IMAGE: (imageId) => `${API_BASE_URL}/api/poi/images/${imageId}`,
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
    VERIFIER_IDS: `${API_BASE_URL}/api/users/verifier-ids`,
    ALL_IDS: `${API_BASE_URL}/api/users/ids`,
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
    UPLOAD_IMAGES: (submissionId) => `${API_BASE_URL}/api/submission/${submissionId}/images`,
    GET_IMAGES: (submissionId) => `${API_BASE_URL}/api/submission/${submissionId}/images`,
    DELETE_IMAGE: (imageId) => `${API_BASE_URL}/api/submission/images/${imageId}`,
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
  },

  OCR: {
    RECOGNIZE: `${MSG_BASE_URL}/api/ocr/recognize`
  }
};

module.exports = {
  API,
  API_BASE_URL,
  MSG_BASE_URL,
  TENCENT_MAP_KEY,
  IMAGE_CONFIG
};