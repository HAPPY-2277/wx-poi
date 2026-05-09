// 统一配置文件
// 包含服务器地址和第三方API Key

module.exports = {
  // 业务数据服务器配置（POI业务相关）
  SERVER: {
    BASE_URL: 'http://10.197.211.192:8080',
  },

  // 消息聊天服务器配置（独立的消息推送服务）
  MSG_SERVER: {
    BASE_URL: 'http://10.197.211.98:8000',
    HTTP_PORT: 8000,
    WS_HOST: '10.197.211.192',
    WS_PORT: 8000,
  },

  // 第三方API配置
  THIRD_PARTY: {
    TENCENT_MAP_KEY: 'UWVBZ-RNWKQ-FVZ54-BUNSC-AGBIZ-WVB3Y',
  }
};
