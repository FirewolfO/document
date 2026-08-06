import type { EndpointDocument } from '@/types/document'
import {
  commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, principalFields, pythonClient, signedCurlExample,
} from './common'

export const addUserToGroupDocument: EndpointDocument = {
  id: 'add-user-to-group',
  group: '用户组',
  title: '用户加入用户组',
  summary: '向当前应用的用户组追加一个成员。接口具备幂等性，不会覆盖组内已有成员、角色或直接权限。',
  method: 'POST',
  path: '/openapi/user-groups/{code}/members',
  notices: commonNotices('当前服务未设置硬限流；生产网关建议单应用不超过 50 QPS。'),
  prerequisites: [
    '用户组必须属于签名凭据对应的应用。',
    '用户主体固定使用 user，identifier 填 People 用户名。',
    '主体必须存在且处于启用状态；重复加入同一用户不会创建重复关系。',
    'Client Secret 只允许保存在业务服务端，并由 SDK 在本地计算 HMAC-SHA256。',
  ],
  permissionRequirement: '应用 HMAC 签名；只能操作签名凭据所属应用的用户组和主体。',
  requestFields: [
    ...commonHeaders,
    { name: 'code', location: 'Path', type: 'string', required: true, description: '用户组编码，最长 64 字符，只允许字母、数字、下划线、点和连字符。', example: 'content_team' },
    ...principalFields,
  ],
  responseFields: [
    ...commonEnvelopeFields,
    { name: 'data.groupCode', location: 'Response', type: 'string', required: true, description: '用户组编码。', example: 'content_team' },
    { name: 'data.principal.type', location: 'Response', type: 'string', required: true, description: '规范化后的主体类型。', example: 'user' },
    { name: 'data.principal.identifier', location: 'Response', type: 'string', required: true, description: '已加入用户组的 People 用户名。', example: 'zhangsan' },
    { name: 'data.added', location: 'Response', type: 'boolean', required: true, description: '本次是否新建成员关系；成员原本就在组内时为 false。', example: 'true' },
  ],
  errors: [
    ...commonErrors,
    { httpStatus: 404, code: 'NOT_FOUND', description: '用户组或主体不存在、已停用，或不属于当前应用。', resolution: '检查组编码、主体类型、主体标识以及签名凭据所属应用。' },
  ],
  examples: {
    http: {
      label: 'HTTP', language: 'bash',
      code: signedCurlExample('POST', '/openapi/user-groups/content_team/members', `{
  "principal": {"type": "user", "identifier": "zhangsan"}
}`),
    },
    go: {
      label: 'Go SDK', language: 'go',
      code: `${goClient}

result, err := client.AddUserToGroup(
    context.Background(),
    "content_team",
    permission.Principal{
        Type:       permission.PrincipalUser,
        Identifier: "zhangsan",
    },
)
if err != nil {
    log.Fatal(err)
}
log.Printf("added=%v", result.Added)`,
    },
    java: {
      label: 'Java SDK', language: 'java',
      code: `${javaClient}

UserGroupMemberResult result = client.addUserToGroup(
    "content_team",
    Principal.user("zhangsan"));
System.out.println(result.added);`,
    },
    python: {
      label: 'Python SDK', language: 'python',
      code: `${pythonClient}

result = client.add_user_to_group(
    "content_team",
    Principal.user("zhangsan"),
)
print(result.added)`,
    },
  },
  responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "groupCode": "content_team",
    "principal": {
      "type": "user",
      "identifier": "zhangsan"
    },
    "added": true
  },
  "requestId": "req_01K1K7H8Q4J2Y0W6V3T5B9N8M"
}`,
}
