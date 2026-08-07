# 开发者文档中心

独立的 Vue 3 + Element Plus 接口文档系统。业务文档按目录维护，当前已录入权限系统的资源、角色、授权、鉴权和规范下载 OpenAPI。

## 文档目录

```text
src/content/
├── systems.ts
└── permission/
    ├── index.ts
    ├── common.ts
    ├── add-user-to-group.ts
    ├── remove-user-from-group.ts
    ├── permission-grants.ts
    ├── role-principals.ts
    ├── create-resource.ts
    ├── create-role.ts
    ├── download-spec.ts
    └── authorize.ts
```

签名协议和用户组接入的可独立阅读版本位于 `permission/README.md`。

统一管理平台及关联服务从空环境开始的安装、参数配置、启动顺序和生产部署说明见 [统一平台安装部署手册](internal-platform/README.md)。

每个接口文档都必须维护注意事项、前提条件、请求说明、请求参数、响应值、错误码、HTTP/Go/Java/Python 请求示例和返回示例。新增业务系统时，在 `src/content/` 下新增同级业务目录，并在 `systems.ts` 注册。

## 本地启动

```bash
npm install
npm run typecheck
npm run dev -- --host 0.0.0.0 --port 5180
```

- 系统选择：<http://localhost:5180/>
- 权限系统：<http://localhost:5180/systems/permission>
- 嵌入模式：<http://localhost:5180/systems/permission?embedded=1>

复制 `.env.example` 后可通过 `VITE_PERMISSION_API_BASE_URL` 配置文档展示和代码示例中的权限服务地址。

## 权限控制台内嵌

权限控制台通过 `VITE_DOCUMENT_BASE_URL` 指向本系统，并嵌入 `/systems/permission?embedded=1`。生产环境若跨域部署，应在文档站点的 Content Security Policy 中通过 `frame-ancestors` 仅放行权限控制台域名，不要使用会阻止目标域名嵌入的 `X-Frame-Options`。

## 验证

```bash
npm run typecheck
npm run build
```
