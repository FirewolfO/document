# 开发者文档中心

独立的 Vue 3 + Element Plus 接口文档系统。Open 与 Inner 接口按受众分区展示，业务文档按系统目录维护。当前已录入 Permission Open 接口，以及 People 的 Open 业务接口和 Inner 员工目录接口。

## 文档目录

```text
src/content/
├── systems.ts
├── people/
│   ├── index.ts
│   ├── common.ts
│   ├── open.ts
│   └── inner.ts
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

内部 Blog、Gateway Inner 调用链及 Garage 小文件存储的安装与验证见 [Blog 与小文件存储安装手册](blog/README.md)。

每个接口文档都必须维护注意事项、前提条件、请求说明、请求参数、响应值、错误码、HTTP/Go/Java/Python 请求示例和返回示例。新增业务系统时，在 `src/content/` 下新增同级业务目录，为每套文档声明 `audience: 'open' | 'inner'`，并在 `systems.ts` 注册。一个系统同时提供两类接口时，必须注册为两个独立的 `SystemDocument`，不得混合目录和调用凭据说明。

## 本地启动

```bash
npm install
npm run typecheck
npm run dev -- --host 0.0.0.0 --port 5180
```

- 接口类型选择：<http://localhost:5180/>
- Open 系统列表：<http://localhost:5180/open>
- Inner 系统列表：<http://localhost:5180/inner>
- Permission Open 文档：<http://localhost:5180/open/systems/permission>
- People Open 文档：<http://localhost:5180/open/systems/people>
- People Inner 文档：<http://localhost:5180/inner/systems/people>
- 嵌入模式：在 Open/Inner 系统列表或详情 URL 后附加 `?embedded=1`

复制 `.env.example` 后可通过 `VITE_PERMISSION_API_BASE_URL`、`VITE_PEOPLE_OPEN_API_BASE_URL` 和 `VITE_PEOPLE_INNER_API_BASE_URL` 配置文档展示和代码示例中的服务地址。

## 控制台内嵌

Cloud UI 通过 `VITE_DOCUMENT_BASE_URL` 嵌入 `/open?embedded=1`，Admin UI 嵌入 `/inner?embedded=1`。生产环境若跨域部署，应在文档站点的 Content Security Policy 中通过 `frame-ancestors` 仅放行这两个控制台域名，不要使用会阻止目标域名嵌入的 `X-Frame-Options`。

## 验证

```bash
npm run typecheck
npm run build
```
