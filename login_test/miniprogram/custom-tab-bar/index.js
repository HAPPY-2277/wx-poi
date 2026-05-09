Component({
  data: {
    selected: 0,
    show: true
  },

  attached() {
    this.updateSelected();
  },

  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },

  methods: {
    updateSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route;

      let selected = 0;
      if (route.includes('map')) {
        selected = 0;
      } else if (route.includes('chat')) {
        selected = 1;
      } else if (route.includes('profile') || route.includes('index')) {
        selected = 2;
      }

      this.setData({ selected });
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index);
      this.setData({ selected: index });

      if (index === 1) {
        // 聊天页
        wx.switchTab({ url: '/pages/chat/chat' });
      } else if (index === 2) {
        // 个人页
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        // 地图页（index === 0）
        wx.switchTab({ url: '/pages/map/map' });
      }
    }
  }
});