// 登录/个人页面
const { API } = require('../../config/api');
const { Request } = require('../../config/request');
const app = getApp();

Page({
  data: {
    userInfo: {
      logined: false,
      nickname: '',
      avatar: '/images/avatar.png',
      role: ''
    }
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    // 直接从 Storage 读取，登录状态只依赖 loginToken
    const loginToken = wx.getStorageSync('loginToken');
    const nickname = wx.getStorageSync('userNickname');
    const userRole = wx.getStorageSync('userRole');
    const avatar = wx.getStorageSync('userAvatar') || '/images/avatar.png';
    
    if (loginToken) {
      this.setData({
        userInfo: {
          logined: true,
          nickname: nickname || '用户',
          avatar: avatar,
          role: userRole || ''
        }
      });
    } else {
      this.setData({
        userInfo: {
          logined: false,
          nickname: '',
          avatar: '/images/avatar.png',
          role: ''
        }
      });
    }
  },

  handleLogin() {
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }
        this.sendLoginRequest(loginRes.code);
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
      }
    });
  },

  async sendLoginRequest(code) {
    wx.showLoading({ title: '登录中...' });

    try {
      const res = await Request.post(API.AUTH.LOGIN, { code: code }, false);
      wx.hideLoading();

      if (res.data) {
        wx.setStorageSync('loginToken', res.data.loginToken);
        
        if (res.data.nickname) {
          wx.setStorageSync('userNickname', res.data.nickname);
        }
        if (res.data.role) {
          wx.setStorageSync('userRole', res.data.role);
        }
        if (res.data.avatar) {
          wx.setStorageSync('userAvatar', res.data.avatar);
        }
        if (res.data.userId) {
          wx.setStorageSync('userId', res.data.userId);
        }

        app.updateLoginStatus({
          loginToken: res.data.loginToken,
          nickname: res.data.nickname,
          role: res.data.role,
          avatar: res.data.avatar,
          userId: res.data.userId
        });

        if (res.data.isNewUser) {
          wx.showToast({ title: res.message || '请先注册', icon: 'none' });
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/profile/profile' });
          }, 1500);
        } else {
          this.setData({
            userInfo: {
              logined: true,
              nickname: res.data.nickname || '用户',
              avatar: res.data.avatar || '/images/avatar.png',
              role: res.data.role || ''
            }
          });
          
          wx.showToast({ title: res.message || '登录成功', icon: 'success' });
        }
      }
    } catch (err) {
      wx.hideLoading();
      if (err.message) {
        wx.showToast({ title: err.message || '登录失败', icon: 'none' });
      }
    }
  },

  // 跳转功能页面
  goToFunction() {
    const loginToken = wx.getStorageSync('loginToken');
    const userRole = wx.getStorageSync('userRole');

    if (!loginToken) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (userRole === 'collector') {
      // 采集者跳转采集页
      wx.navigateTo({ url: '/pages/collector/index/index' });
    } else if (userRole === 'verifier') {
      // 核验者跳转核验页
      wx.navigateTo({ url: '/pages/verifier/index/index' });
    } else {
      wx.showToast({ title: '用户角色异常', icon: 'none' });
    }
  },

  onMenuTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'settings') {
      wx.showToast({ title: '设置功能开发中', icon: 'none' });
    } else if (type === 'about') {
      wx.showModal({
        title: '关于我们',
        content: 'POI采集核验系统 v1.0.0\n高效采集 · 精准核验 · 智能管理',
        showCancel: false
      });
    }
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus();
          this.setData({
            userInfo: {
              logined: false,
              nickname: '',
              avatar: '/images/avatar.png',
              role: ''
            }
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  onAvatarError() {
    this.setData({
      'userInfo.avatar': '/images/avatar.png'
    });
  }
});