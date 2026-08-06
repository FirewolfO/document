import type { EndpointDocument } from '@/types/document'
import {
  commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, principalFields, pythonClient, signedCurlExample,
} from './common'

export const authorizeDocument: EndpointDocument = {
  id: 'authorize',
  group: '授权管理',
  title: '批量鉴权',
  summary: '合并主体的角色权限与个人直接权限后批量判断权限编码。未知权限编码不会报错，按 false 返回。',
  method: 'POST',
  path: '/openapi/authorize',
  notices: commonNotices('当前服务未设置硬限流；生产网关建议单应用不超过 100 QPS，每次最多判断 100 个权限码。'),
  prerequisites: [
    'People 用户必须存在且处于启用状态。',
    '鉴权应在业务后端执行；不得把 Client Secret 下发到官网、浏览器或移动端。',
    '默认拒绝：未知权限、未授权权限和停用主体均不可放行业务操作。',
  ],
  permissionRequirement: '应用客户端凭证；只计算主体在凭证所属应用内的有效权限。',
  requestFields: [
    ...commonHeaders,
    ...principalFields,
    { name: 'permissions', location: 'Body', type: 'array<string>', required: true, description: '需要判断的权限编码，至少 1 项、最多 100 项，每项最长 128 字符。', example: '["article:read","article:delete"]' },
  ],
  responseFields: [
    ...commonEnvelopeFields,
    { name: 'data.principal.type', location: 'Response', type: 'string', required: true, description: '规范化后的主体类型。', example: 'user' },
    { name: 'data.principal.identifier', location: 'Response', type: 'string', required: true, description: 'People 用户名。', example: 'zhangsan' },
    { name: 'data.permissions', location: 'Response', type: 'object<string, boolean>', required: true, description: '权限编码到鉴权结果的映射；true 表示允许，false 表示拒绝。', example: '{"article:read":true,"article:delete":false}' },
  ],
  errors: [
    ...commonErrors,
    { httpStatus: 404, code: 'NOT_FOUND', description: '指定 People 用户不存在或已经停用。', resolution: '确认 People 用户名正确且员工账号处于启用状态。' },
  ],
  examples: {
    http: {
      label: 'HTTP', language: 'bash',
      code: signedCurlExample('POST', '/openapi/authorize', `{
  "principal": {"type": "user", "identifier": "zhangsan"},
  "permissions": ["article:read", "article:delete"]
}`),
    },
    go: {
      label: 'Go SDK', language: 'go',
      code: `${goClient}

principal := permission.Principal{
    Type:       permission.PrincipalUser,
    Identifier: "zhangsan",
}
result, err := client.Authorize(context.Background(), permission.AuthorizeRequest{
    Principal:   principal,
    Permissions: []string{"article:read", "article:delete"},
})
if err != nil {
    log.Fatal(err)
}
log.Printf("canRead=%v", result.Permissions["article:read"])

// 单权限也可以使用 client.Can(ctx, principal, "article:read")`,
    },
    java: {
      label: 'Java SDK', language: 'java',
      code: `${javaClient}

Principal principal = Principal.user("zhangsan");
AuthorizeResult result = client.authorize(new AuthorizeRequest(
    principal,
    List.of("article:read", "article:delete")));
System.out.println(result.permissions.get("article:read"));

// 单权限也可以使用 client.can(principal, "article:read")`,
    },
    python: {
      label: 'Python SDK', language: 'python',
      code: `${pythonClient}

principal = Principal.user("zhangsan")
result = client.authorize(
    principal,
    ["article:read", "article:delete"],
)
print(result.permissions["article:read"])

# 单权限也可以使用 client.can(principal, "article:read")`,
    },
  },
  responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "principal": {
      "type": "user",
      "identifier": "zhangsan"
    },
    "permissions": {
      "article:read": true,
      "article:delete": false
    }
  },
  "requestId": "req_01JY0TEQN9ERZST1J6AK4FZ59N"
}`,
}
