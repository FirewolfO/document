# Blog 与小文件存储安装手册

## 选型

Blog 使用 [Garage](https://garagehq.deuxfleurs.fr/) `v2.3.0` 作为小文件存储。Garage 提供 S3 兼容接口，单二进制即可运行；`v2.3.0` 支持 `--single-node` 与 `--default-bucket` 自动完成单节点布局、访问密钥和默认 bucket 初始化，适合本地内部博客的小图片场景。

单节点没有副本冗余。生产环境至少需要规划多节点、独立磁盘、备份、TLS、密钥轮换和监控，不能直接沿用本文的本地配置。

## 自动安装

Blog 仓库提供幂等安装脚本：

```bash
cd /data00/home/liuxing.110/code/blog
chmod +x start.sh stop.sh storage/*.sh
./storage/install.sh
./storage/start.sh
```

安装过程：

1. 从 Garage 官方发布页下载 Linux AMD64 `v2.3.0` 二进制到 `blog/.runtime/bin/garage`。
2. 首次启动时生成随机 `rpc_secret`、`admin_token` 和 `metrics_token`。
3. 元数据持久化到 `blog/.runtime/garage/meta`，对象持久化到 `blog/.runtime/garage/data`。
4. 使用 `garage server --single-node --default-bucket` 创建 `blog-media` bucket，并授权 Blog 使用本地 S3 凭据。
5. 监听 `127.0.0.1:3900`（S3）、`3901`（RPC）、`3902`（Web）和 `3903`（Admin）。

检查状态：

```bash
GARAGE_CONFIG_FILE=/data00/home/liuxing.110/code/blog/.runtime/garage.toml \
  /data00/home/liuxing.110/code/blog/.runtime/bin/garage status
```

## Blog 架构

```text
独立 Blog UI -- People OAuth -----------+
                                          |
统一 Admin UI -- Permission access token +--> Blog BFF
                                               |
                                               | Gateway-HMAC-SHA256
                                               v
                                        Gateway Inner /blog
                                               |
                                               v
                                         Blog 内部 API
                                          |          |
                                       SQLite      Garage S3
```

浏览器不会接触 Gateway AK/SK。Blog BFF 先验证本地 People OAuth 会话或 Admin UI 的 Permission 令牌；Admin UI 读请求要求 `svc.inner.blog:view`，写请求要求 `svc.inner.blog:manage`。随后 BFF 把规范请求体签名后发送到 Gateway Inner；Blog 内部 API 还会验证 Gateway 转发时生成的上游签名与 nonce，不能被浏览器直接绕过。

## 启动与验证

```bash
cd /data00/home/liuxing.110/code/blog
npm --prefix frontend install
./start.sh

curl http://127.0.0.1:8086/health
curl -I http://127.0.0.1:5179/
```

独立 Blog 页面为 `http://localhost:5179`，统一管理入口中的 Blog 模块为 `http://localhost:5178/blog/dashboard`。图片上传后返回相对地址 `/media/{id}`，独立前端和 Admin UI 都会把该路径代理到 Blog 后端；响应使用正确的图片 Content-Type，可直接用于 `<img>` 展示，也不会把远程访问者错误地导向其本机 `localhost`。

## 配置

常用环境变量：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `BLOG_ADDR` | `:8086` | Blog API 监听地址 |
| `BLOG_GATEWAY_INNER_BASE_URL` | `http://127.0.0.1:8082/api/inner/blog` | Gateway Inner 入口 |
| `BLOG_PERMISSION_API_BASE_URL` | `http://127.0.0.1:8081/api/v1` | Admin UI 令牌验证地址 |
| `BLOG_PEOPLE_API_BASE_URL` | `http://127.0.0.1:8082/api/open/people` | People OAuth Token/UserInfo 地址 |
| `BLOG_STORAGE_ENDPOINT` | `127.0.0.1:3900` | Garage S3 地址 |
| `BLOG_STORAGE_BUCKET` | `blog-media` | 图片 bucket |
| `BLOG_MAX_UPLOAD_BYTES` | `5242880` | 单图片最大字节数 |

生产环境必须覆盖 OAuth Client Secret、Gateway Secret Key 与 Storage Secret Key，不得提交真实密钥。
