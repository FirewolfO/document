# People 系统说明

People 用于统一管理企业内部员工信息，拥有与云账号 Sign-in 完全隔离的闭环账号体系，不提供注册入口。

## 访问架构

- People 管理前端默认地址为 `http://localhost:5177`。
- People 后端默认监听 `8085`，仅 `/health` 可直连。
- 所有业务请求统一访问 Gateway Open 路径 `/api/open/people/**`；Gateway 匹配显式匿名 Open 路由后，使用自己的系统凭据签名上游请求，并按路由配置转发 People Session Cookie 和 CSRF Header。
- People 后端校验 Gateway 上游签名，拒绝浏览器或其他服务绕过 Gateway 直连业务接口。

## 默认管理员

```text
用户名：admin
密码：admin
```

该账号在首次启动时幂等创建。生产环境部署后应立即登录并修改默认密码。

## 员工账号规则

People 不提供注册接口，员工由 People 管理员创建。普通员工新增和修改时必须通过 `departmentId` 选择一个已启用部门，管理员可以不设置部门。新员工没有初始密码，在 `mustChangePassword=true` 时登录不校验输入密码，并被限制为只能查看当前会话、退出或设置密码。只要未成功设置密码，下次登录仍按首次登录处理；设置后即使用 bcrypt 哈希保存并严格校验新密码。

部门由管理员按树形层级维护，上级关系通过 `parentId` 表示。停用部门不能再分配给员工，仍有关联员工或下级部门的部门不能删除；修改上级部门时会拒绝自引用和循环层级。部门改名会同步更新员工响应中的兼容字段 `department`。员工响应同时返回稳定的 `departmentId`。

## Open 接口

| 方法 | Gateway Open 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/open/people/auth/csrf` | 初始化 CSRF Cookie |
| `POST` | `/api/open/people/auth/login` | People 独立登录 |
| `GET` | `/api/open/people/auth/me` | 当前员工会话 |
| `POST` | `/api/open/people/auth/logout` | 退出并使会话失效 |
| `POST` | `/api/open/people/auth/change-password` | 首次设置或修改密码 |
| `GET/POST` | `/api/open/people/employees` | 员工列表与创建 |
| `PUT/DELETE` | `/api/open/people/employees/{id}` | 更新或停用员工 |
| `GET/POST` | `/api/open/people/departments` | 部门列表与创建（管理员） |
| `PUT/DELETE` | `/api/open/people/departments/{id}` | 更新或删除部门（管理员） |
| `POST` | `/api/open/people/oauth/authorize` | 创建 OAuth 授权码 |
| `POST` | `/api/open/people/oauth/token` | 授权码或客户端凭证换 Token |
| `GET` | `/api/open/people/oauth/userinfo` | 获取 OAuth 用户信息 |

## Inner 目录接口

Permission 不直接读取 People 数据库。Gateway Admin 会在 Inner 工作区创建 `people` 目标服务、`permission` 调用服务和专用 AK/SK，Permission 使用 Gateway HMAC 签名调用：

| 方法 | Gateway Inner 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/inner/people/directory/employees` | 全量员工目录 |
| `GET` | `/api/inner/people/directory/employees/{id}` | 单个员工及其当前部门 |
| `GET` | `/api/inner/people/directory/departments` | 全量部门及 `parentId` 层级 |

对应 People 上游路径为 `/api/v1/inner/directory/**`，并使用与 Open 路由不同的系统签名凭据。

## Permission OAuth 客户端

本地开发默认配置：

```text
Client ID: permission-ui
Client Secret: permission-local-client-secret-change-me
Redirect URI: http://localhost:5173/oauth/callback
```

Permission 前端从后端获取授权地址后跳转 People，回调时由 Permission 后端通过 Gateway Open 交换 Token、读取用户信息并同步员工目录。生产环境必须更换 Client Secret 并限制回调地址。
