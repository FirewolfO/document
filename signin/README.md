# Sign-in 身份认证系统

Sign-in 是云服务统一身份认证后端，实际代码仓库目录和远端名称为 `sigin`。`cloud-ui` 是独立前端，二者通过 `/api/v1` HTTP API 协作。

## 当前能力

- 注册账号，可选绑定邮箱和手机号，注册成功后自动建立登录会话。
- 账号使用密码登录；已绑定的邮箱或手机号使用 6 位一次性验证码登录。
- 验证码 5 分钟过期、60 秒内不可重发、每小时最多发送 5 次、最多尝试 5 次，验证成功后立即失效。
- 使用浏览器 Cookie Session 恢复登录状态和退出登录。
- 查看基本资料，修改显示名称、邮箱、手机号、头像 URL 和登录密码。
- 管理用户级 API AK/SK；SK 使用独立主密钥加密，列表只返回掩码，用户显式复制时按凭据读取。
- 通过 Gateway-HMAC-SHA256 保护的 Inner 接口解析用户 AK/SK，或把浏览器会话换成 5 分钟短期 AK/SK。
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

Gateway 使用自身服务 AK/SK 调用 Sign-in Inner 接口。浏览器请求由 Gateway 携带 `CLOUD_SESSION` 换取短期用户凭据；编程请求则由 Gateway 解析有效用户 AK 并取得对应 SK 完成验签，具体 OpenAPI 是否允许编程访问由 Gateway 的 Open 路由配置决定。Inner 响应中的明文 SK 只允许在受签名保护的内部链路中传输，不得记录。

## 浏览器认证流程

1. 前端先调用 `GET /api/v1/auth/csrf`，接收可由 JavaScript 读取的 `XSRF-TOKEN` Cookie。
2. 账号登录调用密码接口；邮箱或手机号登录先请求验证码，再提交同一标识与验证码。
3. 注册、验证码发送、登录、退出、资料更新和密码修改请求携带 Cookie，并将其值放入 `X-XSRF-TOKEN` 请求头。
4. 注册或登录成功后，后端设置 `HttpOnly` 的 `CLOUD_SESSION` Cookie；前端不存储长期 Token。
5. 页面刷新时，前端调用 `GET /api/v1/auth/me` 恢复用户状态；返回 `401` 时进入登录注册页。

## API 摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/auth/csrf` | 初始化 CSRF Cookie |
| `POST` | `/api/v1/auth/register` | 注册并登录 |
| `POST` | `/api/v1/auth/login` | 账号密码登录 |
| `POST` | `/api/v1/auth/verification-codes` | 发送邮箱或手机号登录验证码 |
| `POST` | `/api/v1/auth/code-login` | 使用邮箱或手机号验证码登录 |
| `GET` | `/api/v1/auth/me` | 查询当前用户 |
| `POST` | `/api/v1/auth/logout` | 注销当前会话 |
| `PUT` | `/api/v1/account/profile` | 更新个人资料 |
| `PUT` | `/api/v1/account/password` | 校验当前密码后修改登录密码 |
| `GET` | `/api/v1/account/api-credentials` | 查询当前账号 API 密钥，SK 仅返回掩码 |
| `POST` | `/api/v1/account/api-credentials` | 创建用户 AK/SK，SK 仅本次返回 |
| `POST` | `/api/v1/account/api-credentials/{id}/secret` | 按需读取当前账号的一条 SK，用于显式复制 |
| `DELETE` | `/api/v1/account/api-credentials/{id}` | 删除当前账号的 API 密钥 |
| `POST` | `/api/v1/inner/credentials/resolve` | Gateway 解析用户 AK/SK（Inner） |
| `POST` | `/api/v1/inner/credentials/exchange` | Gateway 将浏览器会话换成短期 AK/SK（Inner） |

完整 OpenAPI 契约存放在 `sigin/src/main/resources/static/openapi.yaml`，服务启动后可通过 `GET /openapi.yaml` 获取。

## 数据结构

Flyway migration 创建 `accounts`、`login_verification_codes` 和 `api_credentials` 表。验证码表只保存验证码 BCrypt 摘要、账号、发送渠道、有效期、失败次数和消费时间，不保存或记录明文验证码。`api_credentials` 只保存加密后的 SK；列表返回掩码，显式复制接口在校验 Session、CSRF 和凭据归属后仅返回指定的一条 SK。数据库结构的后续变化必须继续以 migration 形式提交。

## Gateway Inner 认证

`/api/v1/inner/**` 不使用浏览器 CSRF，而是要求完整的 Gateway HMAC 请求头：`X-Gateway-Credential`、`X-Gateway-Signature`、`X-Gateway-Timestamp`、`X-Gateway-Nonce` 和 `X-Gateway-Content-SHA256`。签名算法及 canonical request 与 Gateway 运行时一致，并拒绝过期时间戳与重复 nonce。

部署时必须稳定配置 `SIGNIN_CREDENTIAL_ENCRYPTION_KEY`，否则已有用户 SK 无法解密；`SIGNIN_INNER_GATEWAY_ACCESS_KEY` 与 `SIGNIN_INNER_GATEWAY_SECRET_KEY` 必须使用 Gateway 服务在管理面生成的 AK/SK，并与 Gateway 的 `GATEWAY_SIGNIN_ACCESS_KEY`、`GATEWAY_SIGNIN_SECRET_KEY` 一致。

## 验证码发送

生产环境通过 `SIGNIN_VERIFICATION_CODE_WEBHOOK` 接入短信与邮件发送服务，可使用 `SIGNIN_VERIFICATION_CODE_TOKEN` 配置 Bearer Token。Webhook 接收 `channel`、`destination`、`code`、`purpose` 和 `expiresInSeconds` 字段。

本地开发可显式设置 `SIGNIN_VERIFICATION_CODE_EXPOSE=true`，让发送接口返回 `developmentCode` 供联调；生产环境必须关闭该开关。未绑定的邮箱或手机号也返回统一的受理响应，避免通过接口直接探测账号是否存在。

## 本地地址

- Sign-in API：`http://localhost:8084`
- Cloud UI：`http://localhost:5176`
- 健康检查：`http://localhost:8084/actuator/health`
