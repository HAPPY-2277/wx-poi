// 主页/用户信息页面
// 接口：GET /api/userinfo（获取用户信息）
// 返回格式：{ code, message, data: { userInfo }, success }

const { API } = require('../../config/api');
const { Request } = require('../../config/request');

Page({
  data: {
    user: {},
    displayNickname: '',
    avatarFallbackSrc: '/images/avatar.png'
  },

  onLoad() {
    this.fetchUserInfo();
  },

  onShow() {
    this.fetchUserInfo();
  },

  async fetchUserInfo() {
    if (!wx.getStorageSync('loginToken')) {
      wx.showToast({ title: '未登录，请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/index/index' });
      return;
    }

    try {
      const resp = await Request.get(API.USER.GET_INFO);

      if (resp.data) {
        const userInfo = resp.data.userInfo || resp.data;
        const nickname = userInfo.nickname || '未设置昵称';
        const displayNickname = this.truncateNickname(nickname, 10);

        wx.setStorageSync('userNickname', nickname);

        this.setData({
          user: userInfo,
          displayNickname: displayNickname
        });
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  },

  truncateNickname(nickname, maxLength) {
    if (!nickname) return '未设置昵称';
    if (nickname.length <= maxLength) return nickname;
    return nickname.substring(0, maxLength) + '...';
  },

  onAvatarError() {
    this.setData({
      'user.avatar': this.data.avatarFallbackSrc
    });
  },

  handleGoToMap() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('loginToken');
          wx.removeStorageSync('userNickname');
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/index/index'
            });
          }, 1000);
        }
      }
    });
  }
});