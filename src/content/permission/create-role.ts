import type { EndpointDocument } from '@/types/document'
import {
  commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, pythonClient, signedCurlExample,
} from './common'

export const createRoleDocument: EndpointDocument = {
  id: 'create-role',
  group: '权限模型',
  title: '创建角色',
  summary: '在客户端凭证所属应用内创建角色，并通过权限编码关联已经存在的叶子权限。',
  method: 'POST',
  path: '/openapi/roles',
  notices: commonNotices('当前服务未设置硬限流；生产网关建议单应用不超过 20 QPS。'),
  prerequisites: [
    '角色引用的权限编码必须已存在于当前应用。',
    '角色编码在当前应用内唯一，建议使用稳定的业务语义编码。',
    '应用系统管理员角色由系统维护，无需通过本接口重复创建。',
  ],
  permissionRequirement: '应用客户端凭证；仅可在凭证所属应用内创建角色。',
  requestFields: [
    ...commonHeaders,
    { name: 'code', location: 'Body', type: 'string', required: true, description: '角色编码，最长 64 字符，只允许字母、数字、下划线、点和连字符。', example: 'editor' },
    { name: 'name', location: 'Body', type: 'string', required: true, description: '角色名称，最长 100 字符。', example: '编辑' },
    { name: 'description', location: 'Body', type: 'string', required: false, description: '角色说明，最长 500 字符。', example: '文章编辑人员' },
    { name: 'status', location: 'Body', type: 'string', required: false, description: 'enabled 或 disabled，省略时默认为 enabled。', example: 'enabled' },
    { name: 'permissionCodes', location: 'Body', type: 'array<string>', required: true, description: '需要关联的权限编码，最多 100 项；允许传空数组。', example: '["article:read","article:publish"]' },
  ],
  responseFields: [
    ...commonEnvelopeFields,
    { name: 'data.id', location: 'Response', type: 'integer', required: true, description: '角色 ID。', example: '12' },
    { name: 'data.applicationId', location: 'Response', type: 'integer', required: true, description: '所属应用 ID。', example: '2' },
    { name: 'data.code', location: 'Response', type: 'string', required: true, description: '角色编码。', example: 'editor' },
    { name: 'data.name', location: 'Response', type: 'string', required: true, description: '角色名称。', example: '编辑' },
    { name: 'data.status', location: 'Response', type: 'string', required: true, description: '角色状态。', example: 'enabled' },
    { name: 'data.permissions', location: 'Response', type: 'array<object>', required: true, description: '角色当前关联的权限列表。', example: '[{"code":"article:read"}]' },
  ],
  errors: [
    ...commonErrors,
    { httpStatus: 404, code: 'NOT_FOUND', description: 'permissionCodes 中存在不属于当前应用的权限编码。', resolution: '先创建对应资源权限，并确认所有权限编码属于客户端凭证所在应用。' },
    { httpStatus: 409, code: 'CONFLICT', description: '当前应用中已存在相同角色编码。', resolution: '更换角色编码，或在控制台维护已有角色。' },
  ],
  examples: {
    http: {
      label: 'HTTP', language: 'bash',
      code: signedCurlExample('POST', '/openapi/roles', `{
  "code": "editor",
  "name": "编辑",
  "description": "文章编辑人员",
  "status": "enabled",
  "permissionCodes": ["article:read", "article:publish"]
}`),
    },
    go: {
      label: 'Go SDK', language: 'go',
      code: `${goClient}

role, err := client.CreateRole(context.Background(), permission.CreateRoleRequest{
    Code:            "editor",
    Name:            "编辑",
    Description:     "文章编辑人员",
    Status:          "enabled",
    PermissionCodes: []string{"article:read", "article:publish"},
})
if err != nil {
    log.Fatal(err)
}
log.Printf("role=%s", role.Code)`,
    },
    java: {
      label: 'Java SDK', language: 'java',
      code: `${javaClient}

Role role = client.createRole(new CreateRoleRequest(
    "editor",
    "编辑",
    "文章编辑人员",
    "enabled",
    List.of("article:read", "article:publish")));
System.out.println(role.code);`,
    },
    python: {
      label: 'Python SDK', language: 'python',
      code: `${pythonClient}

role = client.create_role(
    code="editor",
    name="编辑",
    description="文章编辑人员",
    status="enabled",
    permission_codes=["article:read", "article:publish"],
)
print(role.code)`,
    },
  },
  responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "id": 12,
    "applicationId": 2,
    "code": "editor",
    "name": "编辑",
    "description": "文章编辑人员",
    "status": "enabled",
    "permissions": [
      {"id": 105, "code": "article:read", "name": "查看文章"},
      {"id": 106, "code": "article:publish", "name": "发布文章"}
    ]
  },
  "requestId": "req_01JY0TAM58R7JMA9P0D9RRYZAE"
}`,
}
