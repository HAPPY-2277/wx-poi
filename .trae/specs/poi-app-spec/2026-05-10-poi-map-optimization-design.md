# POI业务模块优化设计规范

## 项目背景

基于现有POI数据采集及核验移动应用项目，优化以下三个功能模块：

1. 地图视图标记点显示功能
2. 地图交互与路径规划功能
3. 核验者发布任务地址提示功能

---

## 一、地图视图标记点显示功能

### 1.1 功能描述

在采集者和核验者的首页界面中，通过地图视图入口进入地图页面后，系统自动在地图上加载并显示相应的任务标记点。

### 1.2 显示规则

| 用户角色 | 显示内容 | 数据来源 |
|---------|---------|---------|
| 采集者 (collector) | 所有待采集任务点 | `API.TASK.COLLECTOR_LIST` |
| 核验者 (verifier) | 所有待审核任务点 | `API.SUBMISSION.PENDING_REVIEW` |

### 1.3 标记点样式设计

使用纯色圆形图标区分不同任务类型，通过微信小程序Canvas自定义绘制：

```javascript
// 标记点配置 - 纯色圆形图标
const MARKER_ICONS = {
  // 待采集任务 - 橙色
  PENDING_COLLECTION: { color: '#FF9500', size: 24 },
  // 待审核任务 - 蓝色
  PENDING_REVIEW: { color: '#007AFF', size: 24 },
  // 高优先级任务 - 红色
  HIGH_PRIORITY: { color: '#FF3B30', size: 28 },
  // 普通优先级 - 橙色
  NORMAL_PRIORITY: { color: '#FF9500', size: 24 },
  // 低优先级 - 灰色
  LOW_PRIORITY: { color: '#8E8E93', size: 24 },
  // 已完成任务 - 绿色
  COMPLETED: { color: '#34C759', size: 24 },
  // 默认图标
  default: { color: '#8E8E93', size: 24 }
};
```

### 1.4 实现要点

1. **地图页面改造**：`map.js` 需要根据用户角色获取不同的数据源
2. **标记点生成**：根据任务状态和优先级生成对应颜色的标记点
3. **视野调整**：自动调整地图视野以显示所有标记点

---

## 二、地图交互与路径规划功能

### 2.1 功能流程

```
用户点击Marker → 弹出操作面板 → 选择"导航" → 计算路径 → 调起微信导航
```

### 2.2 组件结构

**地图页面新增组件：**

```html
<!-- 搜索区域 -->
<view class="search-section">
  <view class="search-box">
    <input 
      class="search-input"
      placeholder="搜索地点"
      value="{{searchKeyword}}"
      bindinput="onKeywordInput"
      bindconfirm="onSearchConfirm"
    />
  </view>
  <!-- 搜索建议列表 -->
  <view class="suggestion-list" wx:if="{{suggestions.length > 0}}">
    <view 
      class="suggestion-item"
      wx:for="{{suggestions}}"
      wx:key="id"
      bindtap="onSelectSuggestion"
      data-item="{{item}}"
    >
      <text class="suggestion-title">{{item.title}}</text>
      <text class="suggestion-address">{{item.address}}</text>
    </view>
  </view>
</view>

<!-- 路径规划结果面板 -->
<view class="route-panel" wx:if="{{routeInfo}}">
  <view class="route-header">
    <text class="route-title">{{routeInfo.name}}</text>
    <text class="route-close" bindtap="closeRoutePanel">×</text>
  </view>
  <view class="route-body">
    <view class="route-item">
      <text class="route-label">距离</text>
      <text class="route-value">{{routeInfo.distance}}</text>
    </view>
    <view class="route-item">
      <text class="route-label">步行约</text>
      <text class="route-value">{{routeInfo.duration}}</text>
    </view>
  </view>
  <button class="nav-btn" bindtap="startNavigation">开始导航</button>
</view>

<!-- 当前Marker信息弹窗 -->
<view class="marker-popup" wx:if="{{selectedMarker}}">
  <view class="popup-title">{{selectedMarker.title}}</view>
  <view class="popup-info">{{selectedMarker.address}}</view>
  <view class="popup-actions">
    <button class="action-btn route-btn" bindtap="calculateRoute">规划路线</button>
    <button class="action-btn" bindtap="goToDetail">查看详情</button>
  </view>
</view>
```

### 2.3 API调用

**搜索建议（关键词提示）：**

```javascript
// 使用腾讯地图suggestion API
qqmapsdk.getSuggestion({
  keyword: keyword,
  location: `${latitude},${longitude}`,
  success: (res) => {
    this.setData({ suggestions: res.data });
  }
});
```

**路径规划（步行路线）：**

```javascript
// 使用腾讯地图direction API
qqmapsdk.direction({
  mode: 'walking',
  from: { latitude: userLat, longitude: userLng },
  to: { latitude: targetLat, longitude: targetLng },
  success: (res) => {
    const route = res.routes[0];
    this.setData({
      routeInfo: {
        polyline: route.polyline,
        distance: route.distance + '米',
        duration: Math.ceil(route.duration / 60) + '分钟'
      }
    });
  }
});
```

### 2.4 导航启动

```javascript
startNavigation() {
  const { routeInfo } = this.data;
  if (routeInfo && routeInfo.destination) {
    // 使用微信内置导航
    wx.openLocation({
      latitude: routeInfo.destination.latitude,
      longitude: routeInfo.destination.longitude,
      name: routeInfo.name,
      scale: 18
    });
  }
}
```

---

## 三、核验者发布任务地址提示功能

### 3.1 功能流程

```
用户输入地址关键词 → 实时显示腾讯地图建议列表 → 用户选择地址 → 自动填充经纬度和完整地址
```

### 3.2 UI改造

**移除内容：**
- 删除"获取位置"按钮
- 删除相关的 `getLocation()` 方法和定位逻辑
- 删除 `reverseGeocode()` 逆地理编码方法

**改造后的地址输入组件：**

```html
<!-- 目标地址（带关键词提示） -->
<view class="form-item {{errors.address ? 'error' : ''}}">
  <view class="form-label">目标地址 <text class="required">*</text></view>
  <view class="address-input-wrapper">
    <input
      class="form-input address-input"
      placeholder="输入或选择地址"
      value="{{formData.address}}"
      bindinput="onAddressInput"
      bindfocus="onAddressFocus"
    />
    <!-- 清除按钮 -->
    <view class="clear-btn" wx:if="{{formData.address}}" bindtap="clearAddress">×</view>
  </view>
  <!-- 地址建议列表 -->
  <view class="suggestion-dropdown" wx:if="{{showAddressSuggestions && addressSuggestions.length > 0}}">
    <view 
      class="suggestion-item"
      wx:for="{{addressSuggestions}}"
      wx:key="id"
      bindtap="onSelectAddress"
      data-item="{{item}}"
    >
      <text class="item-title">{{item.title}}</text>
      <text class="item-address">{{item.address}}</text>
    </view>
  </view>
  <view class="error-tip" wx:if="{{errors.address}}">{{errors.address}}</view>
</view>

<!-- 坐标信息（隐藏显示） -->
<view class="location-hidden">
  <text>纬度: {{formData.latitude || '未选择'}}</text>
  <text>经度: {{formData.longitude || '未选择'}}</text>
</view>
```

### 3.3 状态管理

```javascript
data: {
  // 原有字段...
  showAddressSuggestions: false,    // 是否显示地址建议
  addressSuggestions: [],           // 地址建议列表
  suggestionDebounceTimer: null,    // 防抖定时器
  // 移除 gettingLocation 字段
}
```

### 3.4 关键方法

**地址输入处理（带防抖）：**

```javascript
onAddressInput(e) {
  const keyword = e.detail.value;
  this.setData({ 
    'formData.address': keyword,
    'errors.address': ''
  });
  
  // 清除之前的定时器
  if (this.suggestionDebounceTimer) {
    clearTimeout(this.suggestionDebounceTimer);
  }
  
  if (keyword.length < 2) {
    this.setData({ showAddressSuggestions: false });
    return;
  }
  
  // 防抖搜索（300ms）
  this.suggestionDebounceTimer = setTimeout(() => {
    this.searchAddressSuggestions(keyword);
  }, 300);
}

searchAddressSuggestions(keyword) {
  qqmapsdk.getSuggestion({
    keyword: keyword,
    success: (res) => {
      this.setData({
        addressSuggestions: res.data || [],
        showAddressSuggestions: true
      });
    }
  });
}
```

**选择地址建议：**

```javascript
onSelectAddress(e) {
  const item = e.currentTarget.dataset.item;
  this.setData({
    'formData.address': item.title + ' ' + item.address,
    'formData.latitude': item.location.lat,
    'formData.longitude': item.location.lng,
    showAddressSuggestions: false,
    addressSuggestions: []
  });
}
```

---

## 四、样式规范

### 4.1 统一设计语言

遵循现有绿色主题配色系统：

```css
/* 主色调 */
--primary-start: #07c160;
--primary-end: #10b981;

/* 卡片背景 */
--gradient-card: linear-gradient(135deg, #ffffff 0%, #f0fff4 100%);

/* 阴影 */
--shadow-primary: 0 8rpx 24rpx rgba(7, 193, 96, 0.25);

/* 圆角 */
--radius-lg: 24rpx;
--radius-xl: 32rpx;
```

### 4.2 新增样式

```css
/* 路径规划面板 */
.route-panel {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: calc(220rpx + env(safe-area-inset-bottom));
  background: var(--gradient-card);
  border-radius: var(--radius-lg);
  padding: 30rpx;
  box-shadow: var(--shadow-primary);
  z-index: 200;
}

/* 导航按钮 */
.nav-btn {
  width: 100%;
  height: 88rpx;
  background: var(--gradient-primary);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: bold;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
}

/* 搜索建议列表 */
.suggestion-list,
.suggestion-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 100;
}

/* Marker弹窗 */
.marker-popup {
  position: fixed;
  left: 30rpx;
  right: 30rpx;
  bottom: calc(280rpx + env(safe-area-inset-bottom));
  background: var(--gradient-card);
  border-radius: var(--radius-lg);
  padding: 30rpx;
  box-shadow: var(--shadow-primary);
  z-index: 150;
}
```

---

## 五、文件修改清单

### 5.1 需要修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `pages/map/map.js` | 添加路径规划、搜索建议、Marker点击处理 |
| `pages/map/map.wxml` | 添加路径规划面板、搜索建议列表 |
| `pages/map/map.wxss` | 添加路径规划面板、弹窗样式 |
| `pages/verifier/publish-task/index.js` | 添加地址关键词提示，移除定位功能 |
| `pages/verifier/publish-task/index.wxml` | 改造地址输入组件 |
| `pages/verifier/publish-task/index.wxss` | 添加地址建议列表样式 |

### 5.2 新增文件

| 文件路径 | 用途 |
|---------|------|
| `utils/qqmap-wx-jssdk.js` | 腾讯地图SDK（已存在） |

---

## 六、技术实现要点

### 6.1 地图SDK配置

```javascript
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk = new QQMapWX({
  key: TENCENT_MAP_KEY
});
```

### 6.2 权限处理

```javascript
// 检查定位权限
wx.getSetting({
  success: (res) => {
    if (!res.authSetting['scope.userLocation']) {
      wx.authorize({ scope: 'scope.userLocation' });
    }
  }
});
```

### 6.3 错误处理

| 场景 | 处理方式 |
|-----|---------|
| 定位失败 | 使用缓存位置或默认位置，显示提示 |
| 搜索无结果 | 显示"未找到相关地点"提示 |
| 路径规划失败 | 显示错误提示，允许用户直接导航 |
| 网络请求失败 | 显示重试按钮，记录错误日志 |

---

## 七、测试要点

### 7.1 功能测试

1. ✅ 采集者登录后进入地图页面，显示待采集任务点
2. ✅ 核验者登录后进入地图页面，显示待审核任务点
3. ✅ 点击Marker显示任务信息弹窗
4. ✅ 搜索关键词显示建议列表
5. ✅ 选择建议地址后自动填充经纬度
6. ✅ 路径规划计算正确显示距离和时间
7. ✅ 点击"导航"按钮正确调起微信导航

### 7.2 兼容性测试

1. ✅ 不同屏幕尺寸下的布局适配
2. ✅ iOS/Android 微信小程序兼容性
3. ✅ 弱网环境下的功能降级

---

## 八、版本约束

- 微信小程序基础库版本 ≥ 2.8.0
- 腾讯地图SDK版本 ≥ 1.2
- 不破坏现有功能，保持向后兼容
