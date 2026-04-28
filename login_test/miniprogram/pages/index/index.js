// 登录页面
// 接口：POST /api/auth/login
// 请求格式：{ code: string } (由 wx.login() 获取的临时凭证，后端用此换取 openid)
// 返回格式：{ code, message, data: { isNewUser, loginToken }, success }

const { API } = require('../../config/api');

Page({
  handleLogin() {
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          return;
        }

        this.sendLoginRequest(loginRes.code);
      },
      fail: () => {
        wx.showToast({
          title: '微信登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  sendLoginRequest(code) {
    wx.showLoading({ title: '登录中...' });

    wx.request({
      url: API.AUTH.LOGIN,
      method: 'POST',
      data: {
        code: code
      },
      success: (resp) => {
        wx.hideLoading();
        const { success, message, data } = resp.data;

        if (success && data) {
          wx.setStorageSync('loginToken', data.loginToken);

          if (data.isNewUser) {
            wx.showToast({
              title: message || '用户不存在，请先注册',
              icon: 'none'
            });
            wx.navigateTo({
              url: '/pages/profile/profile'
            });
          } else {
            wx.showToast({
              title: message || '登录成功',
              icon: 'success'
            });
            wx.navigateTo({
              url: '/pages/home/home'
            });
          }
        } else {
          wx.showToast({
            title: message || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  }
});