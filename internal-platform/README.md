# 统一平台安装部署手册

本文覆盖工作区中的内部管理平台和云账号入口：People、Gateway Runtime、Gateway Admin、Gateway UI、Permission、Permission UI、Admin UI、文档中心、Sign-in 与 Cloud UI。SDK 仓库不是运行服务，不在部署范围内。

## 1. 架构与端口

| 服务 | 默认端口 | 作用 | 对外暴露建议 |
| --- | ---: | --- | --- |
| Permission Backend | 8081 | 权限与统一平台 Token | 仅通过控制台反向代理或受控 API 域名 |
| Gateway Runtime | 8082 | `/api/{inner|open}/{service}/**` 数据面 | 对业务调用方暴露 |
| Gateway Admin | 8083 | Gateway 配置管理面 | 仅管理网络或 Admin UI 反向代理 |
| Sign-in | 8084 | 云账号登录和凭据服务 | 登录接口可暴露，其余优先经 Gateway |
| People Backend | 8085 | 员工、部门、People OAuth | 仅健康检查直连，业务必须经 Gateway |
| Permission UI | 5174 | 权限独立控制台 | 按需暴露 |
| Gateway UI | 5175 | Gateway 独立控制台 | 按需暴露 |
| Cloud UI | 5176 | 云账号入口 | 对云用户暴露 |
| People UI | 5177 | People 管理与 OAuth 页面 | 对内部员工暴露 |
| Admin UI | 5178 | 内部系统统一入口 | 主要管理入口 |
| Document | 5180 | 接口文档中心 | 按需暴露 |

统一管理入口只登录一次：Admin UI 经 Permission 发起 People OAuth，取得平台 Token 后同时访问 Permission 和 Gateway Admin。Permission UI、Gateway UI 和 People UI 仍可独立部署和登录。

## 2. 环境准备

推荐 Linux x86_64，并准备：

- Go 1.24 或更高版本。People 的最低版本是 1.23，其余 Go 服务要求 1.24。
- JDK 21。Sign-in 使用仓库内 Maven Wrapper，不要求全局安装 Maven。
- Node.js 22 和 npm。
- C/C++ 编译工具链。Go 服务使用 SQLite CGO 驱动。
- `lsof`。仅 `gateway/start.sh` 和本地组合启动脚本需要。
- 生产环境的反向代理与 TLS 证书，例如 Nginx。

仓库应保持以下同级布局，目录名不可随意改变，因为本地组合脚本使用相对路径：

```text
code/
├── admin-ui/
├── cloud-ui/
├── document/
├── gateway/
│   ├── gateway/
│   ├── gateway-admin/
│   └── gateway-ui/
├── people/
│   ├── backend/
│   └── frontend/
├── permission/
│   ├── permission/
│   └── permission_ui/
└── sigin/
```

安装依赖：

```bash
cd code/gateway/gateway && go mod download
cd ../gateway-admin && go mod download
cd ../../people/backend && go mod download
cd ../../permission/permission && go mod download

cd ../../people/frontend && npm ci
cd ../../gateway/gateway-ui && npm ci
cd ../../permission/permission_ui && npm ci
cd ../../admin-ui && npm ci
cd ../cloud-ui && npm ci
cd ../document && npm ci

cd ../sigin && ./mvnw -DskipTests package
```

## 3. 必须一致的共享参数

部署前先生成随机密钥并保存在密钥管理系统，不要写入仓库。下列参数不是各自独立填写，它们必须成组一致。

| 参数组 | 使用位置 | 要求 |
| --- | --- | --- |
| Gateway 运行时 Token | Gateway `GATEWAY_RUNTIME_TOKEN`、Gateway Admin 同名变量 | 两端完全相同，至少 32 个字符 |
| Gateway 系统 AK/SK | Gateway Runtime、Gateway Admin 的 `GATEWAY_SIGNIN_ACCESS_KEY/SECRET_KEY`；Sign-in 的 `SIGNIN_INNER_GATEWAY_ACCESS_KEY/SECRET_KEY`；People 的 `PEOPLE_GATEWAY_ACCESS_KEY/SECRET_KEY` | 四处完全相同；用于 Gateway 调用 Sign-in Inner 和签名 People 上游请求 |
| Permission OAuth 客户端 | People 的 `PEOPLE_PERMISSION_CLIENT_ID/SECRET`；Permission 的 `PERMISSION_PEOPLE_CLIENT_ID/SECRET` | ID 和 Secret 完全相同；People 的回调白名单必须包含 Permission UI 与 Admin UI 的准确回调 URL |
| Gateway UI OAuth 客户端 | People 的 `PEOPLE_GATEWAY_CLIENT_ID/SECRET`；Gateway Admin 的 `GATEWAY_PEOPLE_CLIENT_ID/SECRET` | ID 和 Secret 完全相同；回调 URL 必须精确匹配 |
| 浏览器来源 | 各后端 `*_ALLOWED_ORIGINS` 与前端实际 Origin | 必须包含协议、主机和端口，不含路径，不使用 `*` |

所有 OAuth 地址都按字符串精确比较。例如平台地址为 `https://admin.example.com` 时，People 白名单中必须存在 `https://admin.example.com/oauth/callback`。更改 IP、端口或 HTTP/HTTPS 后必须同步修改两端并重启。

## 4. 服务参数

### 4.1 People Backend

以 `people/backend/.env.example` 为模板：

| 变量 | 说明 |
| --- | --- |
| `PEOPLE_ADDR` | HTTP 监听地址，默认 `:8085` |
| `PEOPLE_DB_DSN` | SQLite 文件路径；使用绝对路径便于持久化和备份 |
| `PEOPLE_GATEWAY_ACCESS_KEY` / `PEOPLE_GATEWAY_SECRET_KEY` | 校验 Gateway 上游签名的系统 AK/SK |
| `PEOPLE_SESSION_HOURS` | People Session 有效小时数 |
| `PEOPLE_COOKIE_SECURE` | HTTPS 生产环境设为 `true` |
| `PEOPLE_PERMISSION_CLIENT_ID` / `SECRET` | Permission 与 Admin UI 共用的 People OAuth 客户端 |
| `PEOPLE_PERMISSION_REDIRECT_URIS` | 允许的回调 URL，英文逗号分隔 |
| `PEOPLE_GATEWAY_CLIENT_ID` / `SECRET` | Gateway 独立控制台 OAuth 客户端 |
| `PEOPLE_GATEWAY_REDIRECT_URIS` | Gateway UI 回调 URL，英文逗号分隔 |

首次启动创建 `admin/admin`。生产部署后应立即登录修改密码。升级现有数据库时，原员工部门文本会自动迁移为部门实体。

### 4.2 Gateway Admin

以 `gateway/gateway-admin/.env.example` 为模板：

| 变量 | 说明 |
| --- | --- |
| `GATEWAY_ADMIN_ADDR` | 管理服务监听地址，默认 `:8083` |
| `GATEWAY_ADMIN_DB_DSN` | SQLite 配置数据库路径 |
| `GATEWAY_ADMIN_ALLOWED_ORIGINS` | Gateway UI 与 Admin UI Origin，逗号分隔 |
| `GATEWAY_CREDENTIAL_ENCRYPTION_KEY` | 加密服务 SK 的稳定主密钥；至少 32 字符，丢失后已有密文无法恢复 |
| `GATEWAY_RUNTIME_TOKEN` | 保护运行时配置快照，与 Runtime 一致 |
| `SIGNIN_UPSTREAM_URL` | Sign-in 内网地址，例如 `http://127.0.0.1:8084` |
| `PEOPLE_UPSTREAM_URL` | People Backend 内网地址，例如 `http://127.0.0.1:8085` |
| `GATEWAY_SELF_URL` | Runtime 可达地址，例如 `http://127.0.0.1:8082` |
| `GATEWAY_SIGNIN_ACCESS_KEY` / `SECRET_KEY` | Gateway 系统 AK/SK |
| `GATEWAY_PEOPLE_API_BASE_URL` | People Gateway Open 根地址，通常为 `${GATEWAY_SELF_URL}/api/open/people` |
| `GATEWAY_PEOPLE_AUTHORIZE_URL` | People UI OAuth 页面完整地址 |
| `GATEWAY_PEOPLE_CLIENT_ID` / `SECRET` | Gateway UI 的 People OAuth 客户端 |
| `GATEWAY_PEOPLE_REDIRECT_URI` | Gateway UI 精确回调地址 |
| `GATEWAY_PERMISSION_API_BASE_URL` | Permission API 根地址，供校验统一平台 Token |

Gateway Admin 每次启动都会幂等注册 Sign-in 和 People 的系统路由，包括员工与部门 API。应先让 Gateway Admin 成功启动，再依赖 Runtime 对外服务。

### 4.3 Gateway Runtime

| 变量 | 说明 |
| --- | --- |
| `GATEWAY_ADDR` | 数据面监听地址，默认 `:8082` |
| `GATEWAY_ADMIN_URL` | Gateway Admin 内网地址 |
| `GATEWAY_RUNTIME_TOKEN` | 拉取配置的 Token，与 Admin 一致 |
| `GATEWAY_CONFIG_REFRESH_SECONDS` | 配置刷新间隔秒数，默认 5 |
| `GATEWAY_SIGNATURE_SKEW_SECONDS` | 请求签名允许的时间偏差秒数，默认 300 |
| `SIGNIN_INNER_URL` | Sign-in Inner 的 Gateway 地址，通常为 Runtime 自身地址，不应直连 Sign-in |
| `GATEWAY_SIGNIN_ACCESS_KEY` / `SECRET_KEY` | Gateway 系统 AK/SK |

### 4.4 Permission Backend

以 `permission/permission/.env.example` 为模板：

| 变量 | 说明 |
| --- | --- |
| `PERMISSION_ADDR` | HTTP 监听地址，部署建议 `:8081` |
| `PERMISSION_DB_DRIVER` | `sqlite` 或 `mysql` |
| `PERMISSION_DB_DSN` | SQLite 文件或 MySQL DSN |
| `PERMISSION_JWT_SECRET` | JWT 签名密钥，使用强随机值 |
| `PERMISSION_CREDENTIAL_SECRET` | 应用凭据加密密钥，必须与 JWT 密钥不同并稳定保存 |
| `PERMISSION_ACCESS_TTL_MINUTES` | 访问 Token 有效分钟数 |
| `PERMISSION_REFRESH_TTL_HOURS` | 刷新 Token 有效小时数 |
| `PERMISSION_ALLOWED_ORIGINS` | Permission UI 与 Admin UI Origin |
| `PERMISSION_PEOPLE_API_BASE_URL` | People Gateway Open 根地址 |
| `PERMISSION_PEOPLE_AUTHORIZE_URL` | People UI 授权页完整地址 |
| `PERMISSION_PEOPLE_CLIENT_ID` / `SECRET` | 与 People Permission 客户端一致 |
| `PERMISSION_PEOPLE_REDIRECT_URI` | 当前前端的精确 OAuth 回调地址 |

SQLite 适合单机；多实例生产部署应使用 MySQL，共享同一组 JWT 与凭据密钥。默认管理员是 `admin/Admin@123456`，首次登录后立即修改。

### 4.5 Sign-in

| 变量 | 说明 |
| --- | --- |
| `SIGNIN_PORT` | HTTP 端口，默认 8084 |
| `SIGNIN_DB_PATH` | H2 文件库基础路径，生产使用持久卷 |
| `SIGNIN_DB_USERNAME` / `PASSWORD` | H2 数据库账号 |
| `SIGNIN_COOKIE_SECURE` | HTTPS 生产环境设为 `true` |
| `SIGNIN_ALLOWED_ORIGINS` | Cloud UI Origin |
| `SIGNIN_CREDENTIAL_ENCRYPTION_KEY` | 用户 AK/SK 的稳定加密主密钥 |
| `SIGNIN_INNER_GATEWAY_ACCESS_KEY` / `SECRET_KEY` | 与 Gateway 系统 AK/SK 一致 |
| `SIGNIN_VERIFICATION_CODE_EXPOSE` | 仅本地联调可为 `true`，生产必须为 `false` |
| `SIGNIN_VERIFICATION_CODE_WEBHOOK` | 生产验证码通知服务 URL |
| `SIGNIN_VERIFICATION_CODE_TOKEN` | 通知 Webhook Bearer Token |

### 4.6 前端构建参数

Vite 变量在执行 `npm run build` 时写入静态文件，运行后再修改环境变量不会生效，必须重新构建。

| 前端 | 关键变量 |
| --- | --- |
| People UI | `VITE_PEOPLE_API_BASE_URL=/api/open/people`；开发代理目标 `VITE_DEV_PROXY_TARGET` 指向 Runtime |
| Permission UI | `VITE_API_BASE_URL=/api/v1`、`VITE_OAUTH_REDIRECT_URI`、`VITE_PEOPLE_LOGIN_ORIGIN`、`VITE_PEOPLE_UI_URL`、`VITE_DOCUMENT_BASE_URL` |
| Gateway UI | `VITE_API_BASE_URL=/api/v1`、`VITE_OAUTH_REDIRECT_URI`、`VITE_PEOPLE_LOGIN_ORIGIN` |
| Admin UI | `VITE_PERMISSION_API_BASE_URL=/api/permission/v1`、`VITE_GATEWAY_ADMIN_API_BASE_URL=/api/gateway-admin/v1`、`VITE_OAUTH_REDIRECT_URI`、`VITE_PEOPLE_LOGIN_ORIGIN`、`VITE_PEOPLE_UI_URL`、`VITE_DOCUMENT_BASE_URL` |
| Cloud UI | `VITE_SIGNIN_API_BASE_URL=/api/v1`、`VITE_GATEWAY_API_BASE_URL=/api/open/signin`；开发代理分别由 `VITE_SIGNIN_PROXY_TARGET` 和 `VITE_GATEWAY_PROXY_TARGET` 指定 |
| Document | `VITE_PERMISSION_API_BASE_URL`，用于文档示例中的 Permission 地址 |

`VITE_*_PROXY_TARGET` 只被 Vite 开发服务器使用。生产环境由反向代理承担同样的路径转发。

## 5. 从零启动

以下命令适合单机联调。每个终端都在对应仓库根目录执行，并先按 `.env.example` 导出参数或由进程管理器注入。

1. 启动 Sign-in：

   ```bash
   cd code/sigin
   export SIGNIN_CREDENTIAL_ENCRYPTION_KEY='replace-with-stable-random-key'
   export SIGNIN_INNER_GATEWAY_ACCESS_KEY='gwak_gateway_local'
   export SIGNIN_INNER_GATEWAY_SECRET_KEY='replace-with-shared-secret'
   ./mvnw spring-boot:run
   ```

2. 启动 People Backend：

   ```bash
   cd code/people/backend
   go run ./cmd/server
   ```

3. 启动 Gateway Admin、Runtime 和独立 Gateway UI：

   ```bash
   cd code/gateway
   GATEWAY_PEOPLE_LOGIN_ORIGIN=http://10.251.237.216:5177 \
   GATEWAY_UI_ORIGIN=http://10.251.237.216:5175 \
   ADMIN_UI_ORIGIN=http://10.251.237.216:5178 \
   ./start.sh
   ```

4. 启动 People UI：

   ```bash
   cd code/people/frontend
   VITE_PEOPLE_API_BASE_URL=/api/open/people \
   VITE_DEV_PROXY_TARGET=http://127.0.0.1:8082 \
   npm run dev -- --host 0.0.0.0 --port 5177 --strictPort
   ```

5. 启动 Permission、独立控制台与文档站：

   ```bash
   cd code/permission
   PERMISSION_UI_ORIGIN=http://10.251.237.216:5174 \
   ADMIN_UI_ORIGIN=http://10.251.237.216:5178 \
   VITE_PEOPLE_LOGIN_ORIGIN=http://10.251.237.216:5177 \
   ./start.sh
   ```

6. 启动统一 Admin UI：

   ```bash
   cd code/admin-ui
   PEOPLE_LOGIN_ORIGIN=http://10.251.237.216:5177 \
   ADMIN_UI_OAUTH_REDIRECT_URI=http://10.251.237.216:5178/oauth/callback \
   ./start.sh
   ```

7. 如需云账号入口，启动 Cloud UI：

   ```bash
   cd code/cloud-ui
   npm run dev -- --host 0.0.0.0 --port 5176 --strictPort
   ```

启动后访问 `http://10.251.237.216:5178`。People 登录地址必须包含协议，即 `http://10.251.237.216:5177`，不能只填写 IP 或 `IP:端口`。

## 6. 生产构建与反向代理

构建后端：

```bash
cd code/people/backend && go build -o bin/people ./cmd/server
cd ../../gateway/gateway && go build -o bin/gateway ./cmd/server
cd ../gateway-admin && go build -o bin/gateway-admin ./cmd/server
cd ../../permission/permission && go build -o bin/permission ./cmd/server
cd ../../sigin && ./mvnw clean package
```

构建前端：

```bash
cd code/people/frontend && npm run build
cd ../../gateway/gateway-ui && npm run build
cd ../../permission/permission_ui && npm run build
cd ../../admin-ui && npm run build
cd ../cloud-ui && npm run build
cd ../document && npm run build
```

每个前端的 `dist/` 由静态 Web 服务器托管，并对 Vue Router 配置 `try_files $uri $uri/ /index.html`。反向代理至少需要以下映射：

| 站点 | 浏览器路径 | 上游 | 路径处理 |
| --- | --- | --- | --- |
| People UI | `/api/open/people/**` | Gateway Runtime `:8082` | 原路径转发 |
| Permission UI | `/api/v1/**` | Permission `:8081` | 原路径转发 |
| Gateway UI | `/api/v1/**` | Gateway Admin `:8083` | 原路径转发 |
| Admin UI | `/api/permission/**` | Permission `:8081` | 前缀 `/api/permission` 改写为 `/api` |
| Admin UI | `/api/gateway-admin/**` | Gateway Admin `:8083` | 前缀 `/api/gateway-admin` 改写为 `/api` |
| Cloud UI | `/api/v1/**` | Sign-in `:8084` | 原路径转发 |
| Cloud UI | `/api/open/**` | Gateway Runtime `:8082` | 原路径转发 |

People 的 `PEOPLE_SESSION`、`PEOPLE_XSRF` 以及 Sign-in 的 Session/CSRF Cookie 必须透传。不要缓存 OAuth 回调、鉴权 API 或带 Cookie 的响应。生产环境统一使用 HTTPS，并把 `PEOPLE_COOKIE_SECURE`、`SIGNIN_COOKIE_SECURE` 设为 `true`。

后端进程建议由 systemd 或容器编排管理。启动依赖顺序为数据库与持久卷、Sign-in/People/Permission、Gateway Admin、Gateway Runtime，最后是静态前端。Gateway Runtime 会持续刷新配置，但首次验收前应确认 Gateway Admin 已完成系统路由注册。

## 7. 健康检查与验收

```bash
curl -fsS http://127.0.0.1:8085/health
curl -fsS http://127.0.0.1:8083/health
curl -fsS http://127.0.0.1:8082/health
curl -fsS http://127.0.0.1:8081/health
curl -fsS http://127.0.0.1:8084/actuator/health
```

功能验收顺序：

1. 打开 People UI，用 `admin/admin` 登录并修改密码。
2. 新建一个启用部门，再新建普通员工；不选择部门时应被前后端同时拒绝。
3. 打开 Admin UI，经 People 完成一次 OAuth 登录。
4. 在系统卡片进入 Permission，再切换 Gateway，过程中不应再次登录。
5. 分别打开 Permission UI 与 Gateway UI，验证独立登录仍可用。
6. 登录 Cloud UI，验证登录后账号请求可经 Gateway Open Sign-in 返回。

## 8. 数据、升级与故障排查

持久化文件包括 People SQLite、Gateway Admin SQLite、Permission SQLite（若未使用 MySQL）和 Sign-in H2 数据目录。备份时同时保存数据库与稳定加密密钥；只有数据库而没有加密密钥，已有 SK 无法解密。升级前先停写并做一致性备份，再启动新版本执行自动迁移。

常见问题：

- “无法发起 People 登录”：检查前端 People 地址是否含 `http://` 或 `https://`，并重新构建 Vite 前端。
- “授权失败”：检查 People 回调白名单、Permission/Gateway Admin 的回调参数及 Client Secret 是否完全一致。
- 部门 API 404：重启 Gateway Admin 以幂等注册新路由，等待 Runtime 完成一次配置刷新。
- 登录成功但后续 401：检查反向代理是否透传 Cookie、`Authorization` 和 CSRF Header，以及 Secure Cookie 是否与 HTTPS 一致。
- 浏览器 CORS 拒绝：把实际 Origin 加入对应后端允许列表；Origin 不包含路径和末尾斜杠。
