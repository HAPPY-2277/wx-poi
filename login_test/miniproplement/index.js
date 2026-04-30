// 登录页面
const { API } = require('../../config/api');

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

  checkLoginStatus() {
    const loginToken = wx.getStorageSync('loginToken');
    const nickname = wx.getStorageSync('nickname');
    const userRole = wx.getStorageSync('userRole');
    const avatar = wx.getStorageSync('avatar') || '/images/avatar.png';
    
    if (loginToken) {
      this.setData({
        userInfo: {
          logined: true,
          nickname: nickname || '用户',
          avatar: avatar,
          role: userRole || ''
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

  sendLoginRequest(code) {
    wx.showLoading({ title: '登录中...' });

    wx.request({
      url: API.AUTH.LOGIN,
      method: 'POST',
      data: { code: code },
      success: (resp) => {
        wx.hideLoading();
        const { success, message, data } = resp.data;

        if (success && data) {
          wx.setStorageSync('loginToken', data.loginToken);
          
          if (data.nickname) {
            wx.setStorageSync('nickname', data.nickname);
          }
          if (data.role) {
            wx.setStorageSync('userRole', data.role);
          }
          if (data.avatar) {
            wx.setStorageSync('avatar', data.avatar);
          }

          if (data.isNewUser) {
            wx.showToast({ title: message || '请先注册', icon: 'none' });
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/profile/profile' });
            }, 1500);
          } else {
            this.setData({
              userInfo: {
                logined: true,
                nickname: data.nickname || '用户',
                avatar: data.avatar || '/images/avatar.png',
                role: data.role || ''
              }
            });
            
            wx.showToast({ title: message || '登录成功', icon: 'success' });
            setTimeout(() => {
              if (data.role === 'collector') {
                wx.switchTab({ url: '/pages/collector/index' });
              } else if (data.role === 'verifier') {
                wx.switchTab({ url: '/pages/verifier/index' });
              } else {
                wx.switchTab({ url: '/pages/map' });
              }
            }, 1500);
          }
        } else {
          wx.showToast({ title: message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  onAvatarError() {
    this.setData({
      'userInfo.avatar': '/images/avatar.png'
    });
  }
});