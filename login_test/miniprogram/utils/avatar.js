/**
 * 头像工具函数
 * 根据用户角色返回对应的头像图片路径
 */

// 角色头像映射
const AVATAR_MAP = {
  collector: '/images/collector.png',
  verifier: '/images/verifier.png'
};

// 默认头像（兜底）
const DEFAULT_AVATAR = '/images/avatar.png';

/**
 * 根据用户角色获取头像路径
 * @param {string} role - 用户角色 (collector/verifier)
 * @param {string} customAvatar - 可选的自定义头像路径（暂不使用，统一使用角色头像）
 * @returns {string} 头像图片路径
 */
function getAvatarUrl(role, customAvatar) {
  return AVATAR_MAP[role] || DEFAULT_AVATAR;
}

/**
 * 根据用户信息获取头像路径
 * @param {Object} userInfo - 用户信息对象
 * @param {string} userInfo.role - 用户角色
 * @param {string} userInfo.avatar - 用户头像（如果有）
 * @returns {string} 头像图片路径
 */
function getAvatarByUserInfo(userInfo) {
  if (!userInfo) {
    return DEFAULT_AVATAR;
  }
  
  // 优先使用角色头像（统一使用角色标识）
  if (userInfo.role && AVATAR_MAP[userInfo.role]) {
    return AVATAR_MAP[userInfo.role];
  }
  
  return DEFAULT_AVATAR;
}

/**
 * 批量处理用户列表的头像
 * @param {Array} userList - 用户列表
 * @returns {Array} 处理后的用户列表
 */
function processUserListAvatars(userList) {
  if (!Array.isArray(userList)) {
    return [];
  }
  
  return userList.map(user => ({
    ...user,
    avatar: getAvatarByUserInfo(user)
  }));
}

module.exports = {
  AVATAR_MAP,
  DEFAULT_AVATAR,
  getAvatarUrl,
  getAvatarByUserInfo,
  processUserListAvatars
};
