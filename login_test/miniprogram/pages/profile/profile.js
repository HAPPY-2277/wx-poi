// 个人资料页面（注册页面）
// 接口：POST /api/auth/register
// 请求格式：{ code: string, nickname?: string, role: 'collector'|'verifier' }
// 返回格式：{ code, message, data: { isNewUser, loginToken }, success }

const { API } = require('../../config/api');

Page({
  data: {
    nickname: '',
    role: '',
    showRolePicker: false,
    roles: [
      { value: 'collector', label: '采集者', desc: '负责实地采集POI信息' },
      { value: 'verifier', label: '核验者', desc: '负责审核POI数据' }
    ]
  },

  onInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  toggleRolePicker() {
    this.setData({
      showRolePicker: !this.data.showRolePicker
    });
  },

  onSelectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({
      role: role,
      showRolePicker: false
    });
  },

  preventBubble() {},

  handleSubmit() {
    if (!this.data.nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    if (!this.data.role) {
      wx.showToast({ title: '请选择您的身份', icon: 'none' });
      return;
    }

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
        nickname: this.data.nickname,
        role: this.data.role
      },
      success: (resp) => {
        wx.hideLoading();
        const { success, message, data } = resp.data;

        if (success && data) {
          wx.setStorageSync('loginToken', data.loginToken);
          wx.setStorageSync('userNickname', this.data.nickname);
          wx.setStorageSync('userRole', this.data.role);

          const roleName = this.data.role === 'collector' ? '采集者' : '核验者';
          wx.showToast({
            title: message || `注册成功，您是${roleName}`,
            icon: 'success'
          });

          setTimeout(() => {
            if (this.data.role === 'collector') {
              wx.switchTab({
                url: '/pages/collector/index/index'
              });
            } else {
              wx.switchTab({
                url: '/pages/verifier/index/index'
              });
            }
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