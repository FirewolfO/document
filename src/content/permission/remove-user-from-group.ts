import type { EndpointDocument } from '@/types/document'
import {
  commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, principalFields, pythonClient, signedCurlExample,
} from './common'

export const removeUserFromGroupDocument: EndpointDocument = {
  id: 'remove-user-from-group',
  group: '用户组',
  title: '用户移出用户组',
  summary: '从当前应用的用户组移除一个成员。接口具备幂等性，不影响该用户的直接权限或其他用户组关系。',
  method: 'DELETE',
  path: '/openapi/user-groups/{code}/members',
  notices: commonNotices('当前服务未设置硬限流；生产网关建议单应用不超过 50 QPS。'),
  prerequisites: [
    '用户组必须属于签名凭据对应的应用。',
    '用户主体固定使用 user，identifier 填 People 用户名。',
    '重复移除同一用户不会报错，removed=false 表示请求前已不在组内。',
    'API 网关和反向代理必须允许并完整转发 DELETE 的 JSON 请求体。',
  ],
  permissionRequirement: '应用 HMAC 签名；只能操作签名凭据所属应用的用户组。',
  requestFields: [
    ...commonHeaders,
    { name: 'code', location: 'Path', type: 'string', required: true, description: '用户组编码，最长 64 字符。', example: 'content_team' },
    ...principalFields,
  ],
  responseFields: [
    ...commonEnvelopeFields,
    { name: 'data.groupCode', location: 'Response', type: 'string', required: true, description: '用户组编码。', example: 'content_team' },
    { name: 'data.principal', location: 'Response', type: 'object', required: true, description: '规范化后的用户主体。' },
    { name: 'data.removed', location: 'Response', type: 'boolean', required: true, description: '本次是否实际移除了成员关系。', example: 'true' },
  ],
  errors: [
    ...commonErrors,
    { httpStatus: 404, code: 'NOT_FOUND', description: '用户组或用户不存在、已停用，或不属于当前应用。', resolution: '检查组编码、用户标识和应用归属。' },
  ],
  examples: {
    http: {
      label: 'HTTP', language: 'bash',
      code: signedCurlExample('DELETE', '/openapi/user-groups/content_team/members', `{
  "principal": {"type": "user", "identifier": "zhangsan"}
}`),
    },
    go: {
      label: 'Go SDK', language: 'go',
      code: `${goClient}

result, err := client.RemoveUserFromGroup(
    context.Background(),
    "content_team",
    permission.Principal{Type: permission.PrincipalUser, Identifier: "zhangsan"},
)
if err != nil {
    log.Fatal(err)
}
log.Printf("removed=%v", result.Removed)`,
    },
    java: {
      label: 'Java SDK', language: 'java',
      code: `${javaClient}

UserGroupMemberRemovalResult result = client.removeUserFromGroup(
    "content_team", Principal.user("zhangsan"));
System.out.println(result.removed);`,
    },
    python: {
      label: 'Python SDK', language: 'python',
      code: `${pythonClient}

result = client.remove_user_from_group(
    "content_team", Principal.user("zhangsan")
)
print(result.removed)`,
    },
  },
  responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "groupCode": "content_team",
    "principal": {"type": "user", "identifier": "zhangsan"},
    "removed": true
  },
  "requestId": "req_01K1K7GROUPREMOVE00000001"
}`,
}
