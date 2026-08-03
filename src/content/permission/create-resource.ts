import type { EndpointDocument } from '@/types/document'
import {
  commonEnvelopeFields, commonErrors, commonHeaders, commonNotices,
  goClient, javaClient, pythonClient, signedCurlExample,
} from './common'

export const createResourceDocument: EndpointDocument = {
  id: 'create-resource',
  group: '权限模型',
  title: '创建资源',
  summary: '创建资源分组，并将动作自动转换为 resource:action 格式的叶子权限。新权限会自动关联当前应用的系统管理员角色。',
  method: 'POST',
  path: '/openapi/resources',
  notices: commonNotices('当前服务未设置硬限流；生产网关建议单应用不超过 20 QPS。'),
  prerequisites: [
    '应用处于启用状态，并已取得当前 Client ID 和 Client Secret。',
    '资源编码在当前应用内唯一；动作编码在本次请求内不可重复。',
    'Client Secret 只能由业务服务端持有，浏览器或移动端必须先请求业务后端。',
  ],
  permissionRequirement: '应用客户端凭证；仅可为凭证所属应用创建资源和权限。',
  requestFields: [
    ...commonHeaders,
    { name: 'code', location: 'Body', type: 'string', required: true, description: '资源编码，最长 64 字符，只允许字母、数字、下划线、点和连字符。', example: 'article' },
    { name: 'name', location: 'Body', type: 'string', required: true, description: '资源名称，最长 100 字符。', example: '文章' },
    { name: 'description', location: 'Body', type: 'string', required: false, description: '资源说明，最长 500 字符。', example: '内容文章' },
    { name: 'actions', location: 'Body', type: 'array<object>', required: true, description: '动作列表，至少 1 项、最多 100 项。', example: '[{"code":"read","name":"查看文章"}]' },
    { name: 'actions[].code', location: 'Body', type: 'string', required: true, description: '动作编码，规则与资源编码相同。最终权限编码为 resource:action，拼接后最长 128 字符。', example: 'read' },
    { name: 'actions[].name', location: 'Body', type: 'string', required: true, description: '动作名称，最长 100 字符。', example: '查看文章' },
    { name: 'actions[].description', location: 'Body', type: 'string', required: false, description: '动作说明，最长 500 字符。', example: '允许查看文章详情' },
  ],
  responseFields: [
    ...commonEnvelopeFields,
    { name: 'data.id', location: 'Response', type: 'integer', required: true, description: '资源分组 ID。', example: '21' },
    { name: 'data.code', location: 'Response', type: 'string', required: true, description: '资源编码。', example: 'article' },
    { name: 'data.name', location: 'Response', type: 'string', required: true, description: '资源名称。', example: '文章' },
    { name: 'data.description', location: 'Response', type: 'string', required: true, description: '资源说明。', example: '内容文章' },
    { name: 'data.permissions', location: 'Response', type: 'array<object>', required: true, description: '本次创建的叶子权限列表。', example: '[{"code":"article:read"}]' },
    { name: 'data.permissions[].code', location: 'Response', type: 'string', required: true, description: '完整权限编码。', example: 'article:read' },
    { name: 'data.permissions[].resource', location: 'Response', type: 'string', required: true, description: '资源编码。', example: 'article' },
    { name: 'data.permissions[].action', location: 'Response', type: 'string', required: true, description: '动作编码。', example: 'read' },
  ],
  errors: [
    ...commonErrors,
    { httpStatus: 409, code: 'CONFLICT', description: '当前应用中已存在相同资源编码或权限编码。', resolution: '更换编码，或复用已有权限模型。' },
  ],
  examples: {
    http: {
      label: 'HTTP', language: 'bash',
      code: signedCurlExample('POST', '/openapi/resources', `{
  "code": "article",
  "name": "文章",
  "description": "内容文章",
  "actions": [
    {"code": "read", "name": "查看文章"},
    {"code": "publish", "name": "发布文章"}
  ]
}`),
    },
    go: {
      label: 'Go SDK', language: 'go',
      code: `${goClient}

resource, err := client.CreateResource(context.Background(), permission.CreateResourceRequest{
    Code:        "article",
    Name:        "文章",
    Description: "内容文章",
    Actions: []permission.ResourceAction{
        {Code: "read", Name: "查看文章"},
        {Code: "publish", Name: "发布文章"},
    },
})
if err != nil {
    log.Fatal(err)
}
log.Printf("resource=%s", resource.Code)`,
    },
    java: {
      label: 'Java SDK', language: 'java',
      code: `${javaClient}

Resource resource = client.createResource(new CreateResourceRequest(
    "article",
    "文章",
    "内容文章",
    List.of(
        new ResourceAction("read", "查看文章"),
        new ResourceAction("publish", "发布文章"))));
System.out.println(resource.code);`,
    },
    python: {
      label: 'Python SDK', language: 'python',
      code: `${pythonClient}

resource = client.create_resource(
    code="article",
    name="文章",
    description="内容文章",
    actions=[
        ResourceAction(code="read", name="查看文章"),
        ResourceAction(code="publish", name="发布文章"),
    ],
)
print(resource.code)`,
    },
  },
  responseExample: `{
  "code": "OK",
  "message": "success",
  "data": {
    "id": 21,
    "code": "article",
    "name": "文章",
    "description": "内容文章",
    "permissions": [
      {
        "id": 105,
        "applicationId": 2,
        "code": "article:read",
        "name": "查看文章",
        "resource": "article",
        "action": "read",
        "parentId": 21,
        "nodeType": "permission"
      }
    ]
  },
  "requestId": "req_01JY0T8DZ5K4K90Q2YQF5Z6X3R"
}`,
}
