// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

// 引入SDK核心类
var QQMapWX = require('./qqmap-wx-jssdk.js');
 
// 实例化API核心类
var qqmapsdk = new QQMapWX({
  key: 'UWVBZ-RNWKQ-FVZ54-BUNSC-AGBIZ-WVB3Y' // 必填
});

Page({
  data: {
    markers:[], // 声明markers，存储marker数据
    keyword:''
  },

  // 事件触发，调用接口
  nearby_search:function(e){
    var _this = this;
    // 调用接口
    qqmapsdk.search({
      keyword: e.detail.value.keyword,  //搜索关键词
      location: '39.980014,116.313972',  //设置周边搜索中心点
      success: function (res) { //搜索成功后的回调
        var mks = []
        for (var i = 0; i < res.data.length; i++) {
          mks.push({ // 获取返回结果，放到mks数组中
            title: res.data[i].title,
            id: res.data[i].id,
            latitude: res.data[i].location.lat,
            longitude: res.data[i].location.lng,
            iconPath: "/resources/my_marker.png", //图标路径
            width: 20,
            height: 20
          })
        }
        _this.setData({ //设置markers属性，将搜索结果显示在地图中
          markers: mks
        })
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res){
        console.log(res);
      }
    });
  }  
})
