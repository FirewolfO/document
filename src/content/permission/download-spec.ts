import type { EndpointDocument } from '@/types/document'
import { baseUrl } from './common'

export const downloadSpecDocument: EndpointDocument = {
  id: 'download-spec',
  group: '开发工具',
  title: '下载 OpenAPI 规范',
  summary: '获取权限系统当前发布的 OpenAPI 3.1 JSON，可用于生成客户端、导入接口调试工具或校验服务端集成。',
  method: 'GET',
  path: '/openapi/spec',
  notices: [
    { label: '请求频率', value: '规范内容随服务版本发布，建议在构建阶段获取并缓存，不要在业务请求链路中重复调用。' },
    { label: '超时时间', value: '客户端超时建议设置为 5 秒；失败后可安全重试。' },
    { label: '响应格式', value: '成功时直接返回 OpenAPI 3.1 JSON，不使用权限系统通用响应信封。' },
  ],
  prerequisites: [
    '该接口公开访问，不需要 Client ID、Client Secret 或用户令牌。',
    '生成 SDK 前请固定规范版本并纳入代码评审，避免未审查的接口变化直接进入生产。',
  ],
  permissionRequirement: '公开接口，无需认证。',
  requestFields: [
    { name: 'Accept', location: 'Header', type: 'string', required: false, description: '建议声明接收 JSON。', example: 'application/json' },
  ],
  responseFields: [
    { name: 'openapi', location: 'Response', type: 'string', required: true, description: 'OpenAPI 规范版本。', example: '3.1.0' },
    { name: 'info', location: 'Response', type: 'object', required: true, description: '接口集合名称、版本和用途说明。', example: '{"title":"权限中心 OpenAPI","version":"1.3.0"}' },
    { name: 'servers', location: 'Response', type: 'array<object>', required: true, description: '规范中声明的 API 基础路径。', example: '[{"url":"/api/v1"}]' },
    { name: 'paths', location: 'Response', type: 'object', required: true, description: '对外接口路径、方法、请求体和响应定义。', example: '{"/openapi/authorize":{"post":{...}}}' },
    { name: 'components', location: 'Response', type: 'object', required: true, description: '认证方案、数据模型及通用错误响应。', example: '{"securitySchemes":{...},"schemas":{...}}' },
  ],
  errors: [],
  examples: {
    http: {
      label: 'HTTP',
      language: 'bash',
      code: `curl --request GET \\
  --url ${baseUrl}/openapi/spec \\
  --header 'Accept: application/json' \\
  --output permission-openapi.json`,
    },
    go: {
      label: 'Golang',
      language: 'go',
      code: `client := &http.Client{Timeout: 5 * time.Second}
request, err := http.NewRequestWithContext(
    context.Background(),
    http.MethodGet,
    "${baseUrl}/openapi/spec",
    nil,
)
if err != nil {
    log.Fatal(err)
}
request.Header.Set("Accept", "application/json")

response, err := client.Do(request)
if err != nil {
    log.Fatal(err)
}
defer response.Body.Close()

spec, err := io.ReadAll(response.Body)
if err != nil || response.StatusCode != http.StatusOK {
    log.Fatalf("download spec failed: status=%d err=%v", response.StatusCode, err)
}
fmt.Printf("%s", spec)`,
    },
    java: {
      label: 'Java',
      language: 'java',
      code: `HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .build();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/openapi/spec"))
    .timeout(Duration.ofSeconds(5))
    .header("Accept", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request,
    HttpResponse.BodyHandlers.ofString());
if (response.statusCode() != 200) {
    throw new IOException("download spec failed: HTTP " + response.statusCode());
}
System.out.println(response.body());`,
    },
    python: {
      label: 'Python',
      language: 'python',
      code: `from urllib.request import Request, urlopen

request = Request(
    "${baseUrl}/openapi/spec",
    headers={"Accept": "application/json"},
)
with urlopen(request, timeout=5) as response:
    spec = response.read().decode("utf-8")

print(spec)`,
    },
  },
  responseExample: `{
  "openapi": "3.1.0",
  "info": {
    "title": "权限中心 OpenAPI",
    "version": "1.3.0",
    "description": "供接入应用的服务端创建资源、角色和用户组，并完成授权与批量鉴权。"
  },
  "servers": [{"url": "/api/v1", "description": "当前权限中心"}],
  "paths": {
    "/openapi/authorize": {
      "post": {
        "operationId": "authorize",
        "security": [{"HmacSignature": []}]
      }
    }
  },
  "components": {
    "securitySchemes": {
      "HmacSignature": {"type": "apiKey", "in": "header", "name": "Authorization"}
    }
  }
}`,
}
