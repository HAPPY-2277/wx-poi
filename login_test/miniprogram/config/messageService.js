// 消息服务模块
// 负责WebSocket连接、消息发送、接收和未读消息管理

const { API } = require('./api');

let socketTask = null;
let heartbeatTimer = null;
let reconnectTimer = null;
let isConnected = false;
let currentUserId = null;

// 消息事件监听器
const messageListeners = [];
const connectionListeners = [];

/**
 * 初始化消息服务并建立WebSocket连接
 * @param {number} userId 用户ID
 */
function connect(userId) {
  if (!userId) {
    console.error('[MessageService] 用户ID不能为空');
    return;
  }

  currentUserId = userId;
  createConnection();
}

/**
 * 创建WebSocket连接
 */
function createConnection() {
  if (socketTask) {
    socketTask.close();
    socketTask = null;
  }

  const wsUrl = API.MSG.WS_URL(currentUserId);
  console.log('[MessageService] 正在连接WebSocket:', wsUrl);

  socketTask = wx.connectSocket({
    url: wsUrl,
    success: () => {
      console.log('[MessageService] WebSocket连接已建立');
    },
    fail: (err) => {
      console.error('[MessageService] WebSocket连接失败:', err);
      scheduleReconnect();
    }
  });

  // 监听连接打开
  socketTask.onOpen(() => {
    console.log('[MessageService] WebSocket已打开');
    isConnected = true;
    notifyConnectionListeners(true);
    startHeartbeat();
  });

  // 监听消息接收
  socketTask.onMessage((res) => {
    handleMessage(res.data);
  });

  // 监听连接关闭
  socketTask.onClose(() => {
    console.log('[MessageService] WebSocket已关闭');
    isConnected = false;
    stopHeartbeat();
    notifyConnectionListeners(false);
    scheduleReconnect();
  });

  // 监听连接错误
  socketTask.onError((err) => {
    console.error('[MessageService] WebSocket错误:', err);
    isConnected = false;
    stopHeartbeat();
  });
}

/**
 * 处理接收到的消息
 * @param {string} data 消息数据
 */
function handleMessage(data) {
  console.log('[MessageService] 收到消息:', data);
  
  let message = parseMessage(data);
  if (message) {
    // 存储到本地缓存
    cacheMessage(message);
    // 通知所有监听器
    notifyMessageListeners(message);
  }
}

/**
 * 解析消息格式
 * @param {string} data 原始消息数据
 * @returns {Object|null} 解析后的消息对象
 */
function parseMessage(data) {
  if (!data) return null;

  try {
    // 检查是否是JSON格式
    if (data.startsWith('{')) {
      return JSON.parse(data);
    }

    // 解析文本格式消息: "123说: 你好" 或 "[群聊] 123: 大家好" 或 "系统通知：今日暂停采集"
    let message = {
      content: data,
      msg_type: 'private',
      from_user_id: 0,
      to_id: 0,
      to_type: 'user',
      content_type: 'text',
      created_at: new Date().toISOString()
    };

    if (data.startsWith('[群聊]')) {
      message.msg_type = 'group';
      const match = data.match(/\[群聊\]\s*([^:：]+)[:：]\s*(.+)/);
      if (match) {
        message.from_nickname = match[1].trim();
        message.content = match[2].trim();
      }
    } else if (data.startsWith('系统通知')) {
      message.msg_type = 'system';
      message.content = data.replace('系统通知：', '').replace('系统通知:', '');
    } else {
      const match = data.match(/([^:：]+)[:：]\s*(.+)/);
      if (match) {
        message.from_nickname = match[1].trim();
        message.content = match[2].trim();
      }
    }

    return message;
  } catch (e) {
    console.error('[MessageService] 解析消息失败:', e);
    return null;
  }
}

/**
 * 本地消息缓存
 */
const messageCache = {
  private: {},
  group: {}
};

/**
 * 缓存消息
 * @param {Object} message 消息对象
 */
function cacheMessage(message) {
  const { msg_type, from_user_id, to_id } = message;
  
  if (msg_type === 'private') {
    const chatKey = `${Math.min(from_user_id, to_id)}-${Math.max(from_user_id, to_id)}`;
    if (!messageCache.private[chatKey]) {
      messageCache.private[chatKey] = [];
    }
    messageCache.private[chatKey].push(message);
  } else if (msg_type === 'group') {
    if (!messageCache.group[to_id]) {
      messageCache.group[to_id] = [];
    }
    messageCache.group[to_id].push(message);
  }
}

/**
 * 获取缓存的消息
 * @param {string} type 消息类型 private/group
 * @param {number} targetId 目标ID（用户ID或群组ID）
 * @returns {Array} 消息列表
 */
function getCachedMessages(type, targetId) {
  if (type === 'private') {
    return messageCache.private[targetId] || [];
  } else if (type === 'group') {
    return messageCache.group[targetId] || [];
  }
  return [];
}

/**
 * 发送消息
 * @param {Object} params 消息参数
 * @returns {Promise} 返回发送结果
 */
async function sendMessage(params) {
  const { msg_type, from_user_id, to_id, to_type, content, content_type = 'text', poi_id = null, extra = null } = params;

  try {
    const res = await request({
      url: API.MSG.SEND,
      method: 'POST',
      data: {
        msg_type,
        from_user_id,
        to_id,
        to_type,
        content,
        content_type,
        poi_id,
        extra
      },
      needAuth: false
    });

    if (res.success) {
      const message = {
        ...params,
        msg_uuid: res.msg_uuid || res.data?.msg_uuid,
        created_at: new Date().toISOString()
      };
      cacheMessage(message);
      return { success: true, msg_uuid: res.msg_uuid || res.data?.msg_uuid };
    } else {
      return { success: false, message: res.msg || res.message || '发送失败' };
    }
  } catch (err) {
    console.error('[MessageService] 发送消息失败:', err);
    return { success: false, message: '网络请求失败' };
  }
}

/**
 * 获取未读消息
 * @param {number} userId 用户ID
 * @returns {Promise} 返回未读消息列表
 */
async function getUnreadMessages(userId) {
  try {
    const res = await request({
      url: API.MSG.GET_UNREAD(userId),
      method: 'GET',
      needAuth: false
    });

    if (res.success) {
      return { success: true, data: res.data || [] };
    } else {
      return { success: false, data: [] };
    }
  } catch (err) {
    console.error('[MessageService] 获取未读消息失败:', err);
    return { success: false, data: [] };
  }
}

/**
 * 标记消息为已读
 * @param {Array} msgUuids 消息UUID列表
 * @returns {Promise} 返回标记结果
 */
async function markAsRead(msgUuids) {
  if (!msgUuids || msgUuids.length === 0) return { success: true };

  try {
    const res = await request({
      url: API.MSG.MARK_READ,
      method: 'POST',
      data: { msg_uuids: msgUuids },
      needAuth: false
    });

    return { success: res.success };
  } catch (err) {
    console.error('[MessageService] 标记已读失败:', err);
    return { success: false };
  }
}

/**
 * 获取私聊历史记录
 * @param {number} user1 用户A的ID
 * @param {number} user2 用户B的ID
 * @param {number} limit 每页条数
 * @param {number} offset 偏移量
 * @returns {Promise} 返回历史消息列表
 */
async function getPrivateHistory(user1, user2, limit = 50, offset = 0) {
  try {
    const res = await request({
      url: `${API.MSG.PRIVATE_HISTORY}?user1=${user1}&user2=${user2}&limit=${limit}&offset=${offset}`,
      method: 'GET',
      needAuth: false
    });

    if (res.success) {
      return { success: true, data: res.data || [] };
    } else {
      return { success: false, data: [] };
    }
  } catch (err) {
    console.error('[MessageService] 获取私聊历史失败:', err);
    return { success: false, data: [] };
  }
}

/**
 * 获取群聊历史记录
 * @param {number} groupId 群组ID
 * @param {number} limit 每页条数
 * @param {number} offset 偏移量
 * @returns {Promise} 返回历史消息列表
 */
async function getGroupHistory(groupId, limit = 50, offset = 0) {
  try {
    const res = await request({
      url: `${API.MSG.GROUP_HISTORY}?group_id=${groupId}&limit=${limit}&offset=${offset}`,
      method: 'GET',
      needAuth: false
    });

    if (res.success) {
      return { success: true, data: res.data || [] };
    } else {
      return { success: false, data: [] };
    }
  } catch (err) {
    console.error('[MessageService] 获取群聊历史失败:', err);
    return { success: false, data: [] };
  }
}

/**
 * 提交异议
 * @param {Object} params 异议参数
 * @returns {Promise} 返回提交结果
 */
async function submitObjection(params) {
  try {
    const res = await request({
      url: API.MSG.SUBMIT_OBJECTION,
      method: 'POST',
      data: params,
      needAuth: false
    });

    return { success: res.success, message: res.msg || res.message };
  } catch (err) {
    console.error('[MessageService] 提交异议失败:', err);
    return { success: false, message: '网络请求失败' };
  }
}

/**
 * 发送HTTP请求的简化方法
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        const response = res.data;
        // 适配消息服务返回格式 { code, msg, data }
        const adapted = adaptMessageResponse(response);
        resolve(adapted);
      },
      fail: (err) => reject(err)
    });
  });
}

/**
 * 适配消息服务返回格式
 * @param {Object} response 原始响应
 * @returns {Object} 适配后的响应
 */
function adaptMessageResponse(response) {
  if (!response) return { success: false, code: 500, msg: '未知错误' };

  // 已经是标准格式（包含 success 字段）
  if (typeof response.success === 'boolean') {
    return response;
  }

  // 适配消息服务格式 { code, msg, data }
  if (typeof response.code === 'number') {
    return {
      success: response.code === 0,
      code: 0,
      msg: response.msg || (response.code === 0 ? '成功' : '请求失败'),
      data: response.data,
      message: response.msg
    };
  }

  return response;
}

/**
 * 开始心跳保活
 */
function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (socketTask && isConnected) {
      socketTask.send({
        data: 'ping',
        fail: () => {
          console.warn('[MessageService] 发送心跳失败');
        }
      });
    }
  }, 30000);
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * 计划重连
 */
function scheduleReconnect() {
  if (reconnectTimer) return;
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (currentUserId) {
      console.log('[MessageService] 尝试重新连接...');
      createConnection();
    }
  }, 3000);
}

/**
 * 断开连接
 */
function disconnect() {
  stopHeartbeat();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socketTask) {
    socketTask.close();
    socketTask = null;
  }
  isConnected = false;
  currentUserId = null;
}

/**
 * 添加消息监听器
 * @param {Function} listener 监听函数
 */
function addMessageListener(listener) {
  if (typeof listener === 'function' && !messageListeners.includes(listener)) {
    messageListeners.push(listener);
  }
}

/**
 * 移除消息监听器
 * @param {Function} listener 监听函数
 */
function removeMessageListener(listener) {
  const index = messageListeners.indexOf(listener);
  if (index > -1) {
    messageListeners.splice(index, 1);
  }
}

/**
 * 添加连接状态监听器
 * @param {Function} listener 监听函数
 */
function addConnectionListener(listener) {
  if (typeof listener === 'function' && !connectionListeners.includes(listener)) {
    connectionListeners.push(listener);
  }
}

/**
 * 移除连接状态监听器
 * @param {Function} listener 监听函数
 */
function removeConnectionListener(listener) {
  const index = connectionListeners.indexOf(listener);
  if (index > -1) {
    connectionListeners.splice(index, 1);
  }
}

/**
 * 通知消息监听器
 * @param {Object} message 消息对象
 */
function notifyMessageListeners(message) {
  messageListeners.forEach(listener => {
    try {
      listener(message);
    } catch (e) {
      console.error('[MessageService] 消息监听器执行错误:', e);
    }
  });
}

/**
 * 通知连接状态监听器
 * @param {boolean} connected 是否已连接
 */
function notifyConnectionListeners(connected) {
  connectionListeners.forEach(listener => {
    try {
      listener(connected);
    } catch (e) {
      console.error('[MessageService] 连接监听器执行错误:', e);
    }
  });
}

/**
 * 检查连接状态
 */
function checkConnection() {
  return isConnected;
}

/**
 * 发送私聊消息
 */
async function sendPrivateMessage(fromUserId, toUserId, content, poiId = null) {
  return sendMessage({
    msg_type: 'private',
    from_user_id: fromUserId,
    to_id: toUserId,
    to_type: 'user',
    content,
    poi_id: poiId
  });
}

/**
 * 发送群聊消息
 */
async function sendGroupMessage(fromUserId, groupId, content) {
  return sendMessage({
    msg_type: 'group',
    from_user_id: fromUserId,
    to_id: groupId,
    to_type: 'group',
    content
  });
}

/**
 * 发送系统通知（群发）
 */
async function sendSystemNotify(toUserIds, content) {
  const promises = toUserIds.map(userId => 
    sendMessage({
      msg_type: 'system',
      from_user_id: 0,
      to_id: userId,
      to_type: 'user',
      content
    })
  );
  return Promise.all(promises);
}

/**
 * 发送核验通知
 */
async function sendVerifyNotify(toUserId, content, poiId = null) {
  return sendMessage({
    msg_type: 'verify_notify',
    from_user_id: 0,
    to_id: toUserId,
    to_type: 'user',
    content,
    poi_id: poiId
  });
}

// 群组ID常量
const GROUP_IDS = {
  COLLECTOR: 1,
  VERIFIER: 2
};

module.exports = {
  connect,
  disconnect,
  sendMessage,
  sendPrivateMessage,
  sendGroupMessage,
  sendSystemNotify,
  sendVerifyNotify,
  getUnreadMessages,
  markAsRead,
  getPrivateHistory,
  getGroupHistory,
  submitObjection,
  addMessageListener,
  removeMessageListener,
  addConnectionListener,
  removeConnectionListener,
  checkConnection,
  getCachedMessages,
  GROUP_IDS
};
