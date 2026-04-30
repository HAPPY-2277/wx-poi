Component({
  data: {
    selected: 0,
    show: true
  },

  attached() {
    this.updateSelected();
  },

  methods: {
    updateSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route;

      let selected = 0;
      if (route.includes('collector')) {
        selected = 1;
      } else if (route.includes('verifier')) {
        selected = 2;
      } else if (route.includes('map')) {
        selected = 3;
      }

      this.setData({ selected });
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index);
      this.setData({ selected: index });

      const routes = [
        '/pages/index/index',
        '/pages/collector/index/index',
        '/pages/verifier/index/index',
        '/pages/map/map'
      ];

      wx.switchTab({ url: routes[index] });
    }
  }
});