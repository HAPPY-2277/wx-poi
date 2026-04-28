// 主页/用户信息页面
// 接口：GET /api/userinfo（获取用户信息）
// 返回格式：{ code, message, data: { userInfo }, success }

const { API } = require('../../config/api');

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

  fetchUserInfo() {
    const loginToken = wx.getStorageSync('loginToken');

    if (!loginToken) {
      wx.showToast({
        title: '未登录，请先登录',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/pages/index/index'
      });
      return;
    }

    wx.request({
      url: API.USER.GET_INFO,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + loginToken,
        'Content-Type': 'application/json'
      },
      success: (resp) => {
        const { success, message, data } = resp.data;

        // 根据 API 文档：以 success 字段作为主要判断依据
        if (success && data) {
          // 兼容 data 直接为用户对象 或 data.userInfo 包装的情况
          const userInfo = data.userInfo || data;
          const nickname = userInfo.nickname || '未设置昵称';
          const displayNickname = this.truncateNickname(nickname, 10);

          this.setData({
            user: userInfo,
            displayNickname: displayNickname
          });
        } else {
          wx.showToast({
            title: message || '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
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

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('loginToken');
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