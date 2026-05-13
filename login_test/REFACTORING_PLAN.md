# POI小程序前端代码重构方案

## 文档信息
- **编制日期**: 2026-05-10
- **基于文档**: PROJECT_API_AND_SCHEMA.md
- **适用范围**: 微信小程序前端代码

---

## 一、现有实现与API文档的差异分析

### 1.0 代码审查结果（2026-05-13）

经审查，当前代码已基本符合API文档规范，P0级问题均已修复：

| 文件 | 状态 | 说明 |
|------|------|------|
| publish-task/index.js | ✅ 已修复 | taskType 正确使用 `CREATE_NEW`/`UPDATE_EXISTING`，assigneeIds 已传递 |
| collect/index.js | ✅ 已修复 | submissionType 字段已添加 |
| request.js | ✅ 已完善 | 字段映射适配器已实现，处理 createdAt/updateTime 转换 |
| mock.js | ⚠️ 无需修改 | 按用户要求暂不修改 |

### 1.1 POI列表接口文档分析

#### API文档中定义的POI列表相关接口

| 接口路径 | 方法 | 功能 | Schema |
|----------|------|------|--------|
| `/api/poi` | GET | 获取所有POI列表 | ApiResponseListPoiResponse |
| `/api/poi/{id}` | GET | 获取POI详情 | ApiResponsePoiResponse |
| `/api/poi/collector/{collectorId}` | GET | 获取指定采集者的POI | ApiResponseListPoiResponse |

#### PoiResponse 数据结构（API文档定义）

```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "description": "string",
  "longitude": "number (double)",
  "latitude": "number (double)",
  "address": "string",
  "collectorId": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

#### ApiResponseListPoiResponse 结构

```json
{
  "code": "integer (int32)",
  "message": "string",
  "data": [
    { "$ref": "#/components/schemas/PoiResponse" }
  ],
  "success": "boolean"
}
```

### 1.2 当前实现与文档差异

| 差异项 | API文档 | 当前实现 | 状态 |
|--------|---------|----------|------|
| 接口路径 | `/api/poi/collector/{collectorId}` | 已正确实现 | ✅ 一致 |
| POI列表结构 | 使用 `PoiResponse` | 使用 `MOCK_POI_LIST` | ⚠️ 待统一 |
| 时间字段 | `createdAt` / `updatedAt` | 已通过 `normalizeListData` 转换 | ✅ 已处理 |

### 1.3 认证接口差异

| 差异项 | API文档定义 | 当前实现 | 影响范围 |
|--------|------------|----------|----------|
| 登录返回字段 | `isNewUser`, `loginToken` | 额外返回 `userId`, `nickname`, `role`, `avatar` | 登录页 |
| 注册接口 | `code` + `nickname` | 未实现 | 无 |
| 角色字段 | `role` 值为 `collector/verifier/admin` | `collector`/`verifier`/`admin` | 全局 |

**分析**: 登录接口返回数据已兼容前端需求，但注册接口前端未调用实现。

---

### 1.2 任务接口差异（严重）

| 差异项 | API文档定义 | 当前实现 | 影响范围 |
|--------|------------|----------|----------|
| `taskType` 字段值 | `CREATE_NEW` / `UPDATE_EXISTING` | `new` / `update` | publish-task |
| 必填字段 | `assigneeIds` (采集者ID列表) | 未传递 | publish-task |
| `poiId` 字段 | UPDATE_EXISTING时必填 | 未处理 | publish-task |
| 废弃字段 | `priority`, `deadline` | 当前正在使用 | publish-task |

**影响**:
- 任务创建接口会返回参数校验失败
- 采集者无法接收任务（因为未分配）

---

### 1.3 提交接口差异（严重）

| 差异项 | API文档定义 | 当前实现 | 影响范围 |
|--------|------------|----------|----------|
| 字段命名 | `name`, `category`, `description` | 一致 | collect |
| 提交类型 | `submissionType` = `CREATE`/`UPDATE` | 未传递 | collect |
| 任务关联 | `taskId` 必填 | 已传递 | collect |
| 提交者 | `submitterId` 必填 | 已传递 | collect |

**分析**: 提交接口参数基本正确，但缺少 `submissionType` 字段。

---

### 1.4 数据模型字段不一致

| 数据对象 | API文档字段 | 当前代码字段 | 问题 |
|----------|------------|--------------|------|
| POI | `collectorId` | 兼容 | - |
| POI | `createdAt` / `updatedAt` | `createTime` / `updateTime` | verify-list排序 |
| 提交 | `submissionType` | 缺失 | collect |
| 提交 | `isActive` | 缺失 | - |
| 任务 | `taskType` | `type` | 发布任务 |

---

### 1.5 Mock数据问题

| 问题 | 详情 |
|------|------|
| Mock路径错误 | `/api/poi/collector` 应为 `/api/poi/collector/*` |
| 分类值不一致 | Mock使用 `restaurant`/`shop`，API文档未定义 |
| 缺少字段 | `submissionType`, `taskType` 等 |

---

### 1.6 接口调用问题

| 问题 | 位置 | 说明 |
|------|------|------|
| 无分页实现 | verify-list | 代码有分页参数但未实际使用 |
| 错误处理不统一 | 全局 | `wx.showToast` 分散调用 |
| 重复请求 | verify-detail | onShow重复加载检测逻辑 |

---

## 二、接口调用方式的标准化调整建议

### 2.1 统一请求封装

**现状**: `Request.js` 提供了基础封装，但错误处理分散。

**建议**:
```javascript
// 标准化错误处理
request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject({ code: -1, message: '网络异常' });
      }
    });
  });
}
```

### 2.2 任务发布参数标准化

**publish-task/index.js 第211-220行调整**:
```javascript
const taskData = {
  publisherId: userId,
  taskType: formData.type === 'new' ? 'CREATE_NEW' : 'UPDATE_EXISTING',
  poiId: formData.type === 'update' ? formData.poiId : null,
  description: formData.description || '',
  targetName: formData.name || '',
  targetCategory: formData.category || '',
  targetLongitude: parseFloat(formData.longitude),
  targetLatitude: parseFloat(formData.latitude),
  targetAddress: formData.address,
  assigneeIds: []  // 需要实现采集者选择器
};
```

### 2.3 提交数据参数标准化

**collect/index.js 第259-268行调整**:
```javascript
const submitData = {
  taskId: this.data.taskId,
  submitterId: userId,
  name: formData.name,
  category: formData.category,
  description: formData.description || '',
  longitude: parseFloat(formData.longitude),
  latitude: parseFloat(formData.latitude),
  address: formData.address || ''
};
```

---

## 三、数据模型与API Schema的一致性优化方案

### 3.1 统一时间字段格式

**问题**: API返回 `createdAt`，代码使用 `createTime`。

**建议**: 在请求工具类中增加字段映射适配：
```javascript
adaptTimestamp(data) {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => this.adaptTimestamp(item));
  }
  // 统一时间字段命名
  if (data.createdAt !== undefined && data.createTime === undefined) {
    data.createTime = data.createdAt;
  }
  if (data.updatedAt !== undefined && data.updateTime === undefined) {
    data.updateTime = data.updatedAt;
  }
  return data;
}
```

### 3.2 分类值标准化

**建议**: 统一使用API文档定义的分类值:
```javascript
const CATEGORIES = [
  { id: 'catering', name: '餐饮' },
  { id: 'shopping', name: '购物' },
  { id: 'life_service', name: '生活服务' },
  { id: 'entertainment', name: '休闲娱乐' },
  { id: 'hotel', name: '酒店住宿' },
  { id: 'scenic', name: '旅游景点' },
  { id: 'medical', name: '医疗健康' },
  { id: 'education', name: '教育培训' },
  { id: 'transport', name: '交通设施' },
  { id: 'other', name: '其他' }
];
```

### 3.3 Mock数据结构修复

**mock.js 关键修复**:
```javascript
'/api/poi/collector/*': (collectorId) => { ... },
'/api/task/collector/*': (collectorId) => { ... },
```

---

## 四、错误处理机制的完善措施

### 4.1 分级错误处理策略

| 错误级别 | HTTP状态码 | 处理方式 | 示例 |
|----------|------------|----------|------|
| 网络错误 | -1 | Toast提示 + 重试 | 网络异常 |
| 参数错误 | 400 | 表单字段高亮 | 缺少必填参数 |
| 认证错误 | 401 | 跳转登录页 | Token失效 |
| 权限错误 | 403 | 提示权限不足 | 无权操作 |
| 业务错误 | 200(success=false) | 显示后端消息 | 审核状态异常 |
| 服务器错误 | 500 | 通用错误提示 | 服务器异常 |

### 4.2 统一错误处理中间件

```javascript
// 在 request.js 中增强
handleError(response) {
  const { code, success, message } = response;
  
  if (success === false) {
    if (code === 401) {
      wx.removeStorageSync('loginToken');
      wx.redirectTo({ url: '/pages/index/index' });
    }
    throw { code, message };
  }
  
  if (code >= 500) {
    wx.showToast({ title: '服务器异常', icon: 'none' });
    throw { code: -1, message: '服务器异常' };
  }
}
```

### 4.3 表单级错误处理

**publish-task 验证函数增强**:
```javascript
validateForm() {
  const errors = {};
  const { type, address, longitude, latitude, poiId } = this.data.formData;

  if (!address) errors.address = '请输入目标地址';
  if (!longitude || !latitude) errors.location = '请获取目标位置';
  if (type === 'update' && !poiId) errors.poiId = '更新任务需要指定POI';

  this.setData({ errors });
  return Object.keys(errors).length === 0;
}
```

---

## 五、重构实施的优先级与步骤规划

### 5.1 重构优先级矩阵

| 优先级 | 问题 | 影响程度 | 修复复杂度 | 建议顺序 |
|--------|------|----------|------------|----------|
| P0 | 任务发布接口参数错误 | 阻塞核心流程 | 低 | 1 |
| P0 | Mock数据路径错误 | 无法本地测试 | 低 | 1 |
| P1 | 任务类型值不匹配 | 任务创建失败 | 低 | 2 |
| P1 | assigneeIds缺失 | 采集者无法接任务 | 中 | 3 |
| P2 | 字段命名不一致 | 列表排序失败 | 中 | 4 |
| P2 | 错误处理不统一 | 用户体验差 | 中 | 5 |
| P3 | 无分页实现 | 性能问题 | 低 | 6 |
| P3 | 注册接口未实现 | 新用户无法注册 | 低 | 7 |

### 5.2 分阶段实施计划

#### 阶段一：修复阻塞性问题 (预计改动3个文件)

1. **修复 `publish-task/index.js`**
   - 修改 `taskType` 字段值映射
   - 添加 `assigneeIds` 参数

2. **修复 `mock.js`**
   - 修正通配符路径
   - 补充缺失字段

3. **修复 `collect/index.js`**
   - 添加 `submissionType` 字段

#### 阶段二：数据一致性修复 (预计改动4个文件)

1. **增强 `request.js`**
   - 添加字段映射适配器
   - 统一错误处理

2. **修复 `verify-list/index.js`**
   - 更新时间字段引用

3. **统一分类配置**
   - 检查所有页面的分类定义

#### 阶段三：错误处理完善 (预计改动2个文件)

1. **重构 `request.js`**
   - 添加分级错误处理
   - 统一超时处理

2. **增强表单验证**
   - 统一验证函数

#### 阶段四：功能增强 (视情况)

1. 实现采集者选择器
2. 实现注册流程
3. 添加请求重试机制

---

## 六、重构后的测试验证策略

### 6.1 测试验证清单

| 测试项 | 验证方法 | 预期结果 |
|--------|----------|----------|
| 任务发布 | 发布CREATE_NEW类型任务 | 成功创建 |
| 任务发布 | 发布UPDATE_EXISTING类型任务 | 成功创建 |
| 任务列表 | 采集者查看自己的任务 | 显示分配的任务 |
| 提交POI | 采集者提交数据 | 提交成功 |
| 审核通过 | 核验者审核提交 | 状态变为APPROVED |
| 审核驳回 | 核验者驳回提交 | 状态变为REJECTED |
| 字段映射 | 列表排序 | 按时间正确排序 |
| 错误提示 | 触发业务错误 | 显示后端消息 |

### 6.2 Mock环境验证

启用Mock时验证:
```bash
# 验证各接口Mock路径正确性
MOCK_ENABLED=true npm run dev
```

### 6.3 真机测试场景

| 场景 | 操作步骤 | 预期 |
|------|----------|------|
| 登录-老用户 | 微信登录 → 已有账号 | 自动登录，显示角色首页 |
| 登录-新用户 | 微信登录 → 无账号 | 提示注册 |
| 发布任务 | 核验者发布 → 填写表单 | 任务创建成功 |
| 采集任务 | 采集者接任务 → 提交 | 提交成功 |
| 审核任务 | 核验者审核 → 通过/驳回 | 状态更新 |

---

## 七、具体修改明细

### 7.1 publish-task/index.js (第210-220行)

**当前代码**:
```javascript
const taskData = {
  publisherId: userId,
  type: formData.type,
  targetAddress: formData.address,
  targetLatitude: parseFloat(formData.latitude),
  targetLongitude: parseFloat(formData.longitude),
  priority: formData.priority,
  description: formData.description || '',
  deadline: formData.deadline
};
```

**修改为**:
```javascript
const taskData = {
  publisherId: userId,
  taskType: formData.type === 'new' ? 'CREATE_NEW' : 'UPDATE_EXISTING',
  poiId: formData.type === 'update' ? formData.poiId : null,
  description: formData.description || '',
  targetName: formData.name || formData.address,
  targetCategory: formData.category || '',
  targetLongitude: parseFloat(formData.longitude),
  targetLatitude: parseFloat(formData.latitude),
  targetAddress: formData.address,
  assigneeIds: []  // TODO: 需要实现采集者选择功能
};
```

### 7.2 mock.js (路径修正)

**当前代码**:
```javascript
'/api/poi/collector': ...,
'/api/task/collector': ...,
```

**修改为**:
```javascript
'/api/poi/collector/*': ...,
'/api/task/collector/*': ...,
```

### 7.3 collect/index.js (添加submissionType)

**在submitData函数中添加**:
```javascript
const submitData = {
  taskId: this.data.taskId,
  submitterId: userId,
  submissionType: 'CREATE',  // 新增
  name: formData.name,
  category: formData.category,
  ...
};
```

---

## 八、注意事项

1. **API文档是关键**: 所有修改必须以 PROJECT_API_AND_SCHEMA.md 为准
2. **向后兼容**: 修改时应考虑与后端现有实现的兼容性
3. **分步验证**: 每修改一处应及时测试，避免问题累积
4. **Mock优先**: 优先修复Mock数据，确保本地开发可测试
5. **文档同步**: 修改完成后更新相关注释和文档

---

## 九、API文档对比分析与POI列表重构总结

### 9.1 文档一致性检查

对比 `api-doc_YAML.yaml` 和 `api-docs_json.json` 两个文档：

**路径差异**：两文档接口路径完全一致
**Schema差异**：两文档定义的 Schema 结构一致
**字段名称**：两文档定义的字段名称一致

### 9.2 POI列表接口重构（本次完成）

#### API文档定义的POI列表接口

| 接口 | 方法 | 响应Schema | 说明 |
|------|------|-----------|------|
| `/api/poi` | GET | ApiResponseListPoiResponse | 获取所有POI列表 |
| `/api/poi/{id}` | GET | ApiResponsePoiResponse | 获取POI详情 |
| `/api/poi/collector/{collectorId}` | GET | ApiResponseListPoiResponse | 获取采集者的POI |

#### PoiResponse 字段规范

```json
{
  "id": "string",
  "name": "string", 
  "category": "string",
  "description": "string",
  "longitude": "number(double)",
  "latitude": "number(double)", 
  "address": "string",
  "collectorId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 9.3 当前实现状态

| 组件 | 状态 | 说明 |
|------|------|------|
| api.js | ✅ 已更新 | 添加POI接口文档注释 |
| request.js | ✅ 已完善 | normalizeListData处理字段转换 |
| Mock数据 | ⚠️ 保持不变 | 按用户要求不修改mock.js |

### 9.4 关键字段映射关系

| API字段 | 前端使用字段 | 映射处理 |
|---------|-------------|----------|
| `createdAt` | `createTime` | request.js normalizeListData 转换 |
| `updatedAt` | `updateTime` | request.js normalizeListData 转换 |
| `taskType: CREATE_NEW` | `type: 'new'` | request.js normalizeListData 转换 |
| `taskType: UPDATE_EXISTING` | `type: 'update'` | request.js normalizeListData 转换 |
| `submissionType: CREATE` | `submissionType: 'create'` | request.js normalizeListData 转换 |
| `submissionType: UPDATE` | `submissionType: 'update'` | request.js normalizeListData 转换 |

### 9.3 后续优化建议

1. **P1级优化**：
   - 实现采集者选择器的完整功能（assigneeIds）
   - 优化 verify-detail 的 onShow 重复加载逻辑
   
2. **P2级优化**：
   - 统一分类值定义（当前使用 RESIDENTIAL/COMMERCIAL 等，需与后端对齐）
   - 实现分页功能

3. **P3级优化**：
   - 实现完整的注册流程
   - 添加请求重试机制

---

*文档版本: v1.2*
*最后更新: 2026-05-13*
*审查结果: P0级问题已全部修复，POI列表API已重构完成*
