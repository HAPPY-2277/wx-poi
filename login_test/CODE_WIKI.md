# POI采集核验小程序 - Code Wiki

## 1. 项目概述

### 1.1 项目简介

本项目是一个基于微信小程序的POI（Point of Interest，兴趣点）采集与核验系统，采用微信云开发技术栈实现。系统支持多角色用户（采集者和核验者），提供完整的POI信息采集、任务管理、数据核验等功能。

### 1.2 技术栈

- **前端框架**：微信小程序原生框架
- **后端服务**：微信云开发（云函数、数据库、文件存储）
- **地图服务**：腾讯位置服务（QQMap）
- **UI组件**：自定义组件 + 原生组件
- **编译工具**：微信开发者工具

## 2. 项目架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                    微信小程序客户端                     │
├─────────────────────────────────────────────────────┤
│  登录模块  │  采集者模块  │  核验者模块  │  地图模块   │
├─────────────────────────────────────────────────────┤
│                    配置与工具层                       │
│         (API配置、请求封装、工具类)                    │
├─────────────────────────────────────────────────────┤
│                   自定义组件层                        │
│            (TabBar、云提示组件)                       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   微信云开发后端                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   云函数      │  │   数据库      │  │  文件存储  │ │
│  │ quickstart   │  │   sales     │  │           │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   业务后端服务器                       │
│         http://10.197.211.192:8080                   │
│   (认证、用户、采集、核验等RESTful API)               │
└─────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```
app.js (应用入口)
    │
    ├── config/
    │   ├── api.js (API配置)
    │   └── request.js (请求工具)
    │
    ├── custom-tab-bar/ (自定义导航栏)
    │
    ├── components/
    │   └── cloudTipModal/ (云提示组件)
    │
    └── pages/
        ├── index/ (登录页)
        │   └── 依赖: config/api.js, config/request.js
        │
        ├── profile/ (注册页)
        │   └── 依赖: config/api.js
        │
        ├── collector/
        │   ├── index/ (采集者首页)
        │   ├── collect/ (新建采集表单)
        │   ├── task-list/ (任务列表)
        │   └── my-poi/ (我的采集)
        │       └── 依赖: config/api.js
        │
        ├── verifier/
        │   ├── index/ (核验者首页)
        │   ├── verify-list/ (审核列表)
        │   ├── verify-detail/ (审核详情)
        │   └── my-review/ (我的审核)
        │       └── 依赖: config/api.js
        │
        ├── map/ (地图页)
        │   └── 依赖: utils/qqmap-wx-jssdk.js
        │
        ├── home/ (首页)
        │
        └── example/ (示例页)
```

## 3. 目录结构

```
login_test/
├── cloudfunctions/                  # 云函数目录
│   └── quickstartFunctions/        # 示例云函数
│       ├── index.js                # 云函数主入口
│       ├── package.json            # 依赖配置
│       └── config.json             # 云函数配置
│
├── miniprogram/                    # 小程序主目录
│   ├── app.js                      # 应用入口
│   ├── app.json                    # 应用配置
│   ├── app.wxss                    # 全局样式
│   ├── sitemap.json                # sitemap配置
│   ├── envList.js                  # 环境列表
│   │
│   ├── config/                     # 配置目录
│   │   ├── api.js                 # API接口配置
│   │   └── request.js             # 请求封装工具
│   │
│   ├── utils/                      # 工具目录
│   │   └── qqmap-wx-jssdk.js      # 腾讯地图SDK
│   │
│   ├── components/                 # 组件目录
│   │   └── cloudTipModal/          # 云提示组件
│   │
│   ├── custom-tab-bar/             # 自定义导航栏
│   │
│   ├── images/                     # 图片资源
│   │   ├── icons/                 # 图标资源
│   │   └── *.png/svg              # 其他图片
│   │
│   └── pages/                     # 页面目录
│       ├── index/                  # 登录页
│       ├── profile/                # 个人资料/注册页
│       ├── home/                   # 首页
│       ├── map/                    # 地图页
│       ├── example/                # 示例页
│       ├── collector/              # 采集者模块
│       │   ├── index/             # 采集者首页
│       │   ├── collect/            # 新建采集表单
│       │   ├── task-list/          # 任务列表
│       │   └── my-poi/             # 我的采集
│       └── verifier/               # 核验者模块
│           ├── index/              # 核验者首页
│           ├── verify-list/        # 审核列表
│           ├── verify-detail/      # 审核详情
│           └── my-review/           # 我的审核
│
├── project.config.json             # 项目配置
├── project.private.config.json     # 私有配置
├── uploadCloudFunction.sh          # 云函数上传脚本
└── README.md                       # 项目说明
```

## 4. 主要模块说明

### 4.1 应用入口模块

**文件路径**: `miniprogram/app.js`

**功能描述**: 小程序应用的主入口文件，负责初始化云开发和定义全局数据。

**关键代码解析**:

```javascript
App({
  onLaunch: function () {
    // 初始化全局数据
    this.globalData = {
      env: "",  // 云环境ID，需在微信开发者工具中配置
    };
    
    // 检查云开发能力是否可用
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      // 初始化云开发
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,  // 记录用户访问
      });
    }
  },
});
```

**核心要点**:
- `env` 参数指定云环境ID，可通过微信开发者工具右上角的云开发按钮获取
- `traceUser: true` 用于在云开发控制台追踪用户访问记录
- 需要微信基础库 2.2.3 或以上版本才支持云开发

### 4.2 应用配置模块

**文件路径**: `miniprogram/app.json`

**功能描述**: 定义小程序的全局配置，包括页面路由、窗口样式、TabBar等。

**关键配置说明**:

```json
{
  // 页面路由配置
  "pages": [
    "pages/index/index",      // 登录页
    "pages/profile/profile",  // 注册页
    "pages/collector/index/index",  // 采集者首页
    // ... 其他页面
  ],
  
  // 窗口样式配置
  "window": {
    "backgroundColor": "#F6F6F6",
    "navigationBarTitleText": "POI采集核验"
  },
  
  // TabBar配置（自定义）
  "tabBar": {
    "custom": true,  // 使用自定义TabBar
    "list": [
      { "pagePath": "pages/index/index", "text": "登录" },
      { "pagePath": "pages/collector/index/index", "text": "采集" },
      { "pagePath": "pages/verifier/index/index", "text": "核验" },
      { "pagePath": "pages/map/map", "text": "地图" }
    ]
  },
  
  // 权限配置
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于POI定位和导航"
    }
  },
  
  // 位置信息配置
  "requiredPrivateInfos": ["getLocation"]
}
```

### 4.3 API配置模块

**文件路径**: `miniprogram/config/api.js`

**功能描述**: 统一管理所有后端API接口地址，采用模块化分类设计。

**API模块分类**:

```javascript
// 1. 认证模块 (AUTH)
LOGIN: '/api/auth/login',           // 用户登录
REGISTER: '/api/auth/register',     // 用户注册

// 2. 用户模块 (USER)
GET_INFO: '/api/userinfo',          // 获取用户信息
UPDATE: '/api/updateUser',          // 更新用户信息

// 3. 采集者模块 (COLLECTOR)
GET_STATS: '/api/collector/stats',  // 获取统计数据
CREATE_POI: '/api/collector/poi',   // 创建POI
GET_MY_POI_LIST: '/api/collector/poi/list',  // 我的POI列表
GET_TASKS: '/api/collector/tasks',  // 待采集任务列表

// 4. 核验者模块 (VERIFIER)
GET_STATS: '/api/verifier/stats',   // 获取统计数据
PENDING_LIST: '/api/verifier/pending-list',  // 待核验列表
VERIFY: '/api/verifier/verify',     // 提交核验结果
MY_REVIEWS: '/api/verifier/my-reviews',     // 我的审核记录
```

**后端服务地址**: `http://10.197.211.192:8080`

### 4.4 请求工具模块

**文件路径**: `miniprogram/config/request.js`

**功能描述**: 封装统一的请求方法，处理认证Token、错误提示等通用逻辑。

**核心方法说明**:

```javascript
const Request = {
  // 统一请求方法
  request(options) {
    // 1. 获取请求配置
    const { url, method = 'GET', data = {}, needAuth = true } = options;
    
    // 2. 构建请求头
    const header = { 'Content-Type': 'application/json' };
    
    // 3. 添加认证Token（如果需要）
    if (needAuth) {
      const loginToken = wx.getStorageSync('loginToken');
      if (loginToken) {
        header['Authorization'] = 'Bearer ' + loginToken;
      }
    }
    
    // 4. 发起请求
    return new Promise((resolve, reject) => {
      wx.request({
        url, method, data, header,
        success: (res) => {
          // 5. 处理响应
          if (res.data.success) {
            resolve(res.data);
          } else {
            // 显示错误提示
            wx.showToast({ title: res.data.message, icon: 'none' });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络请求失败', icon: 'none' });
          reject(err);
        }
      });
    });
  },
  
  // GET请求
  get(url, data, needAuth = true) {
    return this.request({ url, method: 'GET', data, needAuth });
  },
  
  // POST请求
  post(url, data, needAuth = true) {
    return this.request({ url, method: 'POST', data, needAuth });
  },
  
  // 登录请求（无需认证）
  login(openid, code) {
    return this.post(API.AUTH.LOGIN, { openid, code }, false);
  }
};
```

**设计模式**:
- 采用Promise封装，支持async/await语法
- 自动处理认证Token
- 统一错误处理和提示

### 4.5 登录模块

**文件路径**: `miniprogram/pages/index/index.js`

**功能描述**: 处理用户登录流程，支持新用户自动跳转注册。

**登录流程**:

```
1. 用户点击登录按钮
   ↓
2. 调用 wx.login() 获取临时凭证 code
   ↓
3. 发送 POST 请求到 /api/auth/login
   ↓
4. 判断用户类型:
   ├── 新用户 (isNewUser: true) → 跳转注册页面
   └── 老用户 (isNewUser: false) → 根据角色跳转对应首页
```

**核心代码解析**:

```javascript
handleLogin() {
  // 步骤1: 获取微信登录凭证
  wx.login({
    success: (loginRes) => {
      if (!loginRes.code) {
        wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        return;
      }
      // 步骤2: 发送登录请求
      this.sendLoginRequest(loginRes.code);
    }
  });
}

sendLoginRequest(code) {
  wx.request({
    url: API.AUTH.LOGIN,
    method: 'POST',
    data: { code: code },
    success: (res) => {
      const { success, message, data } = res.data;
      
      if (success && data) {
        // 保存登录Token
        wx.setStorageSync('loginToken', data.loginToken);
        wx.setStorageSync('userNickname', data.nickname);
        wx.setStorageSync('userRole', data.role);
        
        // 根据用户角色跳转
        if (data.isNewUser) {
          wx.navigateTo({ url: '/pages/profile/profile' });
        } else {
          if (data.role === 'collector') {
            wx.switchTab({ url: '/pages/collector/index/index' });
          } else if (data.role === 'verifier') {
            wx.switchTab({ url: '/pages/verifier/index/index' });
          }
        }
      }
    }
  });
}
```

### 4.6 注册模块

**文件路径**: `miniprogram/pages/profile/profile.js`

**功能描述**: 新用户注册页面，选择用户角色（采集者/核验者）。

**角色说明**:
- **采集者 (collector)**: 负责实地采集POI信息
- **核验者 (verifier)**: 负责审核POI数据的准确性和完整性

**核心代码解析**:

```javascript
handleSubmit() {
  // 1. 表单验证
  if (!this.data.nickname) {
    wx.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  
  if (!this.data.role) {
    wx.showToast({ title: '请选择您的身份', icon: 'none' });
    return;
  }
  
  // 2. 获取登录凭证
  wx.login({
    success: (loginRes) => {
      this.sendRegisterRequest(loginRes.code);
    }
  });
}

sendRegisterRequest(code) {
  wx.request({
    url: API.AUTH.REGISTER,
    method: 'POST',
    data: {
      code: code,
      nickname: this.data.nickname,
      role: this.data.role
    },
    success: (resp) => {
      if (resp.data.success) {
        // 保存用户信息
        wx.setStorageSync('loginToken', resp.data.data.loginToken);
        wx.setStorageSync('userNickname', this.data.nickname);
        wx.setStorageSync('userRole', this.data.role);
        
        // 跳转对应首页
        if (this.data.role === 'collector') {
          wx.switchTab({ url: '/pages/collector/index/index' });
        } else {
          wx.switchTab({ url: '/pages/verifier/index/index' });
        }
      }
    }
  });
}
```

### 4.7 采集者模块

#### 4.7.1 采集者首页

**文件路径**: `miniprogram/pages/collector/index/index.js`

**功能描述**: 展示采集者角色的统计数据和功能入口。

**功能列表**:
- 新建采集：创建新的POI信息
- 任务列表：查看待采集任务
- 我的采集：查看已提交的POI
- 地图视图：查看采集点分布

**核心代码解析**:

```javascript
Page({
  data: {
    // 统计数据
    stats: {
      newTasks: 0,       // 新任务数
      pendingTasks: 0,   // 待处理任务数
      myCollections: 0   // 我的采集数
    },
    
    // 功能入口列表
    functionList: [
      { id: 'new', title: '新建采集', path: '/pages/collector/collect/index' },
      { id: 'tasks', title: '任务列表', path: '/pages/collector/task-list/index', badge: 0 },
      { id: 'my', title: '我的采集', path: '/pages/collector/my-poi/index' },
      { id: 'map', title: '地图视图', path: '/pages/map/map' }
    ]
  },
  
  onShow() {
    // 每次显示页面时刷新统计数据
    this.fetchStats();
  },
  
  fetchStats() {
    wx.request({
      url: API.COLLECTOR.GET_STATS,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('loginToken')
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({ stats: res.data.data });
          // 更新任务列表角标
          this.updateTaskBadge();
        }
      }
    });
  },
  
  onFunctionTap(e) {
    const { path, id } = e.currentTarget.dataset;
    
    // 地图视图直接跳转
    if (id === 'map') {
      wx.navigateTo({ url: path });
      return;
    }
    
    wx.navigateTo({ url: path });
  }
});
```

#### 4.7.2 新建采集表单

**文件路径**: `miniprogram/pages/collector/collect/index.js`

**功能描述**: 提供完整的POI信息采集表单，包括名称、分类、地址、位置、图片等。

**POI分类选项**:

```javascript
const CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍜' },
  { id: 'shopping', name: '购物', icon: '🛒' },
  { id: 'life', name: '生活服务', icon: '🏪' },
  { id: 'entertainment', name: '休闲娱乐', icon: '🎮' },
  { id: 'hotel', name: '酒店住宿', icon: '🏨' },
  { id: 'tourism', name: '旅游景点', icon: '🏞️' },
  { id: 'medical', name: '医疗健康', icon: '🏥' },
  { id: 'education', name: '教育培训', icon: '🏫' },
  { id: 'transport', name: '交通设施', icon: '🚌' },
  { id: 'other', name: '其他', icon: '📍' }
];
```

**表单数据结构**:

```javascript
formData: {
  name: '',           // POI名称（必填）
  category: '',        // 分类ID（必填）
  address: '',         // 详细地址（必填）
  description: '',     // 描述信息
  phone: '',           // 联系电话
  businessHours: '',   // 营业时间
  latitude: '',        // GPS纬度（必填）
  longitude: '',       // GPS经度（必填）
  photos: []           // 图片列表（必填）
}
```

**表单验证规则**:

```javascript
validateForm() {
  const { name, category, address, latitude, longitude } = this.data.formData;
  const errors = {};
  
  if (!name || name.trim() === '') {
    errors.name = '请输入POI名称';
  }
  if (!category) {
    errors.category = '请选择POI分类';
  }
  if (!address || address.trim() === '') {
    errors.address = '请输入详细地址';
  }
  if (!latitude || !longitude) {
    errors.location = '请获取GPS位置';
  }
  if (this.data.photoList.length === 0) {
    errors.photos = '请至少上传一张图片';
  }
  
  return Object.keys(errors).length === 0;
}
```

**提交流程**:

```javascript
submitForm() {
  // 1. 表单验证
  if (!this.validateForm()) {
    wx.showToast({ title: '请完善表单信息', icon: 'none' });
    return;
  }
  
  // 2. 上传图片
  this.uploadImages().then((photoUrls) => {
    // 3. 提交表单数据
    return this.submitData(photoUrls);
  }).then(() => {
    wx.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => { wx.navigateBack(); }, 1500);
  }).catch((err) => {
    wx.showToast({ title: '提交失败，请重试', icon: 'none' });
  });
}

uploadImages() {
  // 使用 wx.uploadFile 上传图片到服务器
  // 返回上传后的图片URL列表
}

submitData(photoUrls) {
  // 调用 API.COLLECTOR.CREATE_POI 提交POI数据
}
```

#### 4.7.3 任务列表页

**文件路径**: `miniprogram/pages/collector/task-list/index.js`

**功能描述**: 展示待采集的任务列表，支持按状态筛选和分页加载。

**任务状态枚举**:

```javascript
const TASK_STATUS = {
  PENDING: 'pending',        // 待采集
  IN_PROGRESS: 'in_progress', // 采集中
  COMPLETED: 'completed',    // 已完成
  EXPIRED: 'expired'        // 已过期
};
```

**状态映射**:

```javascript
const STATUS_MAP = {
  pending: { label: '待采集', color: '#f59e0b', icon: '⏰' },
  in_progress: { label: '采集中', color: '#3b82f6', icon: '🔄' },
  completed: { label: '已完成', color: '#10b981', icon: '✓' },
  expired: { label: '已过期', color: '#999999', icon: '❌' }
};
```

**筛选和分页**:

```javascript
data: {
  filterStatus: 'all',  // 筛选状态
  page: 1,              // 当前页码
  pageSize: 10,         // 每页数量
  hasMore: true         // 是否有更多数据
},

onReachBottom() {
  // 上拉加载更多
  if (this.data.hasMore && !this.data.loading) {
    this.loadTasks(false);
  }
}
```

#### 4.7.4 我的采集页

**文件路径**: `miniprogram/pages/collector/my-poi/index.js`

**功能描述**: 展示用户已提交的POI列表，支持按状态筛选。

**POI状态枚举**:

```javascript
const POI_STATUS = {
  PENDING: 'pending',    // 待审核
  APPROVED: 'approved',  // 已通过
  REJECTED: 'rejected',  // 已拒绝
  DRAFT: 'draft'        // 草稿
};
```

**状态映射**:

```javascript
const STATUS_MAP = {
  pending: { label: '待审核', color: '#f59e0b', icon: '⏰', bgColor: '#fffbeb' },
  approved: { label: '已通过', color: '#10b981', icon: '✓', bgColor: '#ecfdf5' },
  rejected: { label: '已拒绝', color: '#ef4444', icon: '✗', bgColor: '#fef2f2' },
  draft: { label: '草稿', color: '#999999', icon: '📝', bgColor: '#f5f5f5' }
};
```

**功能支持**:
- 列表筛选：全部/待审核/已通过/已拒绝/草稿
- 下拉刷新
- 上拉加载更多
- 草稿删除

### 4.8 核验者模块

#### 4.8.1 核验者首页

**文件路径**: `miniprogram/pages/verifier/index/index.js`

**功能描述**: 展示核验者角色的统计数据和功能入口。

**统计数据**:

```javascript
stats: {
  pendingCount: 0,      // 待审核数
  todayVerified: 0,    // 今日审核数
  approvalRate: 0      // 通过率
}
```

**功能列表**:
- 审核列表：查看待审核POI
- 我的审核：查看审核记录
- 地图视图：查看POI分布

#### 4.8.2 审核列表页

**文件路径**: `miniprogram/pages/verifier/verify-list/index.js`

**功能描述**: 展示待核验的POI列表，支持分类筛选和日期排序。

**MVVM架构实现**:

```javascript
Page({
  data: {
    poiList: [],           // POI列表数据
    filters: {
      category: 'all',     // 分类筛选
      sortBy: 'date-desc'  // 排序方式
    },
    pageNum: 1,
    pageSize: 10
  },
  
  onLoad() {
    this.fetchPOIList();
  },
  
  fetchPOIList() {
    wx.request({
      url: API.VERIFIER.PENDING_LIST,
      method: 'GET',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        category: this.data.filters.category,
        sortBy: this.data.filters.sortBy
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            poiList: res.data.data.list || [],
            hasMore: res.data.data.hasMore || false
          });
        } else {
          // 使用模拟数据（接口未实现时）
          this.setMockPOIList();
        }
      }
    });
  }
});
```

**筛选选项**:

```javascript
categoryOptions: [
  { id: 'all', name: '全部' },
  { id: 'scenic', name: '景点' },
  { id: 'restaurant', name: '餐饮' },
  { id: 'hotel', name: '酒店' },
  { id: 'shop', name: '购物' }
],

sortOptions: [
  { id: 'date-desc', name: '最新提交' },
  { id: 'date-asc', name: '最早提交' },
  { id: 'priority', name: '优先级' }
]
```

#### 4.8.3 审核详情页

**文件路径**: `miniprogram/pages/verifier/verify-detail/index.js`

**功能描述**: 展示POI详细信息，支持核验操作（通过/拒绝/不确定）。

**审核操作选项**:

```javascript
actionOptions: [
  { id: 'approved', label: '通过', icon: '✓', color: '#67c23a' },
  { id: 'rejected', label: '拒绝', icon: '✗', color: '#f56c6c' },
  { id: 'uncertain', label: '不确定', icon: '?', color: '#e6a23c' }
]
```

**提交核验流程**:

```javascript
submitVerification() {
  // 1. 验证操作选择
  if (!this.data.selectedAction) {
    wx.showToast({ title: '请选择审核操作', icon: 'none' });
    return;
  }
  
  // 2. 验证拒绝原因（如果选择拒绝）
  if (this.data.selectedAction === 'rejected' && !this.data.errorDescription.trim()) {
    wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
    return;
  }
  
  // 3. 确认提交
  wx.showModal({
    title: '确认提交',
    content: '确定要提交审核结果吗？',
    success: (res) => {
      if (res.confirm) {
        this.doSubmitVerification();
      }
    }
  });
},

doSubmitVerification() {
  const requestData = {
    poiId: this.data.poiDetail.id,
    result: this.data.selectedAction,
    errorDescription: this.data.errorDescription.trim() || ''
  };
  
  wx.request({
    url: API.VERIFIER.VERIFY,
    method: 'POST',
    data: requestData,
    success: (res) => {
      if (res.data.success) {
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      }
    }
  });
}
```

#### 4.8.4 我的审核页

**文件路径**: `miniprogram/pages/verifier/my-review/index.js`

**功能描述**: 展示核验者已完成的审核记录，包含统计数据和审核列表。

**统计数据**:

```javascript
statistics: {
  totalReviewed: 0,      // 总审核数
  approvedCount: 0,      // 通过数
  rejectedCount: 0,      // 拒绝数
  uncertainCount: 0      // 不确定数
},

// 预先计算的百分比
approvedRate: '0',
rejectedRate: '0',
uncertainRate: '0'
```

**通过率计算**:

```javascript
updateRates() {
  const { totalReviewed, approvedCount, rejectedCount, uncertainCount } = this.data.statistics;
  
  if (totalReviewed > 0) {
    const approvedRate = ((approvedCount / totalReviewed) * 100).toFixed(1);
    const rejectedRate = ((rejectedCount / totalReviewed) * 100).toFixed(1);
    const uncertainRate = ((uncertainCount / totalReviewed) * 100).toFixed(1);
    
    this.setData({
      approvedRate,
      rejectedRate,
      uncertainRate
    });
  }
}
```

### 4.9 地图模块

**文件路径**: `miniprogram/pages/map/map.js`

**功能描述**: 展示地图、搜索周边地点、显示当前位置。

**依赖库**: `miniprogram/utils/qqmap-wx-jssdk.js` (腾讯位置服务SDK)

**初始化配置**:

```javascript
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');

var qqmapsdk = new QQMapWX({
  key: 'UWVBZ-RNWKQ-FVZ54-BUNSC-AGBIZ-WVB3Y'
});
```

**核心功能**:

```javascript
data: {
  latitude: 39.980014,    // 默认纬度（北京）
  longitude: 116.313972,   // 默认经度
  scale: 16,               // 缩放级别
  markers: [],             // 标记点列表
  keyword: ''             // 搜索关键词
},

getCurrentLocation() {
  wx.getLocation({
    type: 'gcj02',
    success: (res) => {
      this.setData({
        latitude: res.latitude,
        longitude: res.longitude
      });
    }
  });
},

onSearch(e) {
  var keyword = e.detail.value.keyword;
  
  // 地点搜索
  qqmapsdk.search({
    keyword: keyword,
    location: this.data.latitude + ',' + this.data.longitude,
    success: (res) => {
      var mks = [];
      for (var i = 0; i < res.data.length; i++) {
        mks.push({
          id: i,
          title: res.data[i].title,
          latitude: res.data[i].location.lat,
          longitude: res.data[i].location.lng,
          iconPath: '/images/marker.png',
          width: 30,
          height: 30
        });
      }
      this.setData({ markers: mks });
    }
  });
}
```

### 4.10 自定义TabBar组件

**文件路径**: `miniprogram/custom-tab-bar/index.js`

**功能描述**: 自定义底部导航栏组件，替代原生TabBar。

**组件代码**:

```javascript
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
      // 根据当前页面路由更新选中状态
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
```

### 4.11 云函数模块

**文件路径**: `cloudfunctions/quickstartFunctions/index.js`

**功能描述**: 云开发示例云函数，提供基础的数据库操作能力。

**支持的操作用于**:

| 操作类型 | 说明 | 请求参数 | 返回数据 |
|---------|------|---------|---------|
| `getOpenIdByCode` | 通过code获取openid | `{ code: string }` | `{ openid, appid, unionid }` |
| `getOpenId` | 获取openid | 无 | `{ openid, appid, unionid }` |
| `getMiniProgramCode` | 获取小程序码 | 无 | 云存储文件ID |
| `createCollection` | 创建集合 | 无 | `{ success: true }` |
| `selectRecord` | 查询数据 | 无 | 数据列表 |
| `updateRecord` | 更新数据 | `{ data: Array }` | `{ success: true }` |
| `insertRecord` | 插入数据 | `{ data: Object }` | `{ success: true }` |
| `deleteRecord` | 删除数据 | `{ data: { _id } }` | `{ success: true }` |

**入口函数**:

```javascript
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenIdByCode":
      return await getOpenIdByCode(event);
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
  }
};
```

## 5. 关键数据结构

### 5.1 用户信息

```javascript
{
  nickname: string,       // 用户昵称
  avatar: string,         // 头像URL
  role: 'collector' | 'verifier',  // 用户角色
  loginToken: string      // 登录Token
}
```

### 5.2 POI数据

```javascript
{
  id: number,             // POI ID
  name: string,           // POI名称
  category: string,       // 分类ID
  categoryName: string,   // 分类名称
  address: string,        // 详细地址
  description: string,    // 描述
  phone: string,          // 电话
  businessHours: string,  // 营业时间
  latitude: number,       // 纬度
  longitude: number,      // 经度
  photos: string[],       // 图片URL列表
  submitter: string,      // 提交者
  submitTime: string,     // 提交时间
  status: string          // 状态: pending/approved/rejected/draft
}
```

### 5.3 任务数据

```javascript
{
  id: number,             // 任务ID
  address: string,        // 目标地址
  latitude: number,       // 目标纬度
  longitude: number,      // 目标经度
  status: string,         // 状态: pending/in_progress/completed/expired
  priority: number,       // 优先级
  deadline: string,       // 截止时间
  description: string     // 任务描述
}
```

### 5.4 审核结果

```javascript
{
  id: number,             // 审核记录ID
  poiId: number,          // POI ID
  poiName: string,        // POI名称
  result: string,         // 结果: approved/rejected/uncertain
  resultText: string,     // 结果文本
  errorDescription: string,  // 拒绝原因（如果有）
  reviewTime: string      // 审核时间
}
```

## 6. API接口说明

### 6.1 认证接口

#### POST /api/auth/login
用户登录接口

**请求参数**:
```json
{
  "code": "微信登录凭证"
}
```

**响应示例**:
```json
{
  "code": 200,
  "success": true,
  "message": "登录成功",
  "data": {
    "isNewUser": false,
    "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nickname": "张三",
    "role": "collector"
  }
}
```

#### POST /api/auth/register
用户注册接口

**请求参数**:
```json
{
  "code": "微信登录凭证",
  "nickname": "张三",
  "role": "collector"
}
```

**响应示例**:
```json
{
  "code": 200,
  "success": true,
  "message": "注册成功",
  "data": {
    "isNewUser": true,
    "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6.2 采集者接口

#### GET /api/collector/stats
获取采集者统计数据

**请求头**: `Authorization: Bearer {loginToken}`

**响应示例**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "newTasks": 5,
    "pendingTasks": 3,
    "myCollections": 12
  }
}
```

#### POST /api/collector/poi
创建POI采集

**请求头**: `Authorization: Bearer {loginToken}`

**请求参数**:
```json
{
  "name": "杭州西湖",
  "category": "tourism",
  "address": "杭州市西湖区西湖街道",
  "description": "中国著名的淡水湖",
  "phone": "0571-87977133",
  "businessHours": "全天开放",
  "latitude": 30.246,
  "longitude": 120.148,
  "photos": ["https://example.com/photo1.jpg"]
}
```

### 6.3 核验者接口

#### GET /api/verifier/stats
获取核验者统计数据

**响应示例**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "pendingCount": 10,
    "todayVerified": 5,
    "approvalRate": 85.5
  }
}
```

#### GET /api/verifier/pending-list
获取待核验列表

**请求参数**:
```json
{
  "pageNum": 1,
  "pageSize": 10,
  "category": "all",
  "sortBy": "date-desc"
}
```

#### POST /api/verifier/verify
提交核验结果

**请求参数**:
```json
{
  "poiId": 123,
  "result": "approved",
  "errorDescription": ""
}
```

## 7. 依赖关系

### 7.1 前端依赖

| 依赖库 | 版本 | 用途 |
|-------|------|------|
| 微信小程序基础库 | >= 2.2.3 | 小程序运行基础 |
| 腾讯位置服务SDK | - | 地图和地点搜索功能 |

### 7.2 云函数依赖

| 依赖库 | 版本 | 用途 |
|-------|------|------|
| wx-server-sdk | ~2.4.0 | 云函数开发SDK |

### 7.3 后端服务

| 服务 | 地址 | 用途 |
|------|------|------|
| 业务后端API | http://10.197.211.192:8080 | 认证、用户、POI、核验等业务接口 |
| 微信云开发 | 微信开发者工具配置 | 云函数、数据库、文件存储 |

## 8. 运行方式

### 8.1 环境准备

1. **微信开发者工具**
   - 下载并安装微信开发者工具
   - 登录微信公众平台账号

2. **项目导入**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择 `login_test` 目录
   - 填写 AppID（或使用测试号）

3. **云环境配置**
   - 点击右上角"云开发"按钮
   - 创建云环境（如果还没有）
   - 复制环境 ID
   - 粘贴到 `miniprogram/app.js` 的 `env` 字段

### 8.2 本地运行

1. **启动开发模式**
   - 在微信开发者工具中点击"编译"按钮
   - 选择目标模拟器（推荐使用iPhone 12/13系列）

2. **功能测试**
   - 登录测试：使用微信开发者工具的登录功能
   - 角色切换：在控制台修改 `userRole` 缓存值
   - 功能测试：测试各个页面的功能流程

### 8.3 云函数部署

1. **部署云函数**
   - 在微信开发者工具中，右键点击 `cloudfunctions/quickstartFunctions`
   - 选择"上传并部署"
   - 等待部署完成

2. **验证云函数**
   - 在云开发控制台查看已部署的云函数
   - 可以进行测试调用

### 8.4 后端服务配置

当前配置的后端服务地址: `http://10.197.211.192:8080`

如需修改，编辑 `miniprogram/config/api.js`:

```javascript
const API_BASE_URL = 'http://10.197.211.192:8080';
```

### 8.5 地图服务配置

如需使用腾讯地图服务，需要替换 `miniprogram/pages/map/map.js` 中的 key:

```javascript
var qqmapsdk = new QQMapWX({
  key: 'YOUR_TENCENT_MAP_KEY'  // 替换为实际的key
});
```

## 9. 注意事项

### 9.1 权限配置

- 地图功能需要用户授权位置信息权限
- 小程序已配置 `requiredPrivateInfos: ["getLocation"]`
- 用户首次使用时需要授权位置权限

### 9.2 安全建议

- `loginToken` 存储在本地，敏感操作需要验证Token有效性
- 生产环境建议启用HTTPS
- API密钥不要硬编码在客户端

### 9.3 性能优化

- 图片上传使用压缩模式：`sizeType: ['compressed']`
- 列表页使用分页加载，避免一次加载过多数据
- 地图标记点过多时考虑聚合显示

### 9.4 常见问题

1. **云函数调用失败**
   - 检查云环境是否正确配置
   - 确认云函数是否已部署

2. **登录失败**
   - 检查后端服务是否可访问
   - 确认 loginToken 是否过期

3. **位置获取失败**
   - 检查小程序是否已授权位置权限
   - 确认在手机设置中已开启位置服务

## 10. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-05-06 | 初始版本，包含登录、采集、核验、地图等基础功能 |

---

**文档信息**
- 文档版本: 1.0.0
- 生成日期: 2026-05-06
- 维护者: 开发团队
