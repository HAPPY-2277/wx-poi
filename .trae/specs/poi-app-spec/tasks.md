# POI数据采集及核验移动应用 - 任务清单

## 第一阶段：基础框架搭建（第1-2周）

- [ ] Task 1.1: 创建项目目录结构
  - [ ] 创建 config/ 配置文件目录
  - [ ] 创建 services/ 服务层目录
  - [ ] 创建 utils/ 工具函数目录
  - [ ] 创建 pages/auth/ 认证模块目录
  - [ ] 创建 pages/collector/ 采集者模块目录
  - [ ] 创建 pages/verifier/ 核验者模块目录
  - [ ] 创建 pages/map/ 地图模块目录
  - [ ] 创建 pages/message/ 消息模块目录
  - [ ] 创建 pages/ocr/ OCR模块目录
  - [ ] 创建 components/ 组件库目录

- [ ] Task 1.2: 创建API配置文件（config/api.js）
  - [ ] 定义 BASE_URL 常量
  - [ ] 定义 AUTH 相关接口地址
  - [ ] 定义 POI 相关接口地址
  - [ ] 定义消息相关接口地址

- [ ] Task 1.3: 创建请求封装（config/request.js）
  - [ ] 实现统一请求方法 request()
  - [ ] 实现 GET/POST 快捷方法
  - [ ] 实现认证 Token 自动携带
  - [ ] 实现 success 字段判断逻辑
  - [ ] 实现错误提示自动显示

- [ ] Task 1.4: 完善登录页面（pages/auth/login/）
  - [ ] 创建 index.js 登录逻辑
  - [ ] 创建 index.wxml 登录界面
  - [ ] 创建 index.wxss 登录样式
  - [ ] 创建 index.json 页面配置
  - [ ] 实现微信登录 wx.login() 调用
  - [ ] 实现 Token 存储

- [ ] Task 1.5: 完善注册页面（pages/auth/register/）
  - [ ] 创建 index.js 注册逻辑
  - [ ] 创建 index.wxml 注册界面
  - [ ] 创建 index.wxss 注册样式
  - [ ] 实现角色选择功能
  - [ ] 实现昵称输入

- [ ] Task 1.6: 创建权限管理服务（services/auth.js）
  - [ ] 实现权限验证方法
  - [ ] 实现角色判断方法
  - [ ] 实现登录状态检查

---

## 第二阶段：采集者功能开发（第3-4周）

- [ ] Task 2.1: 创建采集者首页（pages/collector/index/）
  - [ ] 创建 index.js 首页逻辑
  - [ ] 创建 index.wxml 首页界面
  - [ ] 创建 index.wxss 首页样式
  - [ ] 实现功能入口卡片
  - [ ] 实现角色标识显示

- [ ] Task 2.2: 创建POI采集表单（pages/collector/collect/）
  - [ ] 创建 index.js 采集逻辑
  - [ ] 创建 index.wxml 采集表单界面
  - [ ] 创建 index.wxss 采集表单样式
  - [ ] 实现图片上传组件集成
  - [ ] 实现GPS自动定位
  - [ ] 实现分类选择器
  - [ ] 实现表单验证与提交

- [ ] Task 2.3: 创建图片上传组件（components/image-uploader/）
  - [ ] 创建 index.js 组件逻辑
  - [ ] 创建 index.wxml 组件模板
  - [ ] 创建 index.wxss 组件样式
  - [ ] 实现 wx.chooseImage 调用
  - [ ] 实现多图片预览
  - [ ] 实现删除功能

- [ ] Task 2.4: 创建任务列表页（pages/collector/task-list/）
  - [ ] 创建 index.js 任务列表逻辑
  - [ ] 创建 index.wxml 任务列表界面
  - [ ] 创建 index.wxss 任务列表样式
  - [ ] 实现重新采集任务展示
  - [ ] 实现任务筛选功能

- [ ] Task 2.5: 创建我的采集页（pages/collector/my-poi/）
  - [ ] 创建 index.js 我的采集逻辑
  - [ ] 创建 index.wxml 我的采集界面
  - [ ] 创建 index.wxss 我的采集样式
  - [ ] 实现采集记录列表
  - [ ] 实现状态筛选

---

## 第三阶段：核验者功能开发（第5-6周）

- [ ] Task 3.1: 创建核验者首页（pages/verifier/index/）
  - [ ] 创建 index.js 首页逻辑
  - [ ] 创建 index.wxml 首页界面
  - [ ] 创建 index.wxss 首页样式
  - [ ] 实现待核验数量统计
  - [ ] 实现今日核验统计

- [ ] Task 3.2: 创建待核验列表页（pages/verifier/verify-list/）
  - [ ] 创建 index.js 待核验列表逻辑
  - [ ] 创建 index.wxml 待核验列表界面
  - [ ] 创建 index.wxss 待核验列表样式
  - [ ] 实现POI列表展示
  - [ ] 实现分类筛选
  - [ ] 实现排序功能

- [ ] Task 3.3: 创建核验详情页（pages/verifier/verify-detail/）
  - [ ] 创建 index.js 核验详情逻辑
  - [ ] 创建 index.wxml 核验详情界面
  - [ ] 创建 index.wxss 核验详情样式
  - [ ] 实现照片轮播
  - [ ] 实现核验操作按钮组
  - [ ] 实现错误标识功能

- [ ] Task 3.4: 创建我的核验页（pages/verifier/my-review/）
  - [ ] 创建 index.js 我的核验逻辑
  - [ ] 创建 index.wxml 我的核验界面
  - [ ] 创建 index.wxss 我的核验样式
  - [ ] 实现核验历史记录
  - [ ] 实现统计图表

---

## 第四阶段：地图集成与消息模块（第7-8周）

- [ ] Task 4.1: 创建地图首页（pages/map/）
  - [ ] 创建 index.js 地图逻辑
  - [ ] 创建 index.wxml 地图界面
  - [ ] 创建 index.wxss 地图样式
  - [ ] 集成腾讯地图SDK
  - [ ] 实现地图展示与操作
  - [ ] 实现POI标记展示
  - [ ] 实现定位功能

- [ ] Task 4.2: 创建POI详情页（pages/map/poi-detail/）
  - [ ] 创建 index.js POI详情逻辑
  - [ ] 创建 index.wxml POI详情界面
  - [ ] 创建 index.wxss POI详情样式
  - [ ] 实现POI信息展示
  - [ ] 实现导航跳转

- [ ] Task 4.3: 创建消息中心（pages/message/index/）
  - [ ] 创建 index.js 消息中心逻辑
  - [ ] 创建 index.wxml 消息中心界面
  - [ ] 创建 index.wxss 消息中心样式
  - [ ] 实现消息分类展示
  - [ ] 实现未读标记

- [ ] Task 4.4: 创建私聊页面（pages/message/chat/）
  - [ ] 创建 index.js 私聊逻辑
  - [ ] 创建 index.wxml 私聊界面
  - [ ] 创建 index.wxss 私聊样式
  - [ ] 实现消息气泡展示
  - [ ] 实现消息发送功能

- [ ] Task 4.5: 创建群聊页面（pages/message/group/）
  - [ ] 创建 index.js 群聊逻辑
  - [ ] 创建 index.wxml 群聊界面
  - [ ] 创建 index.wxss 群聊样式
  - [ ] 实现群组成员展示
  - [ ] 实现群聊消息流

---

## 第五阶段：OCR集成与优化（第9-10周）

- [ ] Task 5.1: 创建OCR识别页（pages/ocr/）
  - [ ] 创建 index.js OCR逻辑
  - [ ] 创建 index.wxml OCR界面
  - [ ] 创建 index.wxss OCR样式
  - [ ] 实现拍照/相册选择
  - [ ] 实现图片预览

- [ ] Task 5.2: 创建OCR结果页（pages/ocr/result/）
  - [ ] 创建 index.js 结果页逻辑
  - [ ] 创建 index.wxml 结果页界面
  - [ ] 创建 index.wxss 结果页样式
  - [ ] 实现识别结果展示
  - [ ] 实现文字高亮
  - [ ] 实现选择填充功能

- [ ] Task 5.3: 创建通用组件
  - [ ] 创建 poi-card 组件
  - [ ] 创建 category-picker 组件
  - [ ] 创建 location-picker 组件
  - [ ] 创建 status-tag 组件
  - [ ] 创建 empty-state 组件

- [ ] Task 5.4: 性能优化
  - [ ] 实现图片懒加载
  - [ ] 实现列表分页加载
  - [ ] 实现数据缓存策略

---

## 第六阶段：联调测试与发布（第11-12周）

- [ ] Task 6.1: 功能测试
  - [ ] 测试用户认证流程
  - [ ] 测试采集功能
  - [ ] 测试核验功能
  - [ ] 测试地图功能
  - [ ] 测试消息功能
  - [ ] 测试OCR功能

- [ ] Task 6.2: 兼容性测试
  - [ ] 测试不同屏幕尺寸适配
  - [ ] 测试不同微信版本
  - [ ] 测试网络异常处理

- [ ] Task 6.3: 文档编写
  - [ ] 编写接口文档
  - [ ] 编写组件使用文档
  - [ ] 编写部署文档

- [ ] Task 6.4: 项目发布
  - [ ] 配置合法域名
  - [ ] 提交审核
  - [ ] 发布上线

---

## 任务依赖关系

- Task 1.1 ~ 1.6（基础框架）是其他所有任务的前置条件
- Task 2.1 ~ 2.5 相互独立，可以并行开发
- Task 3.1 ~ 3.4 相互独立，可以并行开发
- Task 4.1 ~ 4.5 依赖于 Task 2 和 Task 3 完成后进行
- Task 5.1 ~ 5.4 可以与 Task 4 并行开发
- Task 6.1 ~ 6.4 必须在前五个阶段完成后进行
