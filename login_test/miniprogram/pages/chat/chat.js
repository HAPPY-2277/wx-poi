// 聊天页面
// 功能：聊天功能主入口，包含消息列表、群聊、私聊入口
const app = getApp();
const messageService = require('../../config/messageService');

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
    activeTab: 'private',
    systemNotifications: [],
    privateChats: [],
    currentUserId: null
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
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
    if (userId) {
      messageService.connect(userId);
      messageService.addMessageListener(this.handleNewMessage.bind(this));
      messageService.addConnectionListener(this.handleConnectionChange.bind(this));
    }
  },

  async fetchUnreadCount() {
    if (!this.data.currentUserId) return;

    try {
      const res = await messageService.getUnreadMessages(this.data.currentUserId);
      if (res.success) {
        const unreadCount = res.data.length;
        this.updateTabBarBadge(unreadCount);
        this.setData({
          unreadCount,
          systemNotifications: res.data.filter(m => m.msg_type === 'system'),
          privateChats: this.groupPrivateMessages(res.data.filter(m => m.msg_type === 'private'))
        });
      }
    } catch (err) {
      console.error('获取未读消息失败:', err);
    }
  },

  groupPrivateMessages(messages) {
    const groups = {};
    messages.forEach(msg => {
      const chatKey = msg.from_user_id === this.data.currentUserId ? msg.to_id : msg.from_user_id;
      if (!groups[chatKey]) {
        groups[chatKey] = {
          targetId: chatKey,
          lastMessage: msg,
          unread: 0
        };
      }
      if (!msg.is_read && msg.from_user_id !== this.data.currentUserId) {
        groups[chatKey].unread++;
      }
    });
    return Object.values(groups);
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
      this.updateTabBarBadge(unreadCount);
    } else if (message.msg_type === 'system') {
      const notifications = [message, ...this.data.systemNotifications];
      this.setData({ 
        systemNotifications: notifications,
        unreadCount: this.data.unreadCount + 1
      });
      this.updateTabBarBadge(this.data.unreadCount);
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
    if (notification) {
      wx.showModal({
        title: '系统通知',
        content: notification.content,
        showCancel: false
      });
    }
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onUnload() {
    if (this.data.currentUserId) {
      messageService.removeMessageListener(this.handleNewMessage.bind(this));
      messageService.removeConnectionListener(this.handleConnectionChange.bind(this));
    }
  }
});
