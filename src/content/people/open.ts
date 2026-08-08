import type { EndpointDocument, ErrorDefinition, FieldDefinition } from '@/types/document'
import {
  conflictError,
  departmentExample,
  departmentInputFields,
  departmentResponseFields,
  employeeExample,
  employeeInputFields,
  employeeResponseFields,
  envelope,
  envelopeFields,
  field,
  notFoundError,
  peopleEndpoint,
  standardErrors,
} from './common'

const sessionField = field('Cookie', 'Header', 'string', true, 'People 登录后设置的 HttpOnly 会话 Cookie。', 'PEOPLE_SESSION=<token>')
const csrfFields: FieldDefinition[] = [
  sessionField,
  field('PEOPLE_XSRF', 'Header', 'string', true, '由 GET /auth/csrf 设置的可读 Cookie。', 'PEOPLE_XSRF=<token>'),
  field('X-XSRF-TOKEN', 'Header', 'string', true, '值必须与 PEOPLE_XSRF Cookie 完全一致。', '<token>'),
]
const bearerField = field('Authorization', 'Header', 'string', true, 'OAuth 2.0 Bearer Token。', 'Bearer pat_...')
const idField = field('id', 'Path', 'string', true, '员工或部门公开 ID。', 'pep_QK8dN2pT4sW6xY9z')
const mutationErrors = [...standardErrors, notFoundError, conflictError]

const employeeBody = JSON.stringify({
  username: 'zhangsan', displayName: '张三', email: 'zhangsan@example.com', phone: '+86 13800138000',
  departmentId: 'dep_platform', title: '后端工程师', employmentType: 'full_time', hireDate: '2026-08-01',
  probationEndDate: '2026-11-01', workLocation: '北京',
}, null, 2)
const departmentBody = JSON.stringify({ parentId: '', code: 'platform', name: '平台研发部', description: '负责基础平台研发', leaderId: 'pep_leader', status: 'enabled' }, null, 2)
const departureExample = {
  id: 'dpr_example', employeeId: employeeExample.id, employeeName: employeeExample.displayName, employeeNo: employeeExample.employeeNo,
  departmentId: 'dep_platform', departmentName: '平台研发部', departmentLeaderId: 'pep_leader', reason: '个人发展',
  lastWorkingDate: '2026-08-31', status: 'pending_manager', managerReviewerId: '', managerReviewerName: '',
  managerReviewComment: '', managerReviewedAt: null, hrReviewerId: '', hrReviewerName: '', hrReviewComment: '', hrReviewedAt: null,
  canManagerReview: false, canHrReview: false, canCancel: true, createdAt: '2026-08-08T08:00:00Z', updatedAt: '2026-08-08T08:00:00Z',
}
const departureFields: FieldDefinition[] = [
  field('data.id', 'Response', 'string', true, '离职申请 ID。', 'dpr_example'),
  field('data.employeeId', 'Response', 'string', true, '申请人员工公开 ID。', employeeExample.id),
  field('data.employeeName', 'Response', 'string', true, '申请人姓名快照。', employeeExample.displayName),
  field('data.employeeNo', 'Response', 'integer', true, '申请人员工号。', '10086'),
  field('data.departmentId', 'Response', 'string', true, '申请时所在部门 ID。', 'dep_platform'),
  field('data.departmentName', 'Response', 'string', true, '申请时所在部门名称。', '平台研发部'),
  field('data.reason', 'Response', 'string', true, '离职原因。', '个人发展'),
  field('data.lastWorkingDate', 'Response', 'string', true, '最后工作日，YYYY-MM-DD。', '2026-08-31'),
  field('data.status', 'Response', 'string', true, 'pending_manager、pending_hr、approved、rejected 或 cancelled。', 'pending_manager'),
  field('data.canManagerReview', 'Response', 'boolean', true, '当前用户是否可执行负责人审批。', 'false'),
  field('data.canHrReview', 'Response', 'boolean', true, '当前用户是否可执行 HR 终审。', 'false'),
  field('data.canCancel', 'Response', 'boolean', true, '当前用户是否可撤回。', 'true'),
]

const csrfDocument = peopleEndpoint({
  audience: 'open', id: 'people-csrf', group: '登录与会话', title: '获取 CSRF Token',
  summary: '创建双提交 CSRF Token，供后续浏览器写请求使用。', method: 'GET', path: '/auth/csrf', auth: 'anonymous',
  permissionRequirement: '无需登录；必须保存响应设置的 PEOPLE_XSRF Cookie。',
  responseFields: [...envelopeFields, field('data.token', 'Response', 'string', true, 'CSRF Token。', 'xYz...'), field('data.headerName', 'Response', 'string', true, '写请求使用的请求头名称。', 'X-XSRF-TOKEN')],
  responseExample: envelope({ token: 'xYz_CSRF_TOKEN', headerName: 'X-XSRF-TOKEN' }),
})

const loginDocument = peopleEndpoint({
  audience: 'open', id: 'people-login', group: '登录与会话', title: '登录 People',
  summary: '校验员工账号并创建 People 浏览器会话；首次登录员工会被标记为必须设置密码。', method: 'POST', path: '/auth/login', auth: 'csrf',
  permissionRequirement: '无需已有会话，但必须先完成 CSRF 双提交校验。',
  prerequisites: ['先调用 GET /auth/csrf，并携带返回 Cookie 和 Token。', '员工账号状态为 enabled。'],
  requestFields: [
    ...csrfFields.slice(1),
    field('username', 'Body', 'string', true, 'People 用户名，不区分大小写。', 'zhangsan'),
    field('password', 'Body', 'string', true, '登录密码；mustChangePassword=true 时后端暂不校验，但字段仍需传入。', '<PASSWORD>'),
  ],
  responseFields: [...envelopeFields, ...employeeResponseFields()],
  requestBody: JSON.stringify({ username: 'zhangsan', password: '<PASSWORD>' }, null, 2),
  responseExample: envelope(employeeExample),
})

const meDocument = peopleEndpoint({
  audience: 'open', id: 'people-me', group: '登录与会话', title: '获取当前员工',
  summary: '根据 People 会话返回当前员工资料，允许尚未完成首次密码设置的账号调用。', method: 'GET', path: '/auth/me', auth: 'session',
  permissionRequirement: '有效的 PEOPLE_SESSION 会话。', requestFields: [sessionField],
  responseFields: [...envelopeFields, ...employeeResponseFields()], responseExample: envelope(employeeExample),
})

const logoutDocument = peopleEndpoint({
  audience: 'open', id: 'people-logout', group: '登录与会话', title: '退出 People',
  summary: '撤销当前会话并清除 PEOPLE_SESSION Cookie。', method: 'POST', path: '/auth/logout', auth: 'session-csrf',
  permissionRequirement: '有效的 People 会话和 CSRF Token。', requestFields: csrfFields,
  responseFields: [...envelopeFields, field('data.loggedOut', 'Response', 'boolean', true, '是否已完成退出。', 'true')],
  responseExample: envelope({ loggedOut: true }),
})

const changePasswordDocument = peopleEndpoint({
  audience: 'open', id: 'people-change-password', group: '登录与会话', title: '修改登录密码',
  summary: '设置或修改当前员工密码；成功后撤销该员工除当前会话外的其他会话。', method: 'POST', path: '/auth/change-password', auth: 'session-csrf',
  permissionRequirement: '有效的 People 会话和 CSRF Token。首次设置密码时 currentPassword 可为空。',
  requestFields: [
    ...csrfFields,
    field('currentPassword', 'Body', 'string', false, '当前密码；首次设置密码时可为空。', '<CURRENT_PASSWORD>'),
    field('newPassword', 'Body', 'string', true, '新密码，长度 8-72 字符。', '<NEW_PASSWORD>'),
  ],
  responseFields: [...envelopeFields, ...employeeResponseFields()],
  requestBody: JSON.stringify({ currentPassword: '<CURRENT_PASSWORD>', newPassword: '<NEW_PASSWORD>' }, null, 2),
  responseExample: envelope(employeeExample),
})

const listEmployeesDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-employees', group: '员工管理', title: '查询员工列表',
  summary: '分页查询员工目录；具备 Permission 授权的用户可使用会话，服务端集成可使用 employees.read OAuth Token。', method: 'GET', path: '/employees', examplePath: '/employees?q=zhang&page=1&pageSize=20', auth: 'bearer',
  permissionRequirement: 'People 会话具备 people.employee:view，或 Bearer Token 包含 employees.read scope。',
  requestFields: [
    field('Authorization', 'Header', 'string', false, '服务端调用时使用包含 employees.read scope 的 OAuth Bearer Token；与管理员 Cookie 二选一。', 'Bearer pat_...'),
    field('Cookie', 'Header', 'string', false, '后台浏览器调用时使用有权的 PEOPLE_SESSION；与 Bearer Token 二选一。', 'PEOPLE_SESSION=<token>'),
    field('q', 'Query', 'string', false, '按工号、用户名、姓名、邮箱或部门名称模糊搜索。', 'zhang'),
    field('page', 'Query', 'integer', false, '页码，最小为 1；无效值回退为 1。', '1'),
    field('pageSize', 'Query', 'integer', false, '每页数量，1-100；无效值回退为 20。', '20'),
  ],
  responseFields: [
    ...envelopeFields,
    field('data.items', 'Response', 'array<object>', true, '当前页员工。'),
    ...employeeResponseFields('data.items[]'),
    field('data.total', 'Response', 'integer', true, '匹配员工总数。', '1'),
    field('data.page', 'Response', 'integer', true, '当前页码。', '1'),
    field('data.pageSize', 'Response', 'integer', true, '实际每页数量。', '20'),
  ],
  responseExample: envelope({ items: [employeeExample], total: 1, page: 1, pageSize: 20 }),
})

const createEmployeeDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-employee', group: '员工管理', title: '创建员工',
  summary: '创建普通员工账号；员工号由数据库自增生成，不设置初始密码。', method: 'POST', path: '/employees', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.employee:manage，并完成 CSRF 校验。', requestFields: [...csrfFields, ...employeeInputFields],
  responseFields: [...envelopeFields, ...employeeResponseFields()], errors: mutationErrors, requestBody: employeeBody,
  responseExample: envelope({ ...employeeExample, mustChangePassword: true, passwordChangedAt: null, lastLoginAt: null }, '创建成功'),
})

const updateEmployeeDocument = peopleEndpoint({
  audience: 'open', id: 'people-update-employee', group: '员工管理', title: '更新员工',
  summary: '更新员工基础档案和任职信息；工号、角色和账号状态不能通过本接口变更。', method: 'PUT', path: '/employees/:id', examplePath: '/employees/pep_QK8dN2pT4sW6xY9z', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.employee:manage，并完成 CSRF 校验。', requestFields: [...csrfFields, idField, ...employeeInputFields],
  responseFields: [...envelopeFields, ...employeeResponseFields()], errors: mutationErrors, requestBody: employeeBody,
  responseExample: envelope(employeeExample),
})

const deleteEmployeeDocument = peopleEndpoint({
  audience: 'open', id: 'people-delete-employee', group: '员工管理', title: '删除员工',
  summary: '删除员工及其关联会话；不能删除当前登录账号或内置 admin。', method: 'DELETE', path: '/employees/:id', examplePath: '/employees/pep_QK8dN2pT4sW6xY9z', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.employee:manage，并完成 CSRF 校验。', requestFields: [...csrfFields, idField],
  responseFields: [...envelopeFields, field('data.deleted', 'Response', 'boolean', true, '是否删除成功。', 'true')], errors: mutationErrors,
  responseExample: envelope({ deleted: true }),
})

const resetEmployeePasswordDocument = peopleEndpoint({
  audience: 'open', id: 'people-reset-employee-password', group: '员工管理', title: '重置员工密码',
  summary: '清空员工密码、撤销现有会话，并让账号回到首次设置密码状态。', method: 'POST', path: '/employees/:id/reset-password', examplePath: '/employees/pep_QK8dN2pT4sW6xY9z/reset-password', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.employee:reset，并完成 CSRF 校验。', requestFields: [...csrfFields, idField],
  responseFields: [...envelopeFields, field('data.reset', 'Response', 'boolean', true, '是否已重置。', 'true')], errors: mutationErrors,
  responseExample: envelope({ reset: true }),
})

const setEmployeeEnabledDocument = peopleEndpoint({
  audience: 'open', id: 'people-set-employee-enabled', group: '员工管理', title: '停用或启用员工',
  summary: '变更账号状态；停用时同步撤销全部 People 会话。', method: 'PUT', path: '/employees/:id/enabled', examplePath: '/employees/pep_QK8dN2pT4sW6xY9z/enabled', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.employee:disable，并完成 CSRF 校验。', requestFields: [...csrfFields, idField, field('enabled', 'Body', 'boolean', true, 'true 启用，false 停用。', 'false')],
  responseFields: [...envelopeFields, ...employeeResponseFields()], errors: mutationErrors, requestBody: JSON.stringify({ enabled: false }, null, 2),
  responseExample: envelope({ ...employeeExample, status: 'disabled' }),
})

const hrDashboardDocument = peopleEndpoint({
  audience: 'open', id: 'people-hr-dashboard', group: '人事概览', title: '获取人事概览', summary: '返回人员状态、部门、试用期、近期入职和待办离职统计。',
  method: 'GET', path: '/hr/dashboard', auth: 'session', permissionRequirement: 'People 会话具备 people.dashboard:view。', requestFields: [sessionField],
  responseFields: [...envelopeFields, field('data.totalEmployees', 'Response', 'integer', true, '员工总数。', '120'), field('data.enabledEmployees', 'Response', 'integer', true, '在职员工数。', '116'), field('data.disabledEmployees', 'Response', 'integer', true, '停用员工数。', '4'), field('data.departments', 'Response', 'integer', true, '启用部门数。', '9'), field('data.pendingDepartures', 'Response', 'integer', true, '待审批离职数。', '2'), field('data.probationEmployees', 'Response', 'integer', true, '试用期员工数。', '8'), field('data.recentHires', 'Response', 'integer', true, '近 30 天入职数。', '3')],
  responseExample: envelope({ totalEmployees: 120, enabledEmployees: 116, disabledEmployees: 4, departments: 9, pendingDepartures: 2, probationEmployees: 8, recentHires: 3 }),
})

const listDepartmentsDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-departments', group: '部门管理', title: '查询部门列表',
  summary: '查询全部部门及直属员工数量，启用部门优先并按名称排序。', method: 'GET', path: '/departments', examplePath: '/departments?q=platform', auth: 'session',
  permissionRequirement: '任意有效 People 会话。', requestFields: [sessionField, field('q', 'Query', 'string', false, '按部门编码或名称模糊搜索。', 'platform')],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '部门列表。'), ...departmentResponseFields('data[]')],
  responseExample: envelope([departmentExample]),
})

const createDepartmentDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-department', group: '部门管理', title: '创建部门',
  summary: '创建顶级或子部门，并校验编码、名称和父部门关系。', method: 'POST', path: '/departments', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.department:manage，并完成 CSRF 校验。', requestFields: [...csrfFields, ...departmentInputFields],
  responseFields: [...envelopeFields, ...departmentResponseFields()], errors: mutationErrors, requestBody: departmentBody,
  responseExample: envelope(departmentExample, '创建成功'),
})

const updateDepartmentDocument = peopleEndpoint({
  audience: 'open', id: 'people-update-department', group: '部门管理', title: '更新部门',
  summary: '更新部门及父子关系；名称变化会同步到关联员工，不允许自引用或形成循环。', method: 'PUT', path: '/departments/:id', examplePath: '/departments/dep_platform', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.department:manage，并完成 CSRF 校验。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '部门 ID。', 'dep_platform'), ...departmentInputFields],
  responseFields: [...envelopeFields, ...departmentResponseFields()], errors: mutationErrors, requestBody: departmentBody,
  responseExample: envelope(departmentExample),
})

const deleteDepartmentDocument = peopleEndpoint({
  audience: 'open', id: 'people-delete-department', group: '部门管理', title: '删除部门',
  summary: '删除空部门；仍有关联员工或下级部门时拒绝删除。', method: 'DELETE', path: '/departments/:id', examplePath: '/departments/dep_platform', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.department:manage，并完成 CSRF 校验。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '部门 ID。', 'dep_platform')],
  responseFields: [...envelopeFields, field('data.deleted', 'Response', 'boolean', true, '是否删除成功。', 'true')], errors: mutationErrors,
  responseExample: envelope({ deleted: true }),
})

const listDeparturesDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-departures', group: '离职审批', title: '查询离职申请', summary: '普通员工看到本人申请和本人负责部门的申请；HR 看到全部状态记录。',
  method: 'GET', path: '/departures', auth: 'session', permissionRequirement: '任意有效 People 会话；people.departure:review 可查看全量。', requestFields: [sessionField],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '当前用户可见的离职申请。'), ...departureFields.map((item) => ({ ...item, name: item.name.replace('data.', 'data[].') }))],
  responseExample: envelope([departureExample]),
})

const createDepartureDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-departure', group: '离职审批', title: '发起离职申请', summary: '为当前非管理员员工发起离职申请，并通知所在部门负责人。',
  method: 'POST', path: '/departures', auth: 'session-csrf', permissionRequirement: '任意非管理员在职员工；所在部门必须配置其他员工作为负责人。',
  requestFields: [...csrfFields, field('reason', 'Body', 'string', true, '离职原因，最长 1000 字符。', '个人发展'), field('lastWorkingDate', 'Body', 'string', true, '最后工作日，不得早于今天。', '2026-08-31')],
  responseFields: [...envelopeFields, ...departureFields], errors: mutationErrors, requestBody: JSON.stringify({ reason: '个人发展', lastWorkingDate: '2026-08-31' }, null, 2), responseExample: envelope(departureExample, '创建成功'),
})

function reviewDepartureDocument(stage: 'manager' | 'hr'): EndpointDocument {
  const hr = stage === 'hr'
  return peopleEndpoint({
    audience: 'open', id: `people-review-departure-${stage}`, group: '离职审批', title: hr ? 'HR 审批离职' : '负责人审批离职',
    summary: hr ? '执行离职终审；通过后立即停用申请人账号并撤销会话和 OAuth Token。' : '部门负责人执行一审；通过后流转 HR，驳回则结束。',
    method: 'POST', path: `/departures/:id/${stage}-review`, examplePath: `/departures/dpr_example/${stage}-review`, auth: 'session-csrf',
    permissionRequirement: hr ? 'People 会话具备 people.departure:review。' : '当前用户必须是申请快照中的部门负责人。',
    requestFields: [...csrfFields, field('id', 'Path', 'string', true, '离职申请 ID。', 'dpr_example'), field('approved', 'Body', 'boolean', true, '是否通过。', 'true'), field('comment', 'Body', 'string', false, '审批意见，最长 500 字符。', '同意')],
    responseFields: [...envelopeFields, ...departureFields], errors: mutationErrors, requestBody: JSON.stringify({ approved: true, comment: '同意' }, null, 2),
    responseExample: envelope({ ...departureExample, status: hr ? 'approved' : 'pending_hr' }),
  })
}

const cancelDepartureDocument = peopleEndpoint({
  audience: 'open', id: 'people-cancel-departure', group: '离职审批', title: '撤回离职申请', summary: '申请人在负责人审批前撤回自己的离职申请。',
  method: 'POST', path: '/departures/:id/cancel', examplePath: '/departures/dpr_example/cancel', auth: 'session-csrf', permissionRequirement: '申请本人且状态为 pending_manager。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '离职申请 ID。', 'dpr_example')], responseFields: [...envelopeFields, field('data.cancelled', 'Response', 'boolean', true, '是否已撤回。', 'true')], errors: mutationErrors, responseExample: envelope({ cancelled: true }),
})

const listNotificationsDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-notifications', group: '通知', title: '查询通知', summary: '查询当前员工的审批待办和审批结果通知。', method: 'GET', path: '/notifications', examplePath: '/notifications?unread=true', auth: 'session',
  permissionRequirement: '任意有效 People 会话。', requestFields: [sessionField, field('unread', 'Query', 'boolean', false, '是否仅返回未读通知。', 'true')],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '最多 100 条通知。')], responseExample: envelope([{ id: 'ntf_example', type: 'departure_review', title: '新的离职申请待审批', content: '张三提交了离职申请', resourceType: 'departure', resourceId: 'dpr_example', readAt: null, createdAt: '2026-08-08T08:00:00Z' }]),
})

const notificationSummaryDocument = peopleEndpoint({
  audience: 'open', id: 'people-notification-summary', group: '通知', title: '获取通知数字', summary: '返回右上角数字所需的未读通知和当前可处理审批数量。', method: 'GET', path: '/notifications/summary', auth: 'session',
  permissionRequirement: '任意有效 People 会话。', requestFields: [sessionField], responseFields: [...envelopeFields, field('data.unread', 'Response', 'integer', true, '未读直接通知数。', '1'), field('data.pendingTasks', 'Response', 'integer', true, '当前可处理审批数。', '2'), field('data.total', 'Response', 'integer', true, '两者合计。', '3')], responseExample: envelope({ unread: 1, pendingTasks: 2, total: 3 }),
})

const readNotificationDocument = peopleEndpoint({
  audience: 'open', id: 'people-read-notification', group: '通知', title: '标记通知已读', summary: '把当前员工的一条通知标记为已读。', method: 'POST', path: '/notifications/:id/read', examplePath: '/notifications/ntf_example/read', auth: 'session-csrf',
  permissionRequirement: '通知接收人本人。', requestFields: [...csrfFields, field('id', 'Path', 'string', true, '通知 ID。', 'ntf_example')], responseFields: [...envelopeFields, field('data.read', 'Response', 'boolean', true, '是否已读。', 'true')], errors: mutationErrors, responseExample: envelope({ read: true }),
})

const readAllNotificationsDocument = peopleEndpoint({
  audience: 'open', id: 'people-read-all-notifications', group: '通知', title: '全部通知已读', summary: '把当前员工的全部直接通知标记为已读。', method: 'POST', path: '/notifications/read-all', auth: 'session-csrf',
  permissionRequirement: '任意有效 People 会话。', requestFields: csrfFields, responseFields: [...envelopeFields, field('data.read', 'Response', 'boolean', true, '是否已处理。', 'true')], responseExample: envelope({ read: true }),
})

const authorizeDocument = peopleEndpoint({
  audience: 'open', id: 'people-oauth-authorize', group: 'OAuth 2.0', title: '确认 OAuth 授权',
  summary: '为已登录员工签发单次、五分钟有效的授权码，并返回带 code 和 state 的回调地址。', method: 'POST', path: '/oauth/authorize', auth: 'session-csrf',
  permissionRequirement: '已完成密码设置的 People 员工会话和 CSRF Token。',
  requestFields: [
    ...csrfFields,
    field('clientId', 'Body', 'string', true, '已注册的 OAuth Client ID。', 'permission-ui'),
    field('redirectUri', 'Body', 'string', true, '必须与客户端白名单中的 URI 完全一致。', 'https://admin.example.com/oauth/callback'),
    field('state', 'Body', 'string', true, '客户端生成并在回调时校验的防 CSRF 随机值。', 'random-state'),
    field('username', 'Body', 'string', false, '仅切换本次授权账号时填写，必须与 password 同时提供。', 'lisi'),
    field('password', 'Body', 'string', false, '切换账号的密码，不会替换当前浏览器会话。', '<PASSWORD>'),
  ],
  responseFields: [...envelopeFields, field('data.redirectUrl', 'Response', 'string', true, '携带授权码和 state 的回调 URL。', 'https://admin.example.com/oauth/callback?code=poc_...&state=random-state')],
  requestBody: JSON.stringify({ clientId: 'permission-ui', redirectUri: 'https://admin.example.com/oauth/callback', state: 'random-state' }, null, 2),
  responseExample: envelope({ redirectUrl: 'https://admin.example.com/oauth/callback?code=poc_example&state=random-state' }),
})

const oauthErrors: ErrorDefinition[] = [
  { httpStatus: 400, code: 'invalid_request', description: 'grant_type、授权码、回调地址或 scope 无效。', resolution: '核对授权请求记录和客户端允许的 scope。' },
  { httpStatus: 401, code: 'invalid_client', description: 'Client ID 或 Client Secret 无效。', resolution: '在服务端读取当前 OAuth Client Secret，不要通过浏览器提交 Secret。' },
]

const tokenDocument = peopleEndpoint({
  audience: 'open', id: 'people-oauth-token', group: 'OAuth 2.0', title: '换取 OAuth Token',
  summary: '支持 authorization_code 与 client_credentials；授权码 Token 有效期 1 小时，客户端凭据 Token 有效期 10 分钟。', method: 'POST', path: '/oauth/token', auth: 'oauth-client', contentType: 'form',
  permissionRequirement: '有效 OAuth Client，使用 HTTP Basic 提交 Client ID 与 Client Secret。',
  requestFields: [
    field('Authorization', 'Header', 'string', true, 'OAuth Client Basic 认证。', 'Basic base64(client_id:client_secret)'),
    field('grant_type', 'Body', 'string', true, 'authorization_code 或 client_credentials。', 'client_credentials'),
    field('code', 'Body', 'string', false, '授权码模式必填，只能使用一次且五分钟内有效。', 'poc_...'),
    field('redirect_uri', 'Body', 'string', false, '授权码模式必填，必须与授权时完全一致。', 'https://admin.example.com/oauth/callback'),
    field('scope', 'Body', 'string', false, '客户端凭据模式请求的 scope；省略时为 employees.read。', 'employees.read'),
  ],
  responseFields: [
    field('access_token', 'Response', 'string', true, 'Bearer Token。', 'pat_...'),
    field('token_type', 'Response', 'string', true, '固定为 Bearer。', 'Bearer'),
    field('expires_in', 'Response', 'integer', true, '有效期，单位秒。', '600'),
    field('scope', 'Response', 'string', true, '实际授予的 scope。', 'employees.read'),
    field('user', 'Response', 'object', false, '授权码模式返回员工资料；客户端凭据模式不返回。'),
  ],
  errors: oauthErrors, requestBody: 'grant_type=client_credentials&scope=employees.read',
  responseExample: JSON.stringify({ access_token: 'pat_example', token_type: 'Bearer', expires_in: 600, scope: 'employees.read' }, null, 2),
})

const userinfoDocument = peopleEndpoint({
  audience: 'open', id: 'people-oauth-userinfo', group: 'OAuth 2.0', title: '获取 OAuth 用户信息',
  summary: '使用授权码模式签发的 Token 获取对应员工资料；客户端凭据 Token 不代表员工。', method: 'GET', path: '/oauth/userinfo', auth: 'bearer',
  permissionRequirement: 'authorization_code 模式签发且尚未过期的 Bearer Token。', requestFields: [bearerField],
  responseFields: employeeResponseFields('').map((item) => ({ ...item, name: item.name.replace(/^\./, '') })),
  errors: [{ httpStatus: 401, code: 'invalid_token', description: 'Token 无效、过期或不代表员工。', resolution: '重新完成 OAuth 授权码流程。' }],
  responseExample: JSON.stringify(employeeExample, null, 2),
})

export const peopleOpenEndpoints: EndpointDocument[] = [
  csrfDocument,
  loginDocument,
  meDocument,
  logoutDocument,
  changePasswordDocument,
  listEmployeesDocument,
  createEmployeeDocument,
  updateEmployeeDocument,
  deleteEmployeeDocument,
  resetEmployeePasswordDocument,
  setEmployeeEnabledDocument,
  hrDashboardDocument,
  listDepartmentsDocument,
  createDepartmentDocument,
  updateDepartmentDocument,
  deleteDepartmentDocument,
  listDeparturesDocument,
  createDepartureDocument,
  reviewDepartureDocument('manager'),
  reviewDepartureDocument('hr'),
  cancelDepartureDocument,
  listNotificationsDocument,
  notificationSummaryDocument,
  readNotificationDocument,
  readAllNotificationsDocument,
  authorizeDocument,
  tokenDocument,
  userinfoDocument,
]
