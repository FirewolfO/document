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

## 员工账号与权限规则

People 不提供注册接口。员工号使用员工表自增整数主键，创建时禁止管理员输入，API 返回整数，界面统一按六位左补 `0` 展示，例如 `42` 显示为 `000042`。跨系统授权继续使用稳定的员工公开 ID `id`，员工号变化不会破坏 Permission 中已有关系。

People 通过 Permission 内置应用 `people_center` 校验管理能力。内置 admin 自动成为应用系统管理员；可在 Permission 中把员工加入可分配角色 `people_hr`。HR 可查看和维护员工档案、重置密码、停启用账号、查看人事概览并执行离职终审；部门结构只允许具备 `people.department:manage` 的应用管理员维护。员工创建接口始终创建普通员工，不能通过请求把员工提升为本地管理员。

新员工没有初始密码，在 `mustChangePassword=true` 时登录不校验输入密码，并被限制为只能查看当前会话、退出或设置密码。只要未成功设置密码，下次登录仍按首次登录处理；设置后即使用 bcrypt 哈希保存并严格校验新密码。

部门按树形层级维护，上级关系通过 `parentId` 表示，并可通过 `leaderId` 指定本部门在职员工作为负责人。停用部门不能再分配给员工，仍有关联员工或下级部门的部门不能删除；修改上级部门时会拒绝自引用和循环层级。部门改名会同步更新员工响应中的兼容字段 `department`。员工档案还包括用工类型、入职日期、试用期结束日期和工作地点。

除 admin 外的在职员工均可发起离职。申请先由提交时所在部门的负责人审批，通过后再由具备 `people.departure:review` 的 HR 终审；任一级驳回都会结束申请，HR 通过后自动停用账号并撤销会话与 OAuth Token。申请人可查看自己的申请，部门负责人可查看本人负责的申请，HR 可查看全部状态。页面轮询通知摘要，在线新增待办会弹出提醒，重新登录后右上角数字会显示尚未处理的通知和审批。

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
| `POST` | `/api/open/people/employees/{id}/reset-password` | 重置员工密码 |
| `PUT` | `/api/open/people/employees/{id}/enabled` | 停用或启用员工 |
| `GET/POST` | `/api/open/people/departments` | 部门列表与创建 |
| `PUT/DELETE` | `/api/open/people/departments/{id}` | 更新或删除部门 |
| `GET` | `/api/open/people/hr/dashboard` | 人事统计概览 |
| `GET/POST` | `/api/open/people/departures` | 查询或发起离职申请 |
| `POST` | `/api/open/people/departures/{id}/manager-review` | 部门负责人审批 |
| `POST` | `/api/open/people/departures/{id}/hr-review` | HR 终审 |
| `POST` | `/api/open/people/departures/{id}/cancel` | 申请人撤回 |
| `GET` | `/api/open/people/notifications/summary` | 未读通知和待审批数字 |
| `GET` | `/api/open/people/notifications` | 查询通知 |
| `POST` | `/api/open/people/notifications/{id}/read`、`/api/open/people/notifications/read-all` | 标记一条或全部通知已读 |
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

People 访问 Permission OpenAPI 的默认服务凭据为 `people-service` 和 `local-development-people-permission-secret-key`，仅用于服务端 HMAC 请求。生产环境必须在 People 与 Permission 两端配置同一组新凭据，禁止下发到浏览器。
