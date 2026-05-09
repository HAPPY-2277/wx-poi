// app.js
// 应用入口文件，负责全局状态管理和生命周期
const messageService = require('./config/messageService');

App({
  globalData: {
    env: "",
    isLoggedIn: false,
    userRole: '',
    userNickname: '',
    userAvatar: '/images/avatar.png',
    userId: null
  },

  onLaunch: function () {
    this.syncLoginStatus();
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },

  syncLoginStatus() {
    const loginToken = wx.getStorageSync('loginToken');
    const userRole = wx.getStorageSync('userRole');
    const userNickname = wx.getStorageSync('userNickname');
    const userAvatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';
    const userId = wx.getStorageSync('userId');

    this.globalData.isLoggedIn = !!loginToken;
    this.globalData.userRole = userRole || '';
    this.globalData.userNickname = userNickname || '';
    this.globalData.userAvatar = userAvatar;
    this.globalData.userId = userId;

    if (loginToken && userId) {
      messageService.connect(userId);
    }
  },

  updateLoginStatus(data) {
    if (data.loginToken) {
      wx.setStorageSync('loginToken', data.loginToken);
      this.globalData.isLoggedIn = true;
    }
    if (data.role) {
      wx.setStorageSync('userRole', data.role);
      this.globalData.userRole = data.role;
    }
    if (data.nickname) {
      wx.setStorageSync('userNickname', data.nickname);
      this.globalData.userNickname = data.nickname;
    }
    if (data.avatar) {
      wx.setStorageSync('userAvatar', data.avatar);
      this.globalData.userAvatar = data.avatar;
    }
    if (data.userId) {
      wx.setStorageSync('userId', data.userId);
      this.globalData.userId = data.userId;
      messageService.connect(data.userId);
    }
  },

  clearLoginStatus() {
    wx.removeStorageSync('loginToken');
    wx.removeStorageSync('userRole');
    wx.removeStorageSync('userNickname');
    wx.removeStorageSync('userAvatar');
    wx.removeStorageSync('userId');
    this.globalData.isLoggedIn = false;
    this.globalData.userRole = '';
    this.globalData.userNickname = '';
    this.globalData.userAvatar = '/images/avatar.png';
    this.globalData.userId = null;
    messageService.disconnect();
  },

  isLoggedIn() {
    return !!wx.getStorageSync('loginToken');
  },

  getUserRole() {
    return wx.getStorageSync('userRole') || '';
  },

  getUserId() {
    return wx.getStorageSync('userId') || null;
  }
});
