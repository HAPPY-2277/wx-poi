// 个人资料页面（注册页面）
// 接口：POST /api/auth/register
// 请求格式：{ code: string, nickname?: string, role: 'collector'|'verifier' }
// 返回格式：{ code, message, data: { isNewUser, loginToken }, success }

const { API } = require('../../config/api');
const { Request } = require('../../config/request');
const app = getApp();

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

  async sendRegisterRequest(code) {
    wx.showLoading({ title: '注册中...' });

    try {
      const resp = await Request.post(API.AUTH.REGISTER, {
        code: code,
        nickname: this.data.nickname,
        role: this.data.role
      }, false);

      wx.hideLoading();

      if (resp.data) {
        wx.setStorageSync('loginToken', resp.data.loginToken);
        wx.setStorageSync('userNickname', this.data.nickname);
        wx.setStorageSync('userRole', this.data.role);
        if (resp.data.avatar) {
          wx.setStorageSync('userAvatar', resp.data.avatar);
        }
        if (resp.data.userId) {
          wx.setStorageSync('userId', resp.data.userId);
        }

        app.updateLoginStatus({
          loginToken: resp.data.loginToken,
          nickname: this.data.nickname,
          role: this.data.role,
          avatar: resp.data.avatar,
          userId: resp.data.userId
        });

        const roleName = this.data.role === 'collector' ? '采集者' : '核验者';
        wx.showToast({
          title: resp.message || `注册成功，您是${roleName}`,
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
      }
    } catch (err) {
      wx.hideLoading();
      if (err.message && err.message.includes('用户已存在')) {
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
  }
});