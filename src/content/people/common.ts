import type {
  ApiAudience,
  CodeExample,
  EndpointDocument,
  ErrorDefinition,
  ExampleLanguage,
  FieldDefinition,
  HttpMethod,
  NoticeItem,
} from '@/types/document'

const configuredOpenBaseUrl = String(import.meta.env.VITE_PEOPLE_OPEN_API_BASE_URL || '').trim().replace(/\/+$/, '')
const configuredInnerBaseUrl = String(import.meta.env.VITE_PEOPLE_INNER_API_BASE_URL || '').trim().replace(/\/+$/, '')

export const peopleOpenBaseUrl = configuredOpenBaseUrl || 'https://gateway.example.com/api/open/people'
export const peopleInnerBaseUrl = configuredInnerBaseUrl || 'https://gateway.example.com/api/inner/people'

type AuthMode = 'anonymous' | 'csrf' | 'session' | 'session-csrf' | 'bearer' | 'oauth-client' | 'inner'

interface PeopleEndpointInput {
  audience: ApiAudience
  id: string
  group: string
  title: string
  summary: string
  method: HttpMethod
  path: string
  examplePath?: string
  auth: AuthMode
  requestFields?: FieldDefinition[]
  responseFields: FieldDefinition[]
  errors?: ErrorDefinition[]
  requestBody?: string
  responseExample: string
  contentType?: 'json' | 'form'
  prerequisites?: string[]
  notices?: NoticeItem[]
  permissionRequirement: string
}

export function field(
  name: string,
  location: FieldDefinition['location'],
  type: string,
  required: boolean,
  description: string,
  example?: string,
): FieldDefinition {
  return { name, location, type, required, description, example }
}

export const envelopeFields: FieldDefinition[] = [
  field('code', 'Response', 'string', true, '业务状态码，成功固定为 OK。', 'OK'),
  field('message', 'Response', 'string', true, '响应说明。', '成功'),
  field('requestId', 'Response', 'string', true, '请求追踪标识。', 'people-1723000000000-1'),
]

export const employeeInputFields: FieldDefinition[] = [
  field('username', 'Body', 'string', true, '登录用户名，以字母开头，只能包含字母、数字、点、下划线或连字符，长度 3-64。', 'zhangsan'),
  field('displayName', 'Body', 'string', true, '员工姓名，最长 100 字符。', '张三'),
  field('email', 'Body', 'string', false, '邮箱，最长 255 字符。', 'zhangsan@example.com'),
  field('phone', 'Body', 'string', false, '联系电话，最长 32 字符。', '+86 13800138000'),
  field('departmentId', 'Body', 'string', true, '已启用的部门 ID。', 'dep_example'),
  field('title', 'Body', 'string', false, '职位名称，最长 100 字符。', '后端工程师'),
  field('employmentType', 'Body', 'string', false, '用工类型：full_time、part_time、contract 或 intern；默认 full_time。', 'full_time'),
  field('hireDate', 'Body', 'string', false, '入职日期，YYYY-MM-DD。', '2026-08-01'),
  field('probationEndDate', 'Body', 'string', false, '试用期结束日期，YYYY-MM-DD，不能早于入职日期。', '2026-11-01'),
  field('workLocation', 'Body', 'string', false, '工作地点，最长 100 字符。', '北京'),
]

export function employeeResponseFields(prefix = 'data'): FieldDefinition[] {
  return [
    field(`${prefix}.id`, 'Response', 'string', true, '员工公开 ID。', 'pep_example'),
    field(`${prefix}.employeeNo`, 'Response', 'integer', true, '数据库自增员工号；界面按 6 位左补 0 显示。', '10086'),
    field(`${prefix}.username`, 'Response', 'string', true, '登录用户名。', 'zhangsan'),
    field(`${prefix}.displayName`, 'Response', 'string', true, '员工姓名。', '张三'),
    field(`${prefix}.email`, 'Response', 'string', true, '邮箱，未设置时为空字符串。', 'zhangsan@example.com'),
    field(`${prefix}.phone`, 'Response', 'string', true, '联系电话，未设置时为空字符串。', '+86 13800138000'),
    field(`${prefix}.departmentId`, 'Response', 'string', true, '所属部门 ID，未分配时为空字符串。', 'dep_example'),
    field(`${prefix}.department`, 'Response', 'string', true, '所属部门名称，未分配时为空字符串。', '研发部'),
    field(`${prefix}.title`, 'Response', 'string', true, '职位名称。', '后端工程师'),
    field(`${prefix}.employmentType`, 'Response', 'string', true, '用工类型。', 'full_time'),
    field(`${prefix}.hireDate`, 'Response', 'string', true, '入职日期；未设置时为空字符串。', '2026-08-01'),
    field(`${prefix}.probationEndDate`, 'Response', 'string', true, '试用期结束日期；未设置时为空字符串。', '2026-11-01'),
    field(`${prefix}.workLocation`, 'Response', 'string', true, '工作地点；未设置时为空字符串。', '北京'),
    field(`${prefix}.role`, 'Response', 'string', true, '员工角色。', 'employee'),
    field(`${prefix}.status`, 'Response', 'string', true, '员工状态。', 'enabled'),
    field(`${prefix}.permissions`, 'Response', 'array<string>', true, '从 Permission 实时解析的 People 权限码。'),
    field(`${prefix}.mustChangePassword`, 'Response', 'boolean', true, '是否必须设置或修改密码。', 'false'),
    field(`${prefix}.passwordChangedAt`, 'Response', 'string|null', true, '最近密码修改时间，ISO 8601 格式。', '2026-08-07T10:00:00Z'),
    field(`${prefix}.lastLoginAt`, 'Response', 'string|null', true, '最近登录时间，ISO 8601 格式。', '2026-08-07T10:30:00Z'),
    field(`${prefix}.createdAt`, 'Response', 'string', true, '创建时间，ISO 8601 格式。', '2026-08-01T08:00:00Z'),
    field(`${prefix}.updatedAt`, 'Response', 'string', true, '更新时间，ISO 8601 格式。', '2026-08-07T10:00:00Z'),
  ]
}

export const departmentInputFields: FieldDefinition[] = [
  field('parentId', 'Body', 'string', false, '父部门 ID；空字符串表示顶级部门。', 'dep_parent'),
  field('code', 'Body', 'string', true, '部门编码，以小写字母开头，仅含小写字母、数字、下划线或连字符，最长 32。', 'platform'),
  field('name', 'Body', 'string', true, '部门名称，最长 100 字符。', '平台研发部'),
  field('description', 'Body', 'string', false, '部门描述，最长 500 字符。', '负责基础平台研发'),
  field('leaderId', 'Body', 'string', false, '部门负责人公开 ID；必须是该部门的启用员工。', 'pep_leader'),
  field('status', 'Body', 'string', false, '状态：enabled 或 disabled；默认 enabled。', 'enabled'),
]

export function departmentResponseFields(prefix = 'data'): FieldDefinition[] {
  return [
    field(`${prefix}.id`, 'Response', 'string', true, '部门 ID。', 'dep_example'),
    field(`${prefix}.parentId`, 'Response', 'string', true, '父部门 ID；顶级部门为空字符串。', 'dep_parent'),
    field(`${prefix}.code`, 'Response', 'string', true, '部门编码。', 'platform'),
    field(`${prefix}.name`, 'Response', 'string', true, '部门名称。', '平台研发部'),
    field(`${prefix}.description`, 'Response', 'string', true, '部门描述。', '负责基础平台研发'),
    field(`${prefix}.leaderId`, 'Response', 'string', true, '部门负责人公开 ID；未配置时为空字符串。', 'pep_leader'),
    field(`${prefix}.leaderName`, 'Response', 'string', true, '部门负责人姓名；未配置时为空字符串。', '李四'),
    field(`${prefix}.status`, 'Response', 'string', true, '部门状态。', 'enabled'),
    field(`${prefix}.employeeCount`, 'Response', 'integer', true, '直属该部门的员工数量。', '12'),
    field(`${prefix}.createdAt`, 'Response', 'string', true, '创建时间，ISO 8601 格式。', '2026-08-01T08:00:00Z'),
    field(`${prefix}.updatedAt`, 'Response', 'string', true, '更新时间，ISO 8601 格式。', '2026-08-07T10:00:00Z'),
  ]
}

export const standardErrors: ErrorDefinition[] = [
  { httpStatus: 400, code: 'INVALID_ARGUMENT', description: '参数格式或取值不符合约束。', resolution: '按请求参数表修正请求，不要原样重试。' },
  { httpStatus: 401, code: 'UNAUTHORIZED', description: '登录态、OAuth Token 或调用凭据无效。', resolution: '重新登录、刷新 Token，或检查调用凭据。' },
  { httpStatus: 403, code: 'FORBIDDEN', description: '当前身份没有执行操作所需的权限。', resolution: '使用管理员账号或申请所需授权。' },
  { httpStatus: 500, code: 'INTERNAL_ERROR', description: 'People 服务内部异常。', resolution: '保留 requestId，采用退避策略有限重试并联系服务维护方。' },
]

export const notFoundError: ErrorDefinition = {
  httpStatus: 404,
  code: 'NOT_FOUND',
  description: '指定员工或部门不存在。',
  resolution: '检查路径参数是否为有效的公开 ID。',
}

export const conflictError: ErrorDefinition = {
  httpStatus: 409,
  code: 'CONFLICT',
  description: '用户名、部门编码或部门名称已存在，存在待审批申请，或资源仍被关联。',
  resolution: '使用唯一值；删除部门前先移除员工和下级部门关联。',
}

export function peopleEndpoint(input: PeopleEndpointInput): EndpointDocument {
  const baseUrl = input.audience === 'inner' ? peopleInnerBaseUrl : peopleOpenBaseUrl
  return {
    id: input.id,
    group: input.group,
    title: input.title,
    summary: input.summary,
    method: input.method,
    path: input.path,
    notices: input.notices || commonNotices(input.audience, input.auth),
    prerequisites: input.prerequisites || prerequisites(input.auth),
    permissionRequirement: input.permissionRequirement,
    requestFields: input.requestFields || [],
    responseFields: input.responseFields,
    errors: input.errors || standardErrors,
    examples: examples(input.method, `${baseUrl}${input.examplePath || input.path}`, input.auth, input.requestBody || '', input.contentType || 'json'),
    responseExample: input.responseExample,
  }
}

function commonNotices(audience: ApiAudience, auth: AuthMode): NoticeItem[] {
  return [
    { label: '访问入口', value: audience === 'inner' ? '仅使用 Gateway Inner 地址，不得直连 People 后端。' : '统一使用 Gateway Open 地址，不得直连 People 后端。' },
    { label: '认证边界', value: auth === 'inner' ? '调用方服务必须获准访问 People Inner 路由，并使用服务 AK/SK 签名。' : '浏览器会话、OAuth Token 与 CSRF 约束由具体接口分别说明。' },
    { label: '请求追踪', value: '可传 X-Request-ID；普通 JSON 响应会回传 requestId，排障时请一并提供。' },
  ]
}

function prerequisites(auth: AuthMode): string[] {
  switch (auth) {
    case 'session': return ['已通过 People 登录取得 HttpOnly PEOPLE_SESSION Cookie。']
    case 'csrf': return ['先调用 GET /auth/csrf，并同时发送 PEOPLE_XSRF Cookie 与 X-XSRF-TOKEN 请求头。']
    case 'session-csrf': return ['已取得 PEOPLE_SESSION Cookie。', '先调用 GET /auth/csrf，并同时发送 PEOPLE_XSRF Cookie 与 X-XSRF-TOKEN 请求头。']
    case 'bearer': return ['已通过 OAuth Token 接口取得有效 Bearer Token，并具备接口所需 scope。']
    case 'oauth-client': return ['OAuth Client 已在 People 注册，Client Secret 仅保存在服务端。']
    case 'inner': return ['调用方已在 Gateway Inner 工作区注册。', '已获得可访问 People Inner 路由的服务 AK/SK。', '调用方服务器时钟与 UTC 保持同步。']
    default: return ['Gateway Open 路由已启用且 People 服务健康。']
  }
}

function examples(method: HttpMethod, url: string, auth: AuthMode, body: string, contentType: 'json' | 'form'): Record<ExampleLanguage, CodeExample> {
  return {
    http: { label: 'HTTP', language: 'bash', code: shellExample(method, url, auth, body, contentType) },
    go: { label: 'Go', language: 'go', code: goExample(method, url, auth, body, contentType) },
    java: { label: 'Java', language: 'java', code: javaExample(method, url, auth, body, contentType) },
    python: { label: 'Python', language: 'python', code: pythonExample(method, url, auth, body, contentType) },
  }
}

function shellExample(method: HttpMethod, url: string, auth: AuthMode, body: string, contentType: 'json' | 'form'): string {
  if (auth === 'inner') {
    return `# 在服务端使用 Gateway 分配的服务 AK/SK；不要把 SK 写入代码或日志。
export GATEWAY_ACCESS_KEY='<SERVICE_ACCESS_KEY>'
export GATEWAY_SECRET_KEY='<SERVICE_SECRET_KEY>'
METHOD='${method}'
URL='${url}'
BODY='${body}'
TIMESTAMP=$(date +%s)
NONCE=$(openssl rand -hex 16)
PAYLOAD_HASH=$(printf '%s' "$BODY" | openssl dgst -sha256 | awk '{print $2}')
export METHOD URL BODY TIMESTAMP NONCE PAYLOAD_HASH
SIGNATURE=$(python3 <<'PY'
import hashlib, hmac, os
from urllib.parse import parse_qsl, quote, urlsplit
p = urlsplit(os.environ['URL'])
pairs = sorted(parse_qsl(p.query, keep_blank_values=True))
query = '&'.join(f'{quote(k, safe="-._~")}={quote(v, safe="-._~")}' for k, v in pairs)
canonical = '\n'.join((os.environ['METHOD'], p.path, query, os.environ['TIMESTAMP'], os.environ['NONCE'], os.environ['PAYLOAD_HASH']))
print(hmac.new(os.environ['GATEWAY_SECRET_KEY'].encode(), canonical.encode(), hashlib.sha256).hexdigest())
PY
)
curl --request "$METHOD" "$URL" \\
  --header "X-Gateway-Credential: $GATEWAY_ACCESS_KEY" \\
  --header "X-Gateway-Timestamp: $TIMESTAMP" \\
  --header "X-Gateway-Nonce: $NONCE" \\
  --header "X-Gateway-Content-SHA256: $PAYLOAD_HASH" \\
  --header "X-Gateway-Signature: $SIGNATURE"${body ? ` \\
  --header 'Content-Type: application/json' \\
  --data "$BODY"` : ''}`
  }

  const headers = shellHeaders(auth, contentType)
  return `curl --request ${method} '${url}'${headers}${body ? ` \\
  --data '${body}'` : ''}`
}

function shellHeaders(auth: AuthMode, contentType: 'json' | 'form'): string {
  const headers: string[] = []
  if (auth === 'session' || auth === 'session-csrf') headers.push("--cookie 'PEOPLE_SESSION=<SESSION_TOKEN>'")
  if (auth === 'csrf' || auth === 'session-csrf') headers.push("--header 'X-XSRF-TOKEN: <CSRF_TOKEN>'", "--cookie 'PEOPLE_XSRF=<CSRF_TOKEN>'")
  if (auth === 'bearer') headers.push("--header 'Authorization: Bearer <ACCESS_TOKEN>'")
  if (auth === 'oauth-client') headers.push("--user '<CLIENT_ID>:<CLIENT_SECRET>'")
  if (contentType === 'form') headers.push("--header 'Content-Type: application/x-www-form-urlencoded'")
  else if (auth === 'csrf' || auth === 'session-csrf') headers.push("--header 'Content-Type: application/json'")
  return headers.map((header) => ` \\
  ${header}`).join('')
}

function goExample(method: HttpMethod, url: string, auth: AuthMode, body: string, contentType: 'json' | 'form'): string {
  const bodyExpression = body ? `strings.NewReader(${JSON.stringify(body)})` : 'nil'
  const headers = auth === 'inner'
    ? `// signGatewayRequest 按 Gateway-HMAC-SHA256 规范设置 Credential、Timestamp、Nonce、Payload Hash 与 Signature。
if err := signGatewayRequest(req, os.Getenv("GATEWAY_ACCESS_KEY"), os.Getenv("GATEWAY_SECRET_KEY")); err != nil { log.Fatal(err) }`
    : goHeaders(auth, contentType)
  return `req, err := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, ${bodyExpression})
if err != nil { log.Fatal(err) }
${headers}
response, err := http.DefaultClient.Do(req)
if err != nil { log.Fatal(err) }
defer response.Body.Close()
payload, err := io.ReadAll(response.Body)
if err != nil { log.Fatal(err) }
fmt.Printf("status=%d body=%s\\n", response.StatusCode, payload)`
}

function goHeaders(auth: AuthMode, contentType: 'json' | 'form'): string {
  const lines: string[] = []
  if (auth === 'session' || auth === 'session-csrf') lines.push('req.Header.Set("Cookie", "PEOPLE_SESSION=<SESSION_TOKEN>")')
  if (auth === 'csrf' || auth === 'session-csrf') lines.push('req.Header.Add("Cookie", "PEOPLE_XSRF=<CSRF_TOKEN>")', 'req.Header.Set("X-XSRF-TOKEN", "<CSRF_TOKEN>")')
  if (auth === 'bearer') lines.push('req.Header.Set("Authorization", "Bearer <ACCESS_TOKEN>")')
  if (auth === 'oauth-client') lines.push('req.SetBasicAuth("<CLIENT_ID>", "<CLIENT_SECRET>")')
  if (contentType === 'form') lines.push('req.Header.Set("Content-Type", "application/x-www-form-urlencoded")')
  else if (auth === 'csrf' || auth === 'session-csrf') lines.push('req.Header.Set("Content-Type", "application/json")')
  return lines.join('\n')
}

function javaExample(method: HttpMethod, url: string, auth: AuthMode, body: string, contentType: 'json' | 'form'): string {
  const builder = body ? `.method("${method}", HttpRequest.BodyPublishers.ofString(${JSON.stringify(body)}))` : `.${method === 'GET' ? 'GET' : `method("${method}", HttpRequest.BodyPublishers.noBody())`}`
  const headers = javaHeaders(auth, contentType)
  return `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder(URI.create(${JSON.stringify(url)}))
    ${builder}${headers}
    .build();
// Inner 请求在 build 前使用共享 GatewaySigner 写入五个 X-Gateway-* 签名头。
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode());
System.out.println(response.body());`
}

function javaHeaders(auth: AuthMode, contentType: 'json' | 'form'): string {
  const headers: string[] = []
  if (auth === 'session' || auth === 'session-csrf') headers.push('Cookie', 'PEOPLE_SESSION=<SESSION_TOKEN>')
  if (auth === 'csrf' || auth === 'session-csrf') headers.push('Cookie', 'PEOPLE_XSRF=<CSRF_TOKEN>', 'X-XSRF-TOKEN', '<CSRF_TOKEN>')
  if (auth === 'bearer') headers.push('Authorization', 'Bearer <ACCESS_TOKEN>')
  if (auth === 'oauth-client') headers.push('Authorization', 'Basic <BASE64_CLIENT_ID_AND_SECRET>')
  if (contentType === 'form') headers.push('Content-Type', 'application/x-www-form-urlencoded')
  else if (auth === 'csrf' || auth === 'session-csrf') headers.push('Content-Type', 'application/json')
  if (auth === 'inner') return '\n    // .headers(...) 由 GatewaySigner 注入'
  return headers.length ? `\n    .headers(${headers.map((value) => JSON.stringify(value)).join(', ')})` : ''
}

function pythonExample(method: HttpMethod, url: string, auth: AuthMode, body: string, contentType: 'json' | 'form'): string {
  if (auth === 'inner') {
    return `import hashlib, hmac, os, secrets, time
from urllib.parse import parse_qsl, quote, urlsplit
import requests

method = ${JSON.stringify(method)}
url = ${JSON.stringify(url)}
body = ${JSON.stringify(body)}.encode()
parsed = urlsplit(url)
query = '&'.join(f'{quote(k, safe="-._~")}={quote(v, safe="-._~")}' for k, v in sorted(parse_qsl(parsed.query, keep_blank_values=True)))
timestamp = str(int(time.time()))
nonce = secrets.token_hex(16)
payload_hash = hashlib.sha256(body).hexdigest()
canonical = '\n'.join((method, parsed.path, query, timestamp, nonce, payload_hash))
signature = hmac.new(os.environ['GATEWAY_SECRET_KEY'].encode(), canonical.encode(), hashlib.sha256).hexdigest()
headers = {
    'X-Gateway-Credential': os.environ['GATEWAY_ACCESS_KEY'],
    'X-Gateway-Timestamp': timestamp,
    'X-Gateway-Nonce': nonce,
    'X-Gateway-Content-SHA256': payload_hash,
    'X-Gateway-Signature': signature,
}
response = requests.request(method, url, headers=headers, data=body, timeout=5)
response.raise_for_status()
print(response.json())`
  }
  const setup = auth === 'session' || auth === 'session-csrf' ? 'session = requests.Session()\nsession.cookies.set("PEOPLE_SESSION", "<SESSION_TOKEN>")\n' : ''
  const requester = auth === 'session' || auth === 'session-csrf' ? 'session' : 'requests'
  const args: string[] = []
  if (auth === 'csrf' || auth === 'session-csrf') args.push(`headers={'X-XSRF-TOKEN': '<CSRF_TOKEN>', 'Content-Type': 'application/json'}`, `cookies={'PEOPLE_XSRF': '<CSRF_TOKEN>'}`)
  if (auth === 'bearer') args.push(`headers={'Authorization': 'Bearer <ACCESS_TOKEN>'}`)
  if (auth === 'oauth-client') args.push(`auth=('<CLIENT_ID>', '<CLIENT_SECRET>')`)
  if (body) args.push(`${contentType === 'form' ? 'data' : 'data'}=${JSON.stringify(body)}`)
  if (contentType === 'form') args.push(`headers={'Content-Type': 'application/x-www-form-urlencoded'}`)
  args.push('timeout=5')
  return `import requests

${setup}response = ${requester}.request(${JSON.stringify(method)}, ${JSON.stringify(url)}, ${args.join(', ')})
response.raise_for_status()
print(response.json())`
}

export const employeeExample = {
  id: 'pep_QK8dN2pT4sW6xY9z',
  employeeNo: 10086,
  username: 'zhangsan',
  displayName: '张三',
  email: 'zhangsan@example.com',
  phone: '+86 13800138000',
  departmentId: 'dep_platform',
  department: '平台研发部',
  title: '后端工程师',
  employmentType: 'full_time',
  hireDate: '2026-08-01',
  probationEndDate: '2026-11-01',
  workLocation: '北京',
  role: 'employee',
  status: 'enabled',
  permissions: ['people.employee:view'],
  mustChangePassword: false,
  passwordChangedAt: '2026-08-07T10:00:00Z',
  lastLoginAt: '2026-08-07T10:30:00Z',
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-07T10:00:00Z',
}

export const departmentExample = {
  id: 'dep_platform',
  parentId: '',
  code: 'platform',
  name: '平台研发部',
  description: '负责基础平台研发',
  leaderId: 'pep_leader',
  leaderName: '李四',
  status: 'enabled',
  employeeCount: 12,
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-07T10:00:00Z',
}

export function envelope(data: unknown, message = '成功'): string {
  return JSON.stringify({ code: 'OK', message, data, requestId: 'people-1723000000000-1' }, null, 2)
}
