import type { EndpointDocument, HttpMethod } from '@/types/document'
import {
  assignablePrincipalFields, commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, pythonClient, signedCurlExample,
} from './common'

function permissionGrantDocument(method: HttpMethod): EndpointDocument {
  const adding = method === 'POST'
  const action = adding ? '增加' : '移除'
  const sdkAction = adding ? 'Add' : 'Remove'
  const pythonAction = adding ? 'add' : 'remove'
  const body = `{
  "principals": [
    {"type": "subject", "identifier": "user-10086"},
    {"type": "group", "identifier": "content_team"}
  ],
  "permissionCodes": ["article:read", "article:publish"]
}`
  return {
    id: `${pythonAction}-permissions`,
    group: '授权管理',
    title: `批量${action}主体权限`,
    summary: `为多个用户或用户组${action}多个直接权限。接口采用幂等增量语义，不会覆盖主体已有的其他权限。`,
    method,
    path: '/openapi/permission-grants',
    notices: commonNotices('当前服务未设置硬限流；单次最多 100 个主体和 100 个权限编码。'),
    prerequisites: [
      '主体和权限必须属于签名凭据对应的应用；统一用户本身是全局共享的，但权限关系仍按权限所属应用隔离。',
      '统一用户应用可混合 user 和 group；自维护用户应用可混合 subject 和 group。',
      `${action}采用幂等语义；重复${action}不会报错，changedCount 只统计实际变化的关系数。`,
      ...(adding ? [] : ['API 网关和反向代理必须允许并完整转发 DELETE 的 JSON 请求体。']),
    ],
    permissionRequirement: '应用 HMAC 签名；只能修改签名凭据所属应用的直接权限关系。',
    requestFields: [
      ...commonHeaders,
      ...assignablePrincipalFields,
      { name: 'permissionCodes', location: 'Body', type: 'array<string>', required: true, description: '需要增量操作的叶子权限编码，至少 1 项、最多 100 项。', example: '["article:read","article:publish"]' },
    ],
    responseFields: [
      ...commonEnvelopeFields,
      { name: 'data.principals', location: 'Response', type: 'array<object>', required: true, description: '规范化并去重后的主体列表。' },
      { name: 'data.permissionCodes', location: 'Response', type: 'array<string>', required: true, description: '规范化并去重后的权限编码。' },
      { name: 'data.changedCount', location: 'Response', type: 'integer', required: true, description: '本次实际增加或移除的主体-权限关系数量。', example: '4' },
    ],
    errors: [
      ...commonErrors,
      { httpStatus: 404, code: 'NOT_FOUND', description: '主体或用户组不存在、已停用，或不属于当前应用。', resolution: '检查主体类型、标识和签名凭据所属应用。' },
    ],
    examples: {
      http: { label: 'HTTP', language: 'bash', code: signedCurlExample(method, '/openapi/permission-grants', body) },
      go: {
        label: 'Go SDK', language: 'go',
        code: `${goClient}

result, err := client.${sdkAction}Permissions(context.Background(), permission.PermissionMutationRequest{
    Principals: []permission.Principal{
        {Type: permission.PrincipalSubject, Identifier: "user-10086"},
        {Type: permission.PrincipalGroup, Identifier: "content_team"},
    },
    PermissionCodes: []string{"article:read", "article:publish"},
})
if err != nil {
    log.Fatal(err)
}
log.Printf("changed=%d", result.ChangedCount)`,
      },
      java: {
        label: 'Java SDK', language: 'java',
        code: `${javaClient}

RelationMutationResult result = client.${pythonAction}Permissions(
    List.of(
        Principal.subject("user-10086"),
        Principal.group("content_team")),
    List.of("article:read", "article:publish"));
System.out.println(result.changedCount);`,
      },
      python: {
        label: 'Python SDK', language: 'python',
        code: `${pythonClient}

result = client.${pythonAction}_permissions(
    [Principal.subject("user-10086"), Principal.group("content_team")],
    ["article:read", "article:publish"],
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
    "permissionCodes": ["article:read", "article:publish"],
    "changedCount": 4
  },
  "requestId": "req_01K1K7MUTATION000000000001"
}`,
  }
}

export const addPermissionsDocument = permissionGrantDocument('POST')
export const removePermissionsDocument = permissionGrantDocument('DELETE')
