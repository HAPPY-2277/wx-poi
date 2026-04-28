// 个人资料页面（注册页面）
// 接口：POST /api/auth/register
// 请求格式：{ code: string, nickname?: string }
// 返回格式：{ code, message, data: { isNewUser, loginToken }, success }

const { API } = require('../../config/api');

Page({
  data: {
    nickname: ''
  },

  onInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  handleSubmit() {
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }

        this.sendRegisterRequest(loginRes.code);
      },
      fail: () => {
        wx.showToast({
          title: '微信登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  sendRegisterRequest(code) {
    wx.showLoading({ title: '注册中...' });

    wx.request({
      url: API.AUTH.REGISTER,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        code: code,
        nickname: this.data.nickname || ''
      },
      success: (resp) => {
        wx.hideLoading();
        const { success, message, data } = resp.data;

        if (success && data) {
          wx.setStorageSync('loginToken', data.loginToken);

          wx.showToast({
            title: message || '注册成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/home/home'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: message || '注册失败',
            icon: 'none'
          });

          if (message && message.includes('用户已存在')) {
            wx.showModal({
              title: '提示',
              content: '用户已存在，是否去登录？',
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/index/index'
                  });
                }
              }
            });
          }
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