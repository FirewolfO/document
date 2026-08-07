# 权限 OpenAPI 接入

## People 部门授权

统一用户应用可以把普通角色或单项权限授予 People 部门。部门授权包含该部门及其全部下级部门：权限校验时，Permission 通过 Gateway Inner 获取员工当前部门和完整部门树，再沿当前部门的父链匹配授权。部门被移动后，授权范围会按 People 的最新层级立即变化。

Permission 只持久化“应用、People 部门 ID、角色或权限”的授权关系，不复制部门名称和层级，也不读取 People 数据库。员工与部门数据分别通过 `/api/inner/people/directory/employees/**` 和 `/api/inner/people/directory/departments` 获取；Inner 调用失败时本次部门权限校验失败，不使用过期目录放行。

独立权限前端和统一 `admin-ui` 的权限模块都可在角色主体或权限授权对话框中选择部门。超级管理员、系统管理员和自维护用户应用不支持部门授权。

权限 OpenAPI 面向业务服务端开放。浏览器、移动端和公开客户端不得持有 `client_secret`，应先调用自己的业务后端，再由业务后端使用 Go、Java 或 Python SDK 请求权限服务。

## 用户加入用户组

```http
POST /api/v1/openapi/user-groups/{code}/members
Content-Type: application/json

{"principal":{"type":"user","identifier":"zhangsan"}}
```

用户主体固定使用 `type=user`，`identifier` 填 People 用户名；用户组和授权关系仍按签名凭据所属应用隔离。

该接口只追加成员，不会替换用户组已有成员、角色或直接权限。首次加入返回 `added=true`，重复加入返回 `added=false`：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "groupCode": "content_team",
    "principal": {"type": "user", "identifier": "zhangsan"},
    "added": true
  },
  "requestId": "req_01K1K7H8Q4J2Y0W6V3T5B9N8M"
}
```

移出用户组使用相同请求体和 `DELETE` 方法，重复移除返回 `removed=false`：

```http
DELETE /api/v1/openapi/user-groups/{code}/members
```

## 增量权限与角色主体

为多个用户或用户组增加直接权限：

```http
POST /api/v1/openapi/permission-grants

{
  "principals": [
    {"type":"user","identifier":"zhangsan"},
    {"type":"group","identifier":"content_team"}
  ],
  "permissionCodes": ["article:read","article:publish"]
}
```

移除相同权限时，请求地址和请求体不变，HTTP 方法改为 `DELETE`。接口不会替换主体已有的其他权限。

给角色增加多个用户或用户组：

```http
POST /api/v1/openapi/roles/editor/principals

{
  "principals": [
    {"type":"user","identifier":"zhangsan"},
    {"type":"group","identifier":"content_team"}
  ]
}
```

从角色移除主体使用相同地址和请求体，HTTP 方法改为 `DELETE`。所有增删接口都是幂等操作，响应中的 `changedCount` 只统计实际变化的关系数量。

移除接口使用带 JSON Body 的 `DELETE` 请求，部署时必须确认 API 网关和反向代理不会丢弃或改写 DELETE Body。

## HMAC-SHA256 签名

受保护的 `/api/v1/openapi/*` 请求使用 `Permission-HMAC-SHA256`。`client_id` 是公开的凭据标识，只出现在 `Authorization` 的 `Credential` 参数中；`client_secret` 只用于本地计算 HMAC，绝不进入 Header、URL 或请求体。

1. 对实际发送的原始请求体字节计算 SHA-256 小写十六进制摘要。
2. 生成当前 UTC Unix 秒级时间戳和至少 16 字符的加密随机 nonce。
3. 构造以下 6 行规范请求，末尾不添加换行：

```text
UPPERCASE_HTTP_METHOD
REQUEST_PATH
CANONICAL_QUERY
UNIX_TIMESTAMP
NONCE
LOWERCASE_HEX_SHA256_OF_RAW_BODY
```

查询参数先 URL 解码，再按参数名和参数值的 UTF-8 字节升序排列，最后按 RFC 3986 编码。空查询仍保留空白的第三行。

签名公式：

```text
signature = lowercase_hex(HMAC-SHA256(client_secret, canonical_request))
```

请求头：

```http
Authorization: Permission-HMAC-SHA256 Credential=<client_id>,Signature=<signature>
X-Permission-Timestamp: <unix_seconds>
X-Permission-Nonce: <random_nonce>
X-Permission-Content-SHA256: <body_sha256_hex>
```

服务端允许时间偏差不超过 5 分钟，并拒绝窗口内重复的 `client_id + nonce`。`401 INVALID_SIGNATURE` 响应中的 `X-Permission-Server-Time` 可用于校准应用服务器时钟。

### 可运行的 HTTP 签名示例

下面的脚本使用 Python 标准库计算签名，随后通过 `curl` 发送完全相同的 `BODY` 字节。Client Secret 仅存在于应用服务器环境变量中，不进入 URL、Header 或请求体。

```bash
export PERMISSION_CLIENT_ID='<CLIENT_ID>'
export PERMISSION_CLIENT_SECRET='<CLIENT_SECRET>'

METHOD='POST'
REQUEST_URL='https://permission.example.com/api/v1/openapi/permission-grants'
BODY=$(cat <<'JSON'
{
  "principals": [{"type":"group","identifier":"content_team"}],
  "permissionCodes": ["article:read"]
}
JSON
)
TIMESTAMP=$(date +%s)
NONCE=$(python3 -c 'import secrets; print(secrets.token_hex(16))')
export METHOD REQUEST_URL BODY TIMESTAMP NONCE

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
canonical_request = "\n".join((
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
BODY_SHA256=$(printf '%s\n' "$SIGNING_OUTPUT" | sed -n '1p')
SIGNATURE=$(printf '%s\n' "$SIGNING_OUTPUT" | sed -n '2p')

curl --request "$METHOD" \
  --url "$REQUEST_URL" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Permission-HMAC-SHA256 Credential=$PERMISSION_CLIENT_ID,Signature=$SIGNATURE" \
  --header "X-Permission-Timestamp: $TIMESTAMP" \
  --header "X-Permission-Nonce: $NONCE" \
  --header "X-Permission-Content-SHA256: $BODY_SHA256" \
  --data-binary "$BODY"
```

签名 path 必须是实际 URL path，例如 `/api/v1/openapi/permission-grants`，不能只签 `/openapi/permission-grants`。请求体格式、空格或换行发生变化后必须重新计算摘要和签名。

固定测试向量：

```text
secret: test-secret
body: {"permissions":["article:read"]}
path: /api/v1/openapi/authorize
raw query: z=last&a=hello+world&a=first
timestamp: 1700000000
nonce: 0123456789abcdef
signature: 59ff54d15ff121d45baa636db4a1d6d6fb87e82fa40a242d0949057cc05fcce0
```

## SDK

- Go：`../../go-sdk/permission`，使用 `AddPermissions`、`RemovePermissions`、`AddRolePrincipals`、`RemoveRolePrincipals`；签名函数为 `SignRequest`。
- Java：`../../java-sdk/permission`，使用 `addPermissions`、`removePermissions`、`addRolePrincipals`、`removeRolePrincipals`；签名器为 `PermissionRequestSigner`。
- Python：`../../python-sdk/permission`，使用 `add_permissions`、`remove_permissions`、`add_role_principals`、`remove_role_principals`；签名函数为 `sign_request`。

三个 SDK 都签名并发送同一份 JSON 字节，不发送 `X-Client-ID` 或 `X-Client-Secret`。
