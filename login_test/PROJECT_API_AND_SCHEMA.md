# POI Application 接口与表结构说明文档

## 1. 文档说明

- 本文档基于当前工程代码自动整理
- 用于前后端联调和工程维护
- 如有疑问请联系后端开发人员

## 2. 接口总览

| 接口名称 | 请求方式 | 路径 | 功能 |
|---------|---------|------|------|
| 登录 | POST | /api/auth/login | 微信登录 |
| 注册 | POST | /api/auth/register | 微信注册 |
| 上传POI | POST | /api/poi | 上传POI（已禁用，需通过任务流程） |
| 获取POI列表 | GET | /api/poi | 获取所有POI |
| 获取POI详情 | GET | /api/poi/{id} | 获取单个POI |
| 获取采集者POI列表 | GET | /api/poi/collector/{collectorId} | 获取指定采集者的POI |
| 发布任务 | POST | /api/task | 发布新任务 |
| 获取任务详情 | GET | /api/task/{id} | 获取单个任务 |
| 获取发布者任务列表 | GET | /api/task/publisher/{publisherId} | 获取发布者的任务 |
| 获取采集者任务列表 | GET | /api/task/collector/{collectorId} | 获取采集者的任务 |
| 获取待审核任务 | GET | /api/task/pending-review | 获取待审核任务 |
| 提交数据 | POST | /api/submission | 采集者提交数据 |
| 获取提交详情 | GET | /api/submission/{id} | 获取单个提交 |
| 获取任务提交列表 | GET | /api/submission/task/{taskId} | 获取任务的提交 |
| 获取提交者提交列表 | GET | /api/submission/submitter/{submitterId} | 获取提交者的提交 |
| 获取待审核提交 | GET | /api/submission/pending-review | 获取待审核提交 |
| 审核通过 | POST | /api/submission/{id}/approve | 审核通过 |
| 审核驳回 | POST | /api/submission/{id}/reject | 审核驳回 |
| 重新提交 | POST | /api/submission/resubmit | 驳回后重新提交 |

## 3. 通用返回结构

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "success": true
}
```

| 字段 | 类型 | 说明 |
|-----|------|------|
| code | int | HTTP状态码 |
| message | String | 提示信息 |
| data | Object | 返回数据（可为null） |
| success | boolean | 是否成功 |

## 4. 接口详情

### 4.1 认证接口

#### POST /api/auth/login - 登录

**请求JSON：**
```json
{
  "code": "微信临时code"
}
```

**成功返回：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "isNewUser": false,
    "loginToken": "mock_token_xxx"
  },
  "success": true
}
```

**失败返回（用户不存在）：**
```json
{
  "code": 200,
  "message": "用户不存在，请先注册",
  "data": {
    "isNewUser": true,
    "loginToken": null
  },
  "success": true
}
```

---

#### POST /api/auth/register - 注册

**请求JSON：**
```json
{
  "code": "微信临时code",
  "nickname": "用户昵称"
}
```

**成功返回：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "isNewUser": true,
    "loginToken": "mock_token_xxx"
  },
  "success": true
}
```

### 4.2 POI接口

#### POST /api/poi - 上传POI

**状态：已禁用**

此接口已禁用，创建POI必须通过任务流程（发布任务→提交→审核）。

**如需创建新POI，请使用：**
1. POST /api/task（发布CREATE_NEW类型任务）
2. POST /api/submission（采集者提交数据）
3. POST /api/submission/{id}/approve（审核通过后才会写入poi表）

---

#### GET /api/poi - 获取POI列表

**成功返回：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": "uuid",
      "name": "POI名称",
      "category": "分类",
      "description": "描述",
      "longitude": 112.123456,
      "latitude": 28.123456,
      "address": "地址",
      "collectorId": "采集者uuid",
      "createdAt": "2026-04-30T10:00:00+08:00",
      "updatedAt": "2026-04-30T10:00:00+08:00"
    }
  ],
  "success": true
}
```

---

#### GET /api/poi/{id} - 获取POI详情

**成功返回：** 同上，单个对象

**失败返回：**
```json
{
  "code": 404,
  "message": "POI不存在",
  "data": null,
  "success": false
}
```

---

#### GET /api/poi/collector/{collectorId} - 获取采集者的POI列表

**成功返回：** 同获取POI列表格式

### 4.3 任务接口

#### POST /api/task - 发布任务

**请求JSON：**
```json
{
  "publisherId": "发布者uuid（verifier/admin）",
  "taskType": "CREATE_NEW",
  "poiId": null,
  "description": "任务描述",
  "targetName": "目标名称",
  "targetCategory": "目标分类",
  "targetLongitude": 112.123456,
  "targetLatitude": 28.123456,
  "targetAddress": "目标地址",
  "assigneeIds": ["采集者uuid1", "采集者uuid2"]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| publisherId | 是 | 发布者ID，必须是verifier或admin角色 |
| taskType | 是 | CREATE_NEW / UPDATE_EXISTING |
| poiId | 否（CREATE_NEW）/ 是（UPDATE_EXISTING） | POI ID |
| assigneeIds | 是 | 采集者ID列表，不能为空 |

**成功返回：**
```json
{
  "code": 200,
  "message": "任务发布成功",
  "data": null,
  "success": true
}
```

---

#### GET /api/task/{id} - 获取任务详情

**成功返回：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "publisherId": "发布者uuid",
    "poiId": "POI uuid（CREATE_NEW时为null）",
    "description": "任务描述",
    "status": "PENDING_COLLECTION",
    "assigneeCount": 2,
    "createdAt": "2026-04-30T10:00:00+08:00",
    "updatedAt": "2026-04-30T10:00:00+08:00",
    "taskType": "CREATE_NEW",
    "targetName": "目标名称",
    "targetCategory": "目标分类",
    "targetLongitude": 112.123456,
    "targetLatitude": 28.123456,
    "targetAddress": "目标地址"
  },
  "success": true
}
```

---

#### GET /api/task/publisher/{publisherId} - 获取发布者的任务列表

**成功返回：** 同上，数组格式

---

#### GET /api/task/collector/{collectorId} - 获取采集者的任务列表

**成功返回：** 同上，数组格式

---

#### GET /api/task/pending-review - 获取待审核任务列表

**成功返回：** 同上，数组格式（status=PENDING_REVIEW的任务）

### 4.4 提交接口

#### POST /api/submission - 提交数据

**请求JSON：**
```json
{
  "taskId": "任务uuid",
  "submitterId": "提交者uuid",
  "name": "POI名称",
  "category": "分类",
  "description": "描述",
  "longitude": 112.123456,
  "latitude": 28.123456,
  "address": "地址"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| taskId | 是 | 任务ID |
| submitterId | 是 | 提交者ID，必须是该任务的assignee |
| name | 是 | POI名称 |
| category | 是 | 分类 |
| longitude | 是 | 经度，范围-180~180 |
| latitude | 是 | 纬度，范围-90~90 |

**成功返回：**
```json
{
  "code": 200,
  "message": "提交成功",
  "data": null,
  "success": true
}
```

---

#### GET /api/submission/{id} - 获取提交详情

**成功返回：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "poiId": "POI uuid",
    "submitterId": "提交者uuid",
    "submissionType": "CREATE",
    "name": "POI名称",
    "category": "分类",
    "description": "描述",
    "longitude": 112.123456,
    "latitude": 28.123456,
    "address": "地址",
    "status": "PENDING_REVIEW",
    "isActive": false,
    "reviewComment": null,
    "reviewerId": null,
    "reviewedAt": null,
    "createdAt": "2026-04-30T10:00:00+08:00",
    "updatedAt": "2026-04-30T10:00:00+08:00",
    "taskId": "任务uuid"
  },
  "success": true
}
```

---

#### GET /api/submission/task/{taskId} - 获取任务的提交列表

**成功返回：** 同上，数组格式

---

#### GET /api/submission/submitter/{submitterId} - 获取提交者的提交记录

**成功返回：** 同上，数组格式

---

#### GET /api/submission/pending-review - 获取待审核提交列表

**成功返回：** 同上，数组格式（status=PENDING_REVIEW的提交）

---

#### POST /api/submission/{id}/approve - 审核通过

**请求JSON：**
```json
{
  "reviewerId": "核验者uuid",
  "reviewComment": "审核意见"
}
```

**成功返回：**
```json
{
  "code": 200,
  "message": "审核通过",
  "data": null,
  "success": true
}
```

**业务逻辑：**
- CREATE类型提交：新建poi记录
- UPDATE类型提交：更新已有poi记录

---

#### POST /api/submission/{id}/reject - 审核驳回

**请求JSON：**
```json
{
  "reviewerId": "核验者uuid",
  "reviewComment": "驳回原因"
}
```

**成功返回：**
```json
{
  "code": 200,
  "message": "审核驳回",
  "data": null,
  "success": true
}
```

---

#### POST /api/submission/resubmit - 驳回后重新提交

**请求JSON：** 同POST /api/submission

**成功返回：**
```json
{
  "code": 200,
  "message": "重新提交成功",
  "data": null,
  "success": true
}
```

## 5. 数据库表结构总览

| 表名 | 作用 | 主键 |
|------|------|------|
| users | 用户表 | id |
| poi | 正式POI表（审核通过后数据） | id |
| poi_submission | 提交记录表 | id |
| poi_task | 任务主表 | id |
| poi_task_assignee | 任务-采集者分配关系表 | id |

## 6. 表结构详情

### 6.1 users 表

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | 否 | 主键 |
| wechat_openid | VARCHAR(100) | 否 | 微信openid |
| nickname | VARCHAR(100) | 是 | 昵称 |
| avatar_url | VARCHAR(500) | 是 | 头像URL |
| role | VARCHAR(30) | 否 | 角色：collector/verifier/admin |
| is_online | BOOLEAN | 否 | 是否在线 |
| last_login_at | TIMESTAMP | 是 | 最后登录时间 |
| status | VARCHAR(30) | 否 | 状态 |
| created_at | TIMESTAMP | 否 | 创建时间 |
| updated_at | TIMESTAMP | 否 | 更新时间 |

---

### 6.2 poi 表

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | 否 | 主键 |
| name | VARCHAR(100) | 否 | POI名称 |
| category | VARCHAR(50) | 否 | 分类 |
| description | TEXT | 是 | 描述 |
| longitude | NUMERIC(10,6) | 否 | 经度 |
| latitude | NUMERIC(10,6) | 否 | 纬度 |
| address | VARCHAR(255) | 是 | 地址 |
| collector_id | UUID | 否 | 采集者ID |
| created_at | TIMESTAMP | 否 | 创建时间 |
| updated_at | TIMESTAMP | 否 | 更新时间 |

---

### 6.3 poi_submission 表

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | 否 | 主键 |
| poi_id | UUID | 是 | 关联POI ID（审核通过后填充） |
| submitter_id | UUID | 否 | 提交者ID |
| submission_type | VARCHAR(20) | 否 | 类型：CREATE/UPDATE |
| name | VARCHAR(100) | 否 | POI名称 |
| category | VARCHAR(50) | 否 | 分类 |
| description | TEXT | 是 | 描述 |
| longitude | NUMERIC(10,6) | 否 | 经度 |
| latitude | NUMERIC(10,6) | 否 | 纬度 |
| address | VARCHAR(255) | 是 | 地址 |
| status | VARCHAR(30) | 否 | 状态 |
| is_active | BOOLEAN | 否 | 是否生效版本 |
| review_comment | TEXT | 是 | 审核意见 |
| reviewer_id | UUID | 是 | 审核者ID |
| reviewed_at | TIMESTAMP | 是 | 审核时间 |
| created_at | TIMESTAMP | 否 | 创建时间 |
| updated_at | TIMESTAMP | 否 | 更新时间 |
| task_id | UUID | 否 | 关联任务ID |

**status可选值：** PENDING_REVIEW / APPROVED / REJECTED
**约束：** DISPUTED状态已保留但代码未处理

---

### 6.4 poi_task 表

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | 否 | 主键 |
| publisher_id | UUID | 否 | 发布者ID |
| poi_id | UUID | 是 | 关联POI ID（UPDATE_EXISTING时必填） |
| description | TEXT | 是 | 任务描述 |
| status | VARCHAR(30) | 否 | 状态 |
| assignee_count | INTEGER | 否 | 分配人数 |
| created_at | TIMESTAMP | 否 | 创建时间 |
| updated_at | TIMESTAMP | 否 | 更新时间 |
| task_type | VARCHAR(30) | 否 | 类型：CREATE_NEW/UPDATE_EXISTING |
| target_name | VARCHAR(100) | 是 | 目标名称 |
| target_category | VARCHAR(50) | 是 | 目标分类 |
| target_longitude | NUMERIC(10,6) | 是 | 目标经度 |
| target_latitude | NUMERIC(10,6) | 是 | 目标纬度 |
| target_address | VARCHAR(255) | 是 | 目标地址 |

**status可选值：** PENDING_COLLECTION / PENDING_REVIEW / COMPLETED

---

### 6.5 poi_task_assignee 表

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | 否 | 主键 |
| task_id | UUID | 否 | 任务ID |
| collector_id | UUID | 否 | 采集者ID |
| created_at | TIMESTAMP | 否 | 创建时间 |

**约束：** 同一task_id+collector_id组合应唯一

## 7. 身份核验说明

当前通过传递用户ID方式实现身份核验：

| 操作 | 需要的角色 |
|------|----------|
| 发布任务 | verifier / admin |
| 提交数据 | collector / verifier / admin |
| 审核 | verifier / admin |

**注意：** 当前为mock token，不是真正的JWT认证

## 8. 业务流程说明

### 创建新POI的正确流程

```
1. 核验者发布CREATE_NEW任务
   POST /api/task

2. 采集者领取任务并提交数据
   POST /api/submission

3. 核验者审核通过
   POST /api/submission/{id}/approve

4. 审核通过后，poi主表才会被更新
```

### 更新已有POI的正确流程

```
1. 核验者发布UPDATE_EXISTING任务
   POST /api/task（需指定poiId）

2. 采集者领取任务并提交数据
   POST /api/submission

3. 核验者审核通过
   POST /api/submission/{id}/approve

4. 审核通过后，poi主表才会被更新
```

## 9. 状态流转说明

### 任务状态流转

```
PENDING_COLLECTION → PENDING_REVIEW → COMPLETED
        ↑                              |
        └──────────────────────────────┘（驳回后）
```

### 提交状态流转

```
PENDING_REVIEW → APPROVED
             ↘ REJECTED
                ↑
                │
                └──→（重新提交）→ PENDING_REVIEW
```

## 10. 注意事项

1. **POI上传已禁用**：请通过任务流程创建POI
2. **争议流程未实现**：DISPUTED状态保留但代码未处理
3. **无分页**：列表接口暂无分页参数
4. **无单元测试**：当前无测试用例
5. **Swagger文档**：可通过 http://localhost:8080/swagger-ui.html 访问