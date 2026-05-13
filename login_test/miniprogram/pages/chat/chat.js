// 聊天页面
// 功能：聊天功能主入口，包含消息列表、群聊、私聊、用户列表入口
const { API } = require('../../config/api');
const { Request } = require('../../config/request');
const messageService = require('../../config/messageService');

// 消息已读状态常量（与后端保持一致）
const MSG_READ_STATUS = {
  UNREAD: 0,
  READ: 1
};

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      nickname: '',
      avatar: '/images/avatar.png',
      role: ''
    },
    userId: null,
    messages: [],
    unreadCount: 0,
    systemUnreadCount: 0,
    activeTab: 'private',
    systemNotifications: [],
    privateChats: [],
    currentUserId: null,
    _messageListener: null,
    _connectionListener: null,
    // 用户列表相关
    userList: [],
    userListLoading: false,
    userListError: null,
    userListEmpty: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  onPullDownRefresh() {
    this.refreshCurrentTab();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 800);
  },

  /**
   * 根据当前Tab刷新对应数据
   */
  refreshCurrentTab() {
    switch (this.data.activeTab) {
      case 'system':
        this.fetchSystemNotifications(true);
        break;
      case 'private':
        this.fetchUnreadCount(true);
        break;
      case 'users':
        this.fetchUserList(true);
        break;
    }
  },

  checkLoginStatus() {
    const loginToken = wx.getStorageSync('loginToken');
    const userNickname = wx.getStorageSync('userNickname') || '';
    const userAvatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';
    const userRole = wx.getStorageSync('userRole') || '';
    const userId = wx.getStorageSync('userId') || null;

    if (loginToken) {
      this.setData({
        isLoggedIn: true,
        userInfo: {
          nickname: userNickname,
          avatar: userAvatar,
          role: userRole
        },
        currentUserId: userId
      });

      this.initMessageService(userId);
      this.fetchUnreadCount();
    } else {
      this.setData({ isLoggedIn: false });
    }
  },

  initMessageService(userId) {
    if (!userId) return;

    const msgListener = this.handleNewMessage.bind(this);
    const connListener = this.handleConnectionChange.bind(this);

    this.setData({
      _messageListener: msgListener,
      _connectionListener: connListener
    });

    messageService.connect(userId);
    messageService.addMessageListener(msgListener);
    messageService.addConnectionListener(connListener);
  },

  async fetchUnreadCount(refresh = false) {
    if (!this.data.currentUserId) return;

    try {
      const unreadRes = await messageService.getUnreadMessages(this.data.currentUserId);
      if (unreadRes.success && unreadRes.data) {
        const privateUnread = unreadRes.data.filter(m => m.msg_type === 'private');
        const systemUnread = unreadRes.data.filter(m => m.msg_type === 'system');

        this.setData({
          unreadCount: privateUnread.length,
          systemUnreadCount: systemUnread.length,
          privateChats: this.groupPrivateMessages(privateUnread)
        });
        this.updateTabBarBadge(unreadRes.data.length);
      }
      this.fetchSystemNotifications();
    } catch (err) {
      console.error('获取未读消息失败:', err);
    }
  },

  async fetchSystemNotifications(refresh = false) {
    if (!this.data.currentUserId) return;

    try {
      const res = await messageService.getSystemHistory(this.data.currentUserId, 50, 0);
      if (res.success && res.data) {
        this.setData({ systemNotifications: res.data });
      }
    } catch (err) {
      console.error('获取系统通知历史失败:', err);
    }
  },

  async loadMoreSystemNotifications() {
    if (!this.data.currentUserId) return;

    try {
      const offset = this.data.systemNotifications.length;
      const res = await messageService.getSystemHistory(this.data.currentUserId, 50, offset);
      if (res.success && res.data && res.data.length > 0) {
        this.setData({
          systemNotifications: [...this.data.systemNotifications, ...res.data]
        });
      }
    } catch (err) {
      console.error('加载更多系统通知失败:', err);
    }
  },

  /**
   * 获取用户列表
   * @param {boolean} refresh 是否刷新
   */
  async fetchUserList(refresh = false) {
    if (this.data.userListLoading) return;

    this.setData({
      userListLoading: true,
      userListError: null,
      userListEmpty: false
    });

    try {
      const res = await Request.get(API.USER.ALL_IDS, {}, true);
      const users = this.extractUserList(res);

      this.setData({
        userList: users,
        userListLoading: false,
        userListEmpty: users.length === 0
      });
    } catch (err) {
      console.error('[Chat] 获取用户列表失败:', err);
      this.setData({
        userListLoading: false,
        userListError: err.message || '加载用户列表失败',
        userListEmpty: false
      });
      wx.showToast({
        title: err.message || '加载用户列表失败',
        icon: 'none'
      });
    }
  },

  /**
   * 从API响应中提取用户列表
   * API返回格式：{ success, code, message, data: [UserResponse, ...] }
   * UserResponse: { id, nickname, role, lastLoginAt, createdAt, online }
   * @param {Object} res API响应
   * @returns {Array} 用户列表
   */
  extractUserList(res) {
    if (!res) return [];
    
    // 直接处理数组格式（某些API可能直接返回数组）
    if (Array.isArray(res)) {
      return res.filter(u => u && u.id !== this.data.currentUserId).map(u => ({
        //id: u.id || u.userId || '',
        nickname: u.nickname || u.name || `用户${u.id || ''}`,
        avatar: u.avatar || '/images/avatar.png',
        role: u.role || 'unknown',
        createTime: u.createdAt || u.createTime || null,
        online: u.online || false
      }));
    }
    
    // 处理包装响应格式 { success, code, message, data: [...] }
    if (res.data && Array.isArray(res.data)) {
      return res.data.filter(u => u && u.id !== this.data.currentUserId).map(user => ({
        id: user.id || user.userId || '',
        nickname: user.nickname || user.name || `用户${user.id || ''}`,
        avatar: user.avatar || '/images/avatar.png',
        role: user.role || 'unknown',
        createTime: user.createdAt || user.createTime || null,
        online: user.online || false
      }));
    }
    
    return [];
  },

  /**
   * 获取用户角色标签信息
   * @param {string} role 角色
   * @returns {Object} 角色信息
   */
  getRoleInfo(role) {
    const roleMap = {
      'collector': { label: '采集者', color: '#3b82f6', icon: '📍' },
      'verifier': { label: '核验者', color: '#10b981', icon: '✓' },
      'admin': { label: '管理员', color: '#8b5cf6', icon: '👑' }
    };
    return roleMap[role] || { label: '用户', color: '#6b7280', icon: '👤' };
  },

  /**
   * 格式化用户创建时间
   * @param {string|number} timestamp 时间戳
   * @returns {string} 相对时间或格式化时间
   */
  formatUserTime(timestamp) {
    if (!timestamp) return '未知';

    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return '刚刚';
    if (diff < hour) return Math.floor(diff / minute) + '分钟前';
    if (diff < day) return Math.floor(diff / hour) + '小时前';
    if (diff < 7 * day) return Math.floor(diff / day) + '天前';

    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${month}-${dayStr}`;
  },

  /**
   * 用户列表点击处理
   * @param {Object} e 事件对象
   */
  onUserTap(e) {
    const user = e.currentTarget.dataset.user;
    if (!user || !user.id) return;

    if (user.id === this.data.currentUserId) {
      wx.showToast({ title: '不能与自己聊天', icon: 'none' });
      return;
    }

    const nickname = user.nickname || user.name || `用户${user.id}`;
    wx.navigateTo({
      url: `/pages/chat/private-chat/index?userId=${user.id}&chatType=private&nickname=${encodeURIComponent(nickname)}`
    });
  },

  /**
   * 重试加载用户列表
   */
  onRetryUserList() {
    this.fetchUserList(true);
  },

  groupPrivateMessages(messages) {
    const groups = {};
    const currentUserId = this.data.currentUserId;

    messages.forEach(msg => {
      const chatKey = msg.from_user_id === currentUserId ? msg.to_id : msg.from_user_id;
      if (!groups[chatKey]) {
        groups[chatKey] = {
          targetId: chatKey,
          lastMessage: msg,
          unread: 0
        };
      }
      if (this.isUnreadMessage(msg) && msg.from_user_id !== currentUserId) {
        groups[chatKey].unread++;
      }
    });
    return Object.values(groups);
  },

  isUnreadMessage(message) {
    return message && message.is_read === MSG_READ_STATUS.UNREAD;
  },

  updateTabBarBadge(count) {
    if (count > 0) {
      wx.setTabBarBadge({
        index: 1,
        text: String(count > 99 ? '99+' : count)
      });
    } else {
      wx.removeTabBarBadge({ index: 1 });
    }
  },

  handleNewMessage(message) {
    console.log('收到新消息:', message);

    if (message.msg_type === 'private') {
      const unreadCount = this.data.unreadCount + 1;
      this.setData({ unreadCount });
      this.updateTabBarBadge(unreadCount + this.data.systemUnreadCount);
    } else if (message.msg_type === 'system') {
      const notifications = [message, ...this.data.systemNotifications];
      const systemUnreadCount = this.data.systemUnreadCount + 1;
      this.setData({
        systemNotifications: notifications,
        systemUnreadCount: systemUnreadCount
      });
      this.updateTabBarBadge(this.data.unreadCount + systemUnreadCount);
    }

    wx.showToast({
      title: message.content.substring(0, 20),
      icon: 'none',
      duration: 2
    });
  },

  handleConnectionChange(connected) {
    console.log('WebSocket连接状态:', connected);
  },

  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });

    if (tab === 'users') {
      this.fetchUserList();
    }
  },

  onPrivateChatTap(e) {
    const { targetid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chat/private-chat/index?userId=${targetid}&chatType=private`
    });
  },

  onGroupChatTap(e) {
    const { groupid } = e.currentTarget.dataset;
    const groupName = groupid === 1 ? '采集者交流群' : '核验者交流群';
    wx.navigateTo({
      url: `/pages/chat/group-chat/index?groupId=${groupid}&groupName=${groupName}&chatType=group`
    });
  },

  onNotificationTap(e) {
    const { index } = e.currentTarget.dataset;
    const notification = this.data.systemNotifications[index];
    if (!notification) return;

    const wasUnread = this.isUnreadMessage(notification);

    this.setData({
      systemNotifications: this.data.systemNotifications.map((n, i) =>
        i === index ? { ...n, is_read: MSG_READ_STATUS.READ } : n
      )
    });

    if (wasUnread) {
      messageService.markAsRead([notification.msg_uuid]);
      const newSystemUnread = Math.max(0, this.data.systemUnreadCount - 1);
      this.setData({ systemUnreadCount: newSystemUnread });
      this.updateTabBarBadge(this.data.unreadCount + newSystemUnread);
    }

    wx.showModal({
      title: '系统通知',
      content: notification.content,
      showCancel: false
    });
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onUnload() {
    if (!this.data.currentUserId) return;

    const { _messageListener, _connectionListener } = this.data;
    if (_messageListener) {
      messageService.removeMessageListener(_messageListener);
    }
    if (_connectionListener) {
      messageService.removeConnectionListener(_connectionListener);
    }
    messageService.disconnect();
  }
});