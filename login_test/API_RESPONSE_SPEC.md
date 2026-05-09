# 登录和注册接口返回数据格式文档

## 一、统一返回结构

所有接口统一使用以下返回格式：

```json
{
  "success": true,
  "message": "操作描述信息",
  "data": {}
}
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `success` | Boolean | ✅ | 请求是否成功 |
| `message` | String | ✅ | 提示信息，用于前端展示 |
| `data` | Object/Null | ✅ | 业务数据，失败时为 null |

---

## 二、登录接口

**接口地址**：`POST /api/auth/login`

### 请求参数

```json
{
  "code": "微信临时登录凭证"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `code` | String | ✅ | wx.login() 获取的临时凭证 |

---

### 返回情况总览

| 场景 | success | message | data.isNewUser | data.loginToken |
|-----|---------|---------|----------------|-----------------|
| 老用户登录成功 | true | 登录成功 | false | 登录令牌 |
| 新用户（未注册） | true | 用户不存在，请先注册 | true | null |
| 系统错误 | false | 错误描述 | null | null |
| 参数缺失 | false | code不能为空 | null | null |

---

### 场景1：老用户登录成功

**触发条件**：用户在数据库中存在

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "isNewUser": false,
    "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nickname": "张三",
    "role": "collector",
    "avatar": "https://thirdqq.qlogo.cn/avatar/xxx"
  }
}
```

**data 字段说明**：

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `isNewUser` | Boolean | ✅ | 固定返回 false |
| `loginToken` | String | ✅ | JWT 令牌，用于后续接口认证 |
| `nickname` | String | ❌ | 用户昵称（可选） |
| `role` | String | ❌ | 用户角色（collector/verifier，可选） |
| `avatar` | String | ❌ | 用户头像URL（可选） |

**前端处理**：

- 提示用户登录成功
- 保存 loginToken、nickname、role、avatar 到本地存储
- 跳转到对应角色的首页（根据 role 判断）

---

### 场景2：新用户（未注册）

**触发条件**：用户在数据库中不存在

```json
{
  "success": true,
  "message": "用户不存在，请先注册",
  "data": {
    "isNewUser": true,
    "loginToken": null
  }
}
```

**data 字段说明**：

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `isNewUser` | Boolean | ✅ | 固定返回 true，表示需要注册 |
| `loginToken` | null | ✅ | 固定返回 null，新用户无令牌 |

**前端处理**：

- 提示用户需要先注册
- 跳转到注册页面（/pages/profile/profile）

---

### 场景3：系统错误

**触发条件**：服务器内部错误、数据库连接失败等

```json
{
  "success": false,
  "message": "登录失败：系统错误，请稍后重试",
  "data": null
}
```

**前端处理**：

- 提示用户系统错误
- 建议稍后重试

---

### 场景4：参数缺失

**触发条件**：请求中缺少 code 参数或 code 为空

```json
{
  "success": false,
  "message": "参数错误：code不能为空",
  "data": null
}
```

**前端处理**：

- 提示用户参数错误
- 终止登录流程

---

## 三、注册接口

**接口地址**：`POST /api/auth/register`

### 请求参数

```json
{
  "code": "微信临时登录凭证",
  "nickname": "用户昵称",
  "role": "collector"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `code` | String | ✅ | wx.login() 获取的临时凭证 |
| `nickname` | String | ✅ | 用户昵称 |
| `role` | String | ✅ | 用户角色（collector/verifier） |

---

### 返回情况总览

| 场景 | success | message | data.isNewUser | data.loginToken |
|-----|---------|---------|----------------|-----------------|
| 注册成功 | true | 注册成功，您是采集者/核验者 | true | 登录令牌 |
| 用户已存在 | false | 注册失败：用户已存在，请直接登录 | null | null |
| 角色参数错误 | false | 参数错误：role必须是collector或verifier | null | null |
| 系统错误 | false | 错误描述 | null | null |
| 参数缺失 | false | 错误描述 | null | null |

---

### 场景1：注册成功

**触发条件**：用户在数据库中不存在，注册流程正常完成

```json
{
  "success": true,
  "message": "注册成功，您是采集者",
  "data": {
    "isNewUser": true,
    "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "avatar": "https://thirdqq.qlogo.cn/avatar/xxx"
  }
}
```

**data 字段说明**：

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `isNewUser` | Boolean | ✅ | 固定返回 true |
| `loginToken` | String | ✅ | JWT 令牌，用于后续接口认证 |
| `avatar` | String | ❌ | 用户头像URL（可选，由微信提供） |

**前端处理**：

- 提示用户注册成功，显示用户角色
- 保存 loginToken、nickname、role 到本地存储
- 根据 role 跳转到对应首页：
  - collector → /pages/collector/index/index
  - verifier → /pages/verifier/index/index

---

### 场景2：用户已存在

**触发条件**：用户在数据库中已存在（同一 openid）

```json
{
  "success": false,
  "message": "注册失败：用户已存在，请直接登录",
  "data": null
}
```

**前端处理**：

- 弹窗询问用户是否去登录
- 用户确认后跳转到登录页面（/pages/index/index）

---

### 场景3：角色参数错误

**触发条件**：role 参数不是 collector 或 verifier

```json
{
  "success": false,
  "message": "参数错误：role必须是collector或verifier",
  "data": null
}
```

**前端处理**：

- 提示用户角色参数错误
- 阻止提交，要求重新选择角色

---

### 场景4：系统错误

**触发条件**：服务器内部错误、数据库连接失败等

```json
{
  "success": false,
  "message": "注册失败：系统错误，请稍后重试",
  "data": null
}
```

**前端处理**：

- 提示用户系统错误
- 建议稍后重试

---

### 场景5：参数缺失

**触发条件**：请求中缺少必要参数

```json
{
  "success": false,
  "message": "参数错误：nickname不能为空",
  "data": null
}
```

或

```json
{
  "success": false,
  "message": "参数错误：role不能为空",
  "data": null
}
```

**前端处理**：

- 提示用户缺少参数
- 阻止提交，要求填写完整信息

---

## 四、错误码规范

### HTTP 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功（业务层面的成功/失败由 success 字段判断） |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

### 业务错误码（可选）

如果需要更精细的错误处理，可以在 message 中包含错误码：

```json
{
  "success": false,
  "message": "[AUTH_001] 参数错误：code不能为空",
  "data": null
}
```

**建议的错误码前缀**：

| 前缀 | 说明 | 示例 |
|-----|------|------|
| AUTH_001 | 参数缺失 | code、nickname、role |
| AUTH_002 | 参数格式错误 | role 不是 collector/verifier |
| AUTH_003 | 用户已存在 | 注册时用户已存在 |
| AUTH_004 | 用户不存在 | 登录时用户不存在 |
| SYS_001 | 系统错误 | 数据库、服务器异常 |

---

## 五、前端存储规范

### 需要存储的字段

| 字段名 | 来源 | 说明 |
|-------|------|------|
| `loginToken` | 登录/注册接口的 data.loginToken | 核心认证令牌 |
| `userNickname` | 登录接口的 data.nickname / 注册接口的请求 nickname | 用户昵称 |
| `userRole` | 登录接口的 data.role / 注册接口的请求 role | 用户角色 |
| `userAvatar` | 登录/注册接口的 data.avatar | 用户头像 |

### 存储方式

```javascript
// 登录成功或注册成功后保存
wx.setStorageSync('loginToken', data.loginToken);
wx.setStorageSync('userNickname', data.nickname);
wx.setStorageSync('userRole', data.role);
wx.setStorageSync('userAvatar', data.avatar);
```

### 退出登录时清除

```javascript
// 退出登录时清除所有用户信息
wx.removeStorageSync('loginToken');
wx.removeStorageSync('userNickname');
wx.removeStorageSync('userRole');
wx.removeStorageSync('userAvatar');
```

---

## 六、接口调用示例

### 登录接口调用

```javascript
async handleLogin() {
  // 1. 获取微信登录凭证
  wx.login({
    success: async (loginRes) => {
      if (!loginRes.code) {
        wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        return;
      }

      // 2. 发送登录请求
      const res = await Request.post('/api/auth/login', {
        code: loginRes.code
      }, false);

      // 3. 根据返回结果处理
      if (res.data.isNewUser) {
        // 新用户 → 跳转注册
        wx.navigateTo({ url: '/pages/profile/profile' });
      } else {
        // 老用户 → 登录成功
        this.saveUserData(res.data);
        wx.switchTab({ url: '/pages/home/index' });
      }
    }
  });
}
```

### 注册接口调用

```javascript
async handleSubmit() {
  // 1. 表单验证
  if (!this.data.nickname) {
    wx.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  if (!this.data.role) {
    wx.showToast({ title: '请选择身份', icon: 'none' });
    return;
  }

  // 2. 获取微信登录凭证
  wx.login({
    success: async (loginRes) => {
      // 3. 发送注册请求
      const res = await Request.post('/api/auth/register', {
        code: loginRes.code,
        nickname: this.data.nickname,
        role: this.data.role
      }, false);

      // 4. 保存用户数据并跳转
      this.saveUserData(res.data);
      const targetPage = this.data.role === 'collector' 
        ? '/pages/collector/index/index' 
        : '/pages/verifier/index/index';
      wx.switchTab({ url: targetPage });
    }
  });
}
```
