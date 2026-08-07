import type { EndpointDocument, ErrorDefinition, FieldDefinition } from '@/types/document'
import {
  departmentExample,
  departmentResponseFields,
  employeeExample,
  employeeResponseFields,
  envelope,
  envelopeFields,
  field,
  peopleEndpoint,
} from './common'

const signatureFields: FieldDefinition[] = [
  field('X-Gateway-Credential', 'Header', 'string', true, 'Gateway 分配给调用方服务的 Access Key。', 'gwak_permission_prod'),
  field('X-Gateway-Timestamp', 'Header', 'string', true, 'UTC Unix 秒级时间戳，允许偏差不超过五分钟。', '1786096800'),
  field('X-Gateway-Nonce', 'Header', 'string', true, '16-128 字符随机值，有效窗口内不可重复。', '0123456789abcdef0123456789abcdef'),
  field('X-Gateway-Content-SHA256', 'Header', 'string', true, '原始请求体 SHA-256 小写十六进制摘要；GET 请求为空字节摘要。', 'e3b0c44298fc1c149afbf4c8996fb924...'),
  field('X-Gateway-Signature', 'Header', 'string', true, '使用服务 SK 对规范请求计算的 HMAC-SHA256 小写十六进制签名。', '<hex-signature>'),
]

const innerErrors: ErrorDefinition[] = [
  { httpStatus: 401, code: 'INVALID_SIGNATURE', description: 'Gateway AK/SK 签名、时间戳、nonce 或请求体摘要无效。', resolution: '检查调用方时钟与当前服务凭据，使用共享签名实现生成全部 X-Gateway-* 请求头。' },
  { httpStatus: 403, code: 'FORBIDDEN', description: '调用方服务未获准访问 People Inner 路由。', resolution: '在 Gateway Inner 工作区为调用方服务配置路由授权。' },
  { httpStatus: 404, code: 'NOT_FOUND', description: 'Gateway 路由不存在或指定员工不存在。', resolution: '确认使用 /api/inner/people 入口，并检查员工公开 ID。' },
  { httpStatus: 500, code: 'INTERNAL_ERROR', description: 'Gateway 或 People 服务内部异常。', resolution: '保留 requestId 和 Gateway 请求追踪信息，有限重试后联系维护方。' },
]

const listEmployeesDocument = peopleEndpoint({
  audience: 'inner', id: 'people-inner-list-employees', group: '员工目录', title: '查询员工目录',
  summary: '供获授权内部服务分页读取 People 员工目录，不依赖浏览器会话。', method: 'GET', path: '/directory/employees',
  examplePath: '/directory/employees?q=zhang&page=1&pageSize=100', auth: 'inner',
  permissionRequirement: 'Gateway Inner 服务签名；当前仅授权配置的内部调用方服务。',
  requestFields: [
    ...signatureFields,
    field('q', 'Query', 'string', false, '按工号、用户名、姓名、邮箱或部门名称模糊搜索。', 'zhang'),
    field('page', 'Query', 'integer', false, '页码，最小为 1；无效值回退为 1。', '1'),
    field('pageSize', 'Query', 'integer', false, '每页数量，1-100；无效值回退为 20。该接口示例使用 100。', '100'),
  ],
  responseFields: [
    ...envelopeFields,
    field('data.items', 'Response', 'array<object>', true, '当前页员工。'),
    ...employeeResponseFields('data.items[]'),
    field('data.total', 'Response', 'integer', true, '匹配员工总数。', '1'),
    field('data.page', 'Response', 'integer', true, '当前页码。', '1'),
    field('data.pageSize', 'Response', 'integer', true, '实际每页数量。', '100'),
  ],
  errors: innerErrors,
  responseExample: envelope({ items: [employeeExample], total: 1, page: 1, pageSize: 100 }),
})

const getEmployeeDocument = peopleEndpoint({
  audience: 'inner', id: 'people-inner-get-employee', group: '员工目录', title: '获取员工详情',
  summary: '使用员工公开 ID 获取完整目录资料，供内部授权和身份同步使用。', method: 'GET',
  path: '/directory/employees/:id', examplePath: '/directory/employees/pep_QK8dN2pT4sW6xY9z', auth: 'inner',
  permissionRequirement: 'Gateway Inner 服务签名；当前仅授权配置的内部调用方服务。',
  requestFields: [...signatureFields, field('id', 'Path', 'string', true, '员工公开 ID，不是数据库自增 ID。', 'pep_QK8dN2pT4sW6xY9z')],
  responseFields: [...envelopeFields, ...employeeResponseFields()], errors: innerErrors,
  responseExample: envelope(employeeExample),
})

const listDepartmentsDocument = peopleEndpoint({
  audience: 'inner', id: 'people-inner-list-departments', group: '部门目录', title: '查询部门目录',
  summary: '读取部门层级、状态及直属员工数量；parentId 为空表示顶级部门。', method: 'GET', path: '/directory/departments',
  examplePath: '/directory/departments?q=platform', auth: 'inner',
  permissionRequirement: 'Gateway Inner 服务签名；当前仅授权配置的内部调用方服务。',
  requestFields: [...signatureFields, field('q', 'Query', 'string', false, '按部门编码或名称模糊搜索。', 'platform')],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '部门列表。'), ...departmentResponseFields('data[]')],
  errors: innerErrors, responseExample: envelope([departmentExample]),
})

export const peopleInnerEndpoints: EndpointDocument[] = [
  listEmployeesDocument,
  getEmployeeDocument,
  listDepartmentsDocument,
]
