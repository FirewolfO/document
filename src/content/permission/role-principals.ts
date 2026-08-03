import type { EndpointDocument, HttpMethod } from '@/types/document'
import {
  assignablePrincipalFields, commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, pythonClient, signedCurlExample,
} from './common'

function rolePrincipalDocument(method: HttpMethod): EndpointDocument {
  const adding = method === 'POST'
  const action = adding ? '增加' : '移除'
  const sdkAction = adding ? 'Add' : 'Remove'
  const pythonAction = adding ? 'add' : 'remove'
  const body = `{
  "principals": [
    {"type": "subject", "identifier": "user-10086"},
    {"type": "group", "identifier": "content_team"}
  ]
}`
  return {
    id: `${pythonAction}-role-principals`,
    group: '角色管理',
    title: `批量${action}角色主体`,
    summary: `为普通角色${action}多个用户或用户组。接口采用幂等增量语义，不会覆盖角色已有的其他主体。`,
    method,
    path: '/openapi/roles/{code}/principals',
    notices: commonNotices('当前服务未设置硬限流；单次最多处理 100 个主体。'),
    prerequisites: [
      '角色、用户组和应用级用户必须属于签名凭据对应的应用。',
      '统一用户应用可混合 user 和 group；自维护用户应用可混合 subject 和 group。',
      `${adding ? '增加主体时角色必须已启用；移除主体允许处理已停用角色。' : '移除主体允许处理已停用角色。'}内置系统管理员角色不允许通过 OpenAPI 修改主体。`,
      ...(adding ? [] : ['API 网关和反向代理必须允许并完整转发 DELETE 的 JSON 请求体。']),
    ],
    permissionRequirement: '应用 HMAC 签名；只能修改签名凭据所属应用的普通角色主体关系。',
    requestFields: [
      ...commonHeaders,
      { name: 'code', location: 'Path', type: 'string', required: true, description: '角色编码，最长 64 字符。', example: 'editor' },
      ...assignablePrincipalFields,
    ],
    responseFields: [
      ...commonEnvelopeFields,
      { name: 'data.principals', location: 'Response', type: 'array<object>', required: true, description: '规范化并去重后的主体列表。' },
      { name: 'data.roleCode', location: 'Response', type: 'string', required: true, description: '本次操作的角色编码。', example: 'editor' },
      { name: 'data.changedCount', location: 'Response', type: 'integer', required: true, description: '本次实际增加或移除的角色主体关系数量。', example: '2' },
    ],
    errors: [
      ...commonErrors,
      { httpStatus: 404, code: 'NOT_FOUND', description: '角色或主体不存在、已停用，或不属于当前应用。', resolution: '检查角色编码、主体标识和应用归属。' },
    ],
    examples: {
      http: { label: 'HTTP', language: 'bash', code: signedCurlExample(method, '/openapi/roles/editor/principals', body) },
      go: {
        label: 'Go SDK', language: 'go',
        code: `${goClient}

result, err := client.${sdkAction}RolePrincipals(
    context.Background(),
    "editor",
    []permission.Principal{
        {Type: permission.PrincipalSubject, Identifier: "user-10086"},
        {Type: permission.PrincipalGroup, Identifier: "content_team"},
    },
)
if err != nil {
    log.Fatal(err)
}
log.Printf("changed=%d", result.ChangedCount)`,
      },
      java: {
        label: 'Java SDK', language: 'java',
        code: `${javaClient}

RelationMutationResult result = client.${pythonAction}RolePrincipals(
    "editor",
    List.of(
        Principal.subject("user-10086"),
        Principal.group("content_team")));
System.out.println(result.changedCount);`,
      },
      python: {
        label: 'Python SDK', language: 'python',
        code: `${pythonClient}

result = client.${pythonAction}_role_principals(
    "editor",
    [Principal.subject("user-10086"), Principal.group("content_team")],
)
print(result.changed_count)`,
      },
    },
    responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "principals": [
      {"type": "subject", "identifier": "user-10086"},
      {"type": "group", "identifier": "content_team"}
    ],
    "roleCode": "editor",
    "changedCount": 2
  },
  "requestId": "req_01K1K7ROLE00000000000001"
}`,
  }
}

export const addRolePrincipalsDocument = rolePrincipalDocument('POST')
export const removeRolePrincipalsDocument = rolePrincipalDocument('DELETE')
