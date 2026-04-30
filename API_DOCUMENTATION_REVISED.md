# API 文档

## 修订说明

本次修订不改变接口设计，只修正文档格式、一致性和表述问题。具体修订内容包括：

1. 修正完整地址/URL 占位符格式，统一为 http://<HOST>:<PORT>/xxx
2. 统一 Base URL 的占位符格式为 <HOST> 和 <PORT>
3. 将请求 JSON、成功返回 JSON、失败返回 JSON 整理为标准文档代码块格式
4. 修正返回字段说明和失败示例之间的不一致，确保描述准确
5. 清理文档中的多余空格和错误断行
6. 统一表格和标题格式，使文档更适合前端阅读
7. 补充必要说明，明确前端应以什么判断成功/失败
8. 保留并明确已有设计说明，如局域网测试模式、code 字段实际代表 openid、loginToken 当前为 mock token 等

## 1. 文档说明

- 该文档基于当前工程代码自动整理
- 文档覆盖当前工程中所有可调用 HTTP API
- 当前工程包含 2 个已实现的接口：登录和注册
- 文档适用场景：局域网测试、开发联调
- 当前工程中存在字段命名与实际业务含义不一致的情况：字段名 `code` 实际代表 `openid`，在文档中已明确标注

---

## 2. 基础信息

### 2.1 Base URL
- 开发环境：http://<HOST>:<PORT>
- 测试环境：http://<HOST>:<PORT>
- 生产环境：待确认

### 2.2 Content-Type
- application/json

### 2.3 认证方式
- 当前版本未启用统一认证
- 登录成功后返回 mock token，可用于前端临时保存登录状态

### 2.4 通用请求头
- 当前无额外强制请求头要求

### 2.5 通用返回结构

```json
{
  "code": 200,
  "message": "string",
  "data": {},
  "success": true
}
```

- code：int，HTTP 状态码
- message：string，提示信息
- data：object 或 null，业务数据
- success：boolean，表示请求处理结果

### 2.6 通用状态码规则
- 200：请求处理成功
- 400：参数错误或业务逻辑错误
- 500：系统内部错误

### 2.7 判断成功/失败的依据
- 前端应以 `success` 字段作为主要判断依据
- `message` 字段用于显示提示信息
- HTTP 状态码作为辅助判断依据

## 3. 常见错误消息表

| 错误消息 | 含义 | 触发条件 | 前端建议处理方式 | 备注 |
|---------|------|---------|-----------------|------|
| 登录失败：code 不能为空 | 登录请求缺少 code 参数 | 请求体中未包含 code 或 code 为空 | 提示用户输入必要信息 | - |
| 注册失败：code 不能为空 | 注册请求缺少 code 参数 | 请求体中未包含 code 或 code 为空 | 提示用户输入必要信息 | - |
| 注册失败：用户已存在，请直接登录 | 尝试注册已存在的用户 | 数据库中已存在相同的 wechat_openid | 提示用户直接登录 | - |
| 登录失败：系统错误 | 登录过程中发生异常 | 数据库访问失败等系统问题 | 提示用户稍后重试 | - |
| 注册失败：系统错误 | 注册过程中发生异常 | 数据库访问失败等系统问题 | 提示用户稍后重试 | - |

## 4. 接口总览表

| 序号 | 接口名称 | 请求方式 | 完整路径 | 功能说明 | 是否需要登录 | 当前实现状态 | 备注 |
|------|---------|----------|----------|----------|-------------|-------------|------|
| 1 | 登录接口 | POST | http://<HOST>:<PORT>/api/auth/login | 登录检查，用户不存在时返回提示 | 否 | 已实现 | 局域网测试模式，code 直接作为 openid |
| 2 | 注册接口 | POST | http://<HOST>:<PORT>/api/auth/register | 注册新用户 | 否 | 已实现 | 局域网测试模式，code 直接作为 openid |

## 5. 接口详细文档

### 5.1 登录接口

#### 5.1.1 基本信息
- 接口名称：登录接口
- 请求方式：POST
- 完整地址：http://<HOST>:<PORT>/api/auth/login
- 功能说明：登录检查，用户不存在时返回提示，不自动注册
- 当前实现状态：已实现
- 是否需要登录：否
- 是否依赖数据库：是
- 是否依赖外部服务：否
- 备注：当前为局域网测试简化模式，直接将前端传来的 code 作为 wechat_openid 使用

#### 5.1.2 请求参数来源
- Body

#### 5.1.3 请求参数说明表
| 字段名 | 来源位置 | 数据类型 | 是否必填 | 默认值 | 限制规则 | 字段说明 | 备注 |
|-------|---------|----------|----------|--------|----------|---------|------|
| code | Body | String | 是 | 无 | 非空 | 前端传来的字符串，当前直接作为 wechat_openid 使用 | 字段名与实际含义不一致，实际代表 openid |
| role | Body | String | 否 | 无 | - | 用户角色 | 当前代码未使用 |

#### 5.1.4 请求 JSON 示例
```json
{
  "code": "string"
}
```

#### 5.1.5 成功返回 JSON 示例
**登录成功：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "isNewUser": false,
    "loginToken": "mock-token-xxx"
  },
  "success": true
}
```

**用户不存在：**
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

#### 5.1.6 失败返回 JSON 示例
**参数错误：**
```json
{
  "code": 400,
  "message": "登录失败：code 不能为空",
  "data": null,
  "success": false
}
```

**系统错误：**
```json
{
  "code": 500,
  "message": "登录失败：系统错误",
  "data": null,
  "success": false
}
```

#### 5.1.7 返回字段说明表
| 字段路径 | 数据类型 | 是否一定返回 | 可能取值 | 字段说明 | 备注 |
|---------|----------|-------------|----------|---------|------|
| code | Integer | 是 | 200/400/500 | HTTP 状态码 | - |
| message | String | 是 | 任意字符串 | 操作结果描述 | - |
| data | Object | 是 | 包含 isNewUser 和 loginToken 或 null | 登录结果数据 | 失败时为 null |
| data.isNewUser | Boolean | 否 | true/false | 是否为新用户 | 成功时返回 |
| data.loginToken | String | 否 | 任意字符串 | 登录 token，用户不存在时为 null | 当前为 mock token |
| success | Boolean | 是 | true/false | 操作是否成功 | - |

#### 5.1.8 业务流程说明
1. 前端发送 POST 请求到 /api/auth/login，包含 code
2. 后端校验 code 是否为空
3. 后端将 code 作为 openid 使用
4. 后端查询数据库中是否存在该 openid
5. 如果存在，更新登录状态并返回登录成功
6. 如果不存在，返回用户不存在提示
7. 前端根据返回结果决定下一步操作

#### 5.1.9 前端处理建议
- success=true 且 isNewUser=false → 登录成功，保存 token，进入主页
- success=true 且 isNewUser=true → 用户不存在，跳转到注册页面
- success=false → 弹出错误提示，显示 message 内容

#### 5.1.10 注意事项
- 当前接口为局域网测试模式，直接将 code 作为 openid 使用
- 返回的 loginToken 为 mock 数据，仅用于前端临时保存登录状态
- 字段名 code 实际代表 openid，命名与实际含义不一致
- 当前代码未使用 nickname、avatarUrl、role 字段

### 5.2 注册接口

#### 5.2.1 基本信息
- 接口名称：注册接口
- 请求方式：POST
- 完整地址：http://<HOST>:<PORT>/api/auth/register
- 功能说明：注册新用户
- 当前实现状态：已实现
- 是否需要登录：否
- 是否依赖数据库：是
- 是否依赖外部服务：否
- 备注：当前为局域网测试简化模式，直接将前端传来的 code 作为 wechat_openid 使用

#### 5.2.2 请求参数来源
- Body

#### 5.2.3 请求参数说明表
| 字段名 | 来源位置 | 数据类型 | 是否必填 | 默认值 | 限制规则 | 字段说明 | 备注 |
|-------|---------|----------|----------|--------|----------|---------|------|
| code | Body | String | 是 | 无 | 非空 | 前端传来的字符串，当前直接作为 wechat_openid 使用 | 字段名与实际含义不一致，实际代表 openid |
| nickname | Body | String | 否 | 无 | - | 用户昵称 | 当前代码未使用 |
| avatarUrl | Body | String | 否 | 无 | - | 用户头像 URL | 当前代码未使用 |
| role | Body | String | 否 | 无 | - | 用户角色 | 当前代码未使用 |

#### 5.2.4 请求 JSON 示例
```json
{
  "code": "string"
}
```

#### 5.2.5 成功返回 JSON 示例
**注册成功：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "isNewUser": true,
    "loginToken": "mock-token-xxx"
  },
  "success": true
}
```

#### 5.2.6 失败返回 JSON 示例
**参数错误：**
```json
{
  "code": 400,
  "message": "注册失败：code 不能为空",
  "data": null,
  "success": false
}
```

**用户已存在：**
```json
{
  "code": 400,
  "message": "注册失败：用户已存在，请直接登录",
  "data": null,
  "success": false
}
```

**系统错误：**
```json
{
  "code": 400,
  "message": "注册失败：系统错误",
  "data": null,
  "success": false
}
```

#### 5.2.7 返回字段说明表
| 字段路径 | 数据类型 | 是否一定返回 | 可能取值 | 字段说明 | 备注 |
|---------|----------|-------------|----------|---------|------|
| code | Integer | 是 | 200/400 | HTTP 状态码 | - |
| message | String | 是 | 任意字符串 | 操作结果描述 | - |
| data | Object | 是 | 包含 isNewUser 和 loginToken 或 null | 注册结果数据 | 失败时为 null |
| data.isNewUser | Boolean | 否 | true | 注册成功时为 true | 成功时返回 |
| data.loginToken | String | 否 | 任意字符串 | 登录 token | 当前为 mock token |
| success | Boolean | 是 | true/false | 操作是否成功 | - |

#### 5.2.8 业务流程说明
1. 前端发送 POST 请求到 /api/auth/register，包含 code
2. 后端校验 code 是否为空
3. 后端将 code 作为 openid 使用
4. 后端查询数据库中是否存在该 openid
5. 如果存在，返回用户已存在提示
6. 如果不存在，创建新用户并设置默认角色为 collector
7. 返回注册成功结果
8. 前端根据返回结果决定下一步操作

#### 5.2.9 前端处理建议
- success=true → 注册成功，保存 token，进入主页
- success=false → 弹出错误提示，显示 message 内容
- 如果提示用户已存在，引导用户直接登录

#### 5.2.10 注意事项
- 当前接口为局域网测试模式，直接将 code 作为 openid 使用
- 返回的 loginToken 为 mock 数据，仅用于前端临时保存登录状态
- 字段名 code 实际代表 openid，命名与实际含义不一致
- 注册时角色默认为 collector，无法指定其他角色
- 当前代码未使用 nickname、avatarUrl、role 字段

## 6. 典型业务流程文档

### 6.1 登录流程
1. 前端调用 `POST /api/auth/login` 接口
2. 传递参数：`{"code": "string"}`（code 实际为 openid）
3. 后端返回：
   - 登录成功：`{"success": true, "message": "登录成功", "data": {"isNewUser": false, "loginToken": "mock-token-xxx"}}`
   - 用户不存在：`{"success": true, "message": "用户不存在，请先注册", "data": {"isNewUser": true, "loginToken": null}}`
4. 前端处理：
   - 登录成功：保存 token，进入主页
   - 用户不存在：跳转到注册页面

### 6.2 注册流程
1. 前端调用 `POST /api/auth/register` 接口
2. 传递参数：`{"code": "string"}`（code 实际为 openid）
3. 后端返回：
   - 注册成功：`{"success": true, "message": "注册成功", "data": {"isNewUser": true, "loginToken": "mock-token-xxx"}}`
   - 用户已存在：`{"success": false, "message": "注册失败：用户已存在，请直接登录", "data": null}`
4. 前端处理：
   - 注册成功：保存 token，进入主页
   - 用户已存在：跳转到登录页面

## 7. WebSocket 文档

当前工程未发现 WebSocket 接口

## 8. 当前接口问题清单

1. **请求字段命名不合理**：登录和注册接口的 `code` 字段实际当作 `openid` 使用，命名与实际含义不一致
2. **返回数据为 mock**：登录 token 为 mock 数据，仅用于前端临时保存登录状态
3. **角色固定**：注册时角色默认为 collector，无法指定其他角色
4. **参数校验简单**：仅检查 code 是否为空，缺少其他校验
5. **错误处理统一**：所有错误都通过 JSON 中的 success 和 message 字段返回，没有统一的错误码
6. **无接口版本控制**：接口路径中没有版本号，未来扩展可能会有冲突
7. **未使用字段**：请求体中的 nickname、avatarUrl、role 字段当前未被使用

## 9. 联调注意事项

1. **局域网调用**：当前接口为局域网测试模式，确保前端和后端在同一局域网
2. **字段含义**：前端需要注意 `code` 字段实际代表 `openid`，请直接传递 openid 作为 code
3. **mock token**：登录成功后返回的 token 为 mock 数据，仅用于前端临时保存登录状态
4. **角色默认**：注册时会默认设置角色为 collector，无法指定其他角色
5. **错误处理**：前端需要根据返回的 `success` 字段和 `message` 字段处理错误情况
6. **数据库依赖**：接口依赖 PostgreSQL 数据库，确保数据库服务正常运行
7. **表结构**：数据库中需要存在 users 表，且表结构符合当前代码要求
8. **顺序调用**：建议先调用登录接口，根据返回结果决定是否需要注册

## 复验结论

本人已重新对照工程代码完成复验，确认以下内容：

1. 文档中的每个接口路径与 Controller 一致
2. 文档中的请求方式与注解一致
3. 文档中的请求体字段与 DTO 一致
4. 文档中的返回结构与当前代码一致
5. 文档中的成功示例和失败示例合理
6. 文档中的字段说明和代码匹配
7. 文档中的“是否一定返回”描述准确
8. 文档中的局域网测试说明仍然成立
9. 文档中的“code 实际代表 openid”说明仍然成立
10. 文档中没有遗漏当前工程内已存在的接口
11. 文档中没有保留已经不符合当前代码的旧描述

文档已根据工程代码进行了必要的格式与表述修正，确保内容准确、一致、易于前端阅读和使用。