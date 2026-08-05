# Sign-in 身份认证系统

Sign-in 是云服务统一身份认证后端，实际代码仓库目录和远端名称为 `sigin`。`cloud-ui` 是独立前端，二者通过 `/api/v1` HTTP API 协作。

## 当前能力

- 注册账号，可选绑定邮箱和手机号，注册成功后自动建立登录会话。
- 支持账号、邮箱、手机号三种登录标识；邮箱和账号不区分大小写，手机号使用 E.164 格式。
- 使用浏览器 Cookie Session 恢复登录状态和退出登录。
- 查看基本资料，修改显示名称、邮箱、手机号和头像 URL。
- 邮箱、手机号和账号均有服务层检查与数据库唯一约束。

## 系统边界

Sign-in 只负责确认用户身份以及维护认证账号。资源、角色和操作授权仍由 `permission` 系统负责；云产品页面及登录注册交互由 `cloud-ui` 负责。

```text
Browser (cloud-ui :5176)
        |
        | /api/v1, Cookie Session + CSRF
        v
Sign-in (:8084)
        |
        | JPA + Flyway
        v
accounts database
```

## 浏览器认证流程

1. 前端先调用 `GET /api/v1/auth/csrf`，接收可由 JavaScript 读取的 `XSRF-TOKEN` Cookie。
2. 注册、登录、退出和资料更新请求携带 Cookie，并将其值放入 `X-XSRF-TOKEN` 请求头。
3. 注册或登录成功后，后端设置 `HttpOnly` 的 `CLOUD_SESSION` Cookie；前端不存储长期 Token。
4. 页面刷新时，前端调用 `GET /api/v1/auth/me` 恢复用户状态；返回 `401` 时进入登录注册页。

## API 摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/auth/csrf` | 初始化 CSRF Cookie |
| `POST` | `/api/v1/auth/register` | 注册并登录 |
| `POST` | `/api/v1/auth/login` | 登录 |
| `GET` | `/api/v1/auth/me` | 查询当前用户 |
| `POST` | `/api/v1/auth/logout` | 注销当前会话 |
| `PUT` | `/api/v1/account/profile` | 更新个人资料 |

完整 OpenAPI 契约存放在 `sigin/src/main/resources/static/openapi.yaml`，服务启动后可通过 `GET /openapi.yaml` 获取。

## 数据结构

当前 Flyway migration 创建 `accounts` 表，保存 UUID、账号规范化值、BCrypt 密码摘要、显示名称、邮箱、手机号、头像地址、账号状态、登录时间、创建更新时间和乐观锁版本。数据库结构的后续变化必须继续以 migration 形式提交。

## 本地地址

- Sign-in API：`http://localhost:8084`
- Cloud UI：`http://localhost:5176`
- 健康检查：`http://localhost:8084/actuator/health`
