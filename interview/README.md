# P8 面试宝典部署说明

## 组件

- `interview/backend/`：Go API，默认监听 `8088`
- `interview/frontend/`：Vue 3 独立页面，默认监听 `5182`
- `cloud-ui/`：统一云控制台产品入口

系统允许匿名使用，不依赖 Sign-in、People、Permission 或 Gateway。浏览器第一次访问会生成随机学习者标识，后端按该标识隔离学习和模拟面试数据。

## 从零启动

环境要求：Go 1.24 或以上、Node.js 22、npm 10，以及 C 编译器（SQLite 驱动需要 CGO）。

```bash
cd /path/to/code/interview
cp backend/.env.example backend/.env
npm --prefix frontend install
./start.sh
```

启动后访问：

- Web：`http://localhost:5182`
- API 健康检查：`http://localhost:8088/health`

`start.sh` 会将编译结果和日志写入 `interview/.runtime/`。前后端端口必须空闲。

## 配置

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `INTERVIEW_ADDR` | `:8088` | API 监听地址 |
| `INTERVIEW_DB_DSN` | `interview.db` | SQLite DSN，相对路径基于 `backend/` |
| `INTERVIEW_ALLOWED_ORIGINS` | `localhost/127.0.0.1/工作区 IP:5182` | 允许跨域访问 API 的前端来源，逗号分隔 |
| `VITE_INTERVIEW_API_BASE_URL` | `/api/v1` | 前端 API 前缀 |
| `VITE_INTERVIEW_PROXY_TARGET` | `http://127.0.0.1:8088` | Vite 开发代理目标 |
| `VITE_INTERVIEW_BASE_URL` | 当前主机 `5182` 端口 | Cloud Console 的产品入口地址 |

## 数据与备份

默认数据文件为 `interview/backend/interview.db`。知识分类、知识点、Mermaid 图、题库、学习进度、复习计划、模拟面试会话和用户答案均存入该数据库。内置知识使用 `content_versions` 表进行版本控制，服务启动时幂等升级。

浏览器只在 `localStorage` 保存随机 `p8_interview_learner_id`。它不是认证凭据，清除浏览器数据会生成新的学习者标识；如需延续原进度，应保留该值。生产备份 SQLite 时应使用 SQLite 在线备份机制或在停止写入后复制数据库及 WAL 文件，不能只复制正在写入的主文件。

## Cloud Console 接入

在 `cloud-ui` 的构建环境设置：

```bash
VITE_INTERVIEW_BASE_URL=https://interview.example.com
```

Cloud Console 首页将显示“P8 面试宝典”产品，点击后打开该地址。系统本身不要求 Cloud Console 登录态，用户也可以直接访问独立页面。
