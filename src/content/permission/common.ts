import type { ErrorDefinition, FieldDefinition, NoticeItem } from '@/types/document'

const configuredBaseUrl = String(import.meta.env.VITE_PERMISSION_API_BASE_URL || '').trim().replace(/\/+$/, '')

export const baseUrl = configuredBaseUrl || 'https://permission.example.com/api/v1'

export const commonNotices = (frequency: string): NoticeItem[] => [
  { label: '请求频率', value: frequency },
  { label: '超时时间', value: '客户端超时建议设置为 5 秒；超时后请先查询业务结果，再决定是否重试写请求。' },
  { label: '数据范围', value: '客户端凭证只允许访问凭证所属应用，不可跨应用创建、授权或鉴权。' },
]

export const commonHeaders: FieldDefinition[] = [
  { name: 'Authorization', location: 'Header', type: 'string', required: true, description: 'Permission-HMAC-SHA256 签名授权头。Client ID 仅作为公开 Credential，Client Secret 不随请求传输。', example: 'Permission-HMAC-SHA256 Credential=app_...,Signature=<hex>' },
  { name: 'X-Permission-Timestamp', location: 'Header', type: 'string', required: true, description: '参与签名的 UTC Unix 秒级时间戳，服务端允许偏差不超过 5 分钟。', example: '1700000000' },
  { name: 'X-Permission-Nonce', location: 'Header', type: 'string', required: true, description: '至少 16 字符的随机防重放值；同一应用在有效窗口内不得重复。', example: '0123456789abcdef0123456789abcdef' },
  { name: 'X-Permission-Content-SHA256', location: 'Header', type: 'string', required: true, description: '实际发送的原始请求体 SHA-256 小写十六进制摘要。', example: '<body_sha256_hex>' },
  { name: 'Content-Type', location: 'Header', type: 'string', required: true, description: '固定为 application/json。', example: 'application/json' },
]

export const commonEnvelopeFields: FieldDefinition[] = [
  { name: 'code', location: 'Response', type: 'string', required: true, description: '业务状态码，成功固定为 OK。', example: 'OK' },
  { name: 'message', location: 'Response', type: 'string', required: true, description: '响应说明。', example: 'success' },
  { name: 'requestId', location: 'Response', type: 'string', required: true, description: '请求追踪标识，排查问题时请提供。', example: 'req_01J...' },
]

export const commonErrors: ErrorDefinition[] = [
  { httpStatus: 400, code: 'INVALID_ARGUMENT', description: '请求体格式错误、必填字段缺失或字段超出约束。', resolution: '按参数表修正请求，不应直接重试。' },
  { httpStatus: 401, code: 'INVALID_SIGNATURE', description: '签名错误、时间戳过期、nonce 重复、应用已停用，或签名密钥已失效。', resolution: '使用官方 SDK，检查服务器时钟和当前密钥；可参考 X-Permission-Server-Time，切勿把密钥输出到日志。' },
  { httpStatus: 500, code: 'INTERNAL_ERROR', description: '权限服务内部异常。', resolution: '使用 requestId 排查；采用退避策略进行有限重试。' },
]

export const principalFields: FieldDefinition[] = [
  { name: 'principal.type', location: 'Body', type: 'string', required: false, description: '统一用户应用使用 user；应用级用户应用使用 subject。省略时按应用用户类型推断。', example: 'subject' },
  { name: 'principal.identifier', location: 'Body', type: 'string', required: true, description: 'user 填全局用户名；subject 填当前应用用户的 externalId。最长 128 字符。', example: 'user-10086' },
]

export const assignablePrincipalFields: FieldDefinition[] = [
  { name: 'principals', location: 'Body', type: 'array<object>', required: true, description: '需要增量操作的主体，至少 1 项、最多 100 项；重复主体会自动去重。', example: '[{"type":"subject","identifier":"user-10086"},{"type":"group","identifier":"content_team"}]' },
  { name: 'principals[].type', location: 'Body', type: 'string', required: true, description: '统一用户使用 user，自维护用户使用 subject，用户组使用 group。', example: 'group' },
  { name: 'principals[].identifier', location: 'Body', type: 'string', required: true, description: 'user 填全局用户名，subject 填当前应用 externalId，group 填当前应用用户组编码。', example: 'content_team' },
]

export function signedCurlExample(method: string, path: string, body: string): string {
  return `# 仅用于服务端联调。生产代码请使用官方 SDK，并从密钥系统读取 Client Secret。
export PERMISSION_CLIENT_ID='<CLIENT_ID>'
export PERMISSION_CLIENT_SECRET='<CLIENT_SECRET>'

METHOD='${method.toUpperCase()}'
REQUEST_URL='${baseUrl}${path}'
BODY=$(cat <<'JSON'
${body}
JSON
)
TIMESTAMP=$(date +%s)
NONCE=$(python3 -c 'import secrets; print(secrets.token_hex(16))')
export METHOD REQUEST_URL BODY TIMESTAMP NONCE

# 对实际发送的 BODY 字节计算摘要，并构造 6 行规范请求后计算 HMAC-SHA256。
SIGNING_OUTPUT=$(python3 <<'PY'
import hashlib
import hmac
import os
from urllib.parse import parse_qsl, quote, urlsplit

body = os.environ["BODY"].encode("utf-8")
parsed = urlsplit(os.environ["REQUEST_URL"])
pairs = parse_qsl(parsed.query, keep_blank_values=True)
pairs.sort(key=lambda item: (item[0].encode("utf-8"), item[1].encode("utf-8")))
canonical_query = "&".join(
    "{}={}".format(quote(key, safe="-._~"), quote(value, safe="-._~"))
    for key, value in pairs
)
body_hash = hashlib.sha256(body).hexdigest()
canonical_request = "\\n".join((
    os.environ["METHOD"].upper(),
    parsed.path or "/",
    canonical_query,
    os.environ["TIMESTAMP"],
    os.environ["NONCE"],
    body_hash,
))
signature = hmac.new(
    os.environ["PERMISSION_CLIENT_SECRET"].encode("utf-8"),
    canonical_request.encode("utf-8"),
    hashlib.sha256,
).hexdigest()
print(body_hash)
print(signature)
PY
)
BODY_SHA256=$(printf '%s\\n' "$SIGNING_OUTPUT" | sed -n '1p')
SIGNATURE=$(printf '%s\\n' "$SIGNING_OUTPUT" | sed -n '2p')

curl --request "$METHOD" \\
  --url "$REQUEST_URL" \\
  --header 'Content-Type: application/json' \\
  --header "Authorization: Permission-HMAC-SHA256 Credential=$PERMISSION_CLIENT_ID,Signature=$SIGNATURE" \\
  --header "X-Permission-Timestamp: $TIMESTAMP" \\
  --header "X-Permission-Nonce: $NONCE" \\
  --header "X-Permission-Content-SHA256: $BODY_SHA256" \\
  --data-binary "$BODY"`
}

export const goClient = `// 安装：go get permission-sdk/permission
client, err := permission.NewClient(permission.Config{
    BaseURL:      "${baseUrl}",
    ClientID:     os.Getenv("PERMISSION_CLIENT_ID"),
    ClientSecret: os.Getenv("PERMISSION_CLIENT_SECRET"),
})
if err != nil {
    log.Fatal(err)
}`

export const javaClient = `// Maven: com.permission:permission-sdk:1.2.0
PermissionClient client = new PermissionClient(
    "${baseUrl}",
    System.getenv("PERMISSION_CLIENT_ID"),
    System.getenv("PERMISSION_CLIENT_SECRET"));`

export const pythonClient = `import os
from permission import PermissionClient, Principal, ResourceAction

client = PermissionClient(
    base_url="${baseUrl}",
    client_id=os.environ["PERMISSION_CLIENT_ID"],
    client_secret=os.environ["PERMISSION_CLIENT_SECRET"],
)`
