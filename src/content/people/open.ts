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
  probationEndDate: '2026-11-01', workLocation: '北京', emergencyContactName: '李四',
  emergencyContactPhone: '13900139000', emergencyContactRelation: '配偶',
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

const approvalExample = {
  id: 'apr_example', type: 'transfer', title: '岗位异动申请', summary: '张三申请调整至 数据平台部 / 高级后端工程师',
  applicantId: employeeExample.id, applicantName: employeeExample.displayName, applicantNo: employeeExample.employeeNo,
  departmentId: 'dep_platform', departmentName: '平台研发部',
  data: { targetDepartmentId: 'dep_data', targetDepartmentName: '数据平台部', targetTitle: '高级后端工程师', effectiveDate: '2026-09-01', reason: '组织调整' },
  status: 'pending', currentStep: 1, totalSteps: 2, currentStepName: '部门负责人审批',
  steps: [{ id: 1, sequence: 1, name: '部门负责人审批', approverId: 'pep_leader', permissionCode: '', status: 'pending', reviewerId: '', reviewerName: '', comment: '', reviewedAt: null }],
  canReview: false, canCancel: true, submittedAt: '2026-08-09T08:00:00Z', completedAt: null,
  createdAt: '2026-08-09T08:00:00Z', updatedAt: '2026-08-09T08:00:00Z',
}
const approvalFields: FieldDefinition[] = [
  field('data.id', 'Response', 'string', true, '审批流程 ID。', 'apr_example'),
  field('data.type', 'Response', 'string', true, '流程类型：leave、transfer 或 departure。', 'transfer'),
  field('data.title', 'Response', 'string', true, '流程标题。', '岗位异动申请'),
  field('data.summary', 'Response', 'string', true, '可直接展示的流程摘要。', '张三申请调整至数据平台部'),
  field('data.applicantId', 'Response', 'string', true, '申请人员工公开 ID。', employeeExample.id),
  field('data.applicantName', 'Response', 'string', true, '申请人姓名快照。', employeeExample.displayName),
  field('data.applicantNo', 'Response', 'integer', true, '申请人员工号。', '10086'),
  field('data.departmentId', 'Response', 'string', true, '发起时所属部门 ID。', 'dep_platform'),
  field('data.departmentName', 'Response', 'string', true, '发起时所属部门名称。', '平台研发部'),
  field('data.data', 'Response', 'object', true, '类型专属数据；字段与创建审批时对应。'),
  field('data.status', 'Response', 'string', true, 'pending、approved、rejected 或 cancelled。', 'pending'),
  field('data.currentStep', 'Response', 'integer', true, '当前步骤序号，从 1 开始。', '1'),
  field('data.totalSteps', 'Response', 'integer', true, '审批步骤总数。', '2'),
  field('data.currentStepName', 'Response', 'string', true, '当前步骤名称；流程结束后为空。', '部门负责人审批'),
  field('data.steps', 'Response', 'array<object>', true, '有序审批步骤，包含审批人、权限要求、状态、审批意见和时间。'),
  field('data.canReview', 'Response', 'boolean', true, '当前用户是否可以处理当前步骤。', 'false'),
  field('data.canCancel', 'Response', 'boolean', true, '当前用户是否可以撤回。', 'true'),
  field('data.submittedAt', 'Response', 'string', true, '提交时间，ISO 8601。', '2026-08-09T08:00:00Z'),
  field('data.completedAt', 'Response', 'string|null', true, '流程结束时间。', 'null'),
]

const contractExample = {
  id: 'ctr_example', employeeId: employeeExample.id, employeeName: employeeExample.displayName, type: 'fixed_term',
  startDate: '2026-08-01', endDate: '2029-07-31', status: 'active', documentName: '张三劳动合同.pdf', note: '首签三年',
  createdAt: '2026-08-09T08:00:00Z', updatedAt: '2026-08-09T08:00:00Z',
}
const contractFields: FieldDefinition[] = [
  field('data.id', 'Response', 'string', true, '合同记录 ID。', 'ctr_example'),
  field('data.employeeId', 'Response', 'string', true, '员工公开 ID。', employeeExample.id),
  field('data.employeeName', 'Response', 'string', true, '员工姓名快照。', employeeExample.displayName),
  field('data.type', 'Response', 'string', true, 'fixed_term、open_ended、internship 或 service。', 'fixed_term'),
  field('data.startDate', 'Response', 'string', true, '开始日期，YYYY-MM-DD。', '2026-08-01'),
  field('data.endDate', 'Response', 'string', true, '结束日期；无固定期限合同可为空。', '2029-07-31'),
  field('data.status', 'Response', 'string', true, 'active、ended 或 terminated。', 'active'),
  field('data.documentName', 'Response', 'string', true, '关联电子合同文件名。', '张三劳动合同.pdf'),
  field('data.note', 'Response', 'string', true, '合同备注。', '首签三年'),
]
const contractInputFields: FieldDefinition[] = [
  field('type', 'Body', 'string', true, 'fixed_term、open_ended、internship 或 service。', 'fixed_term'),
  field('startDate', 'Body', 'string', true, '开始日期，YYYY-MM-DD。', '2026-08-01'),
  field('endDate', 'Body', 'string', false, '结束日期；open_ended 可为空，其他类型必填且不能早于开始日期。', '2029-07-31'),
  field('status', 'Body', 'string', true, 'active、ended 或 terminated；同一员工只能有一份 active 合同。', 'active'),
  field('documentName', 'Body', 'string', false, '关联电子合同文件名，最长 255 字符。', '张三劳动合同.pdf'),
  field('note', 'Body', 'string', false, '合同备注，最长 1000 字符。', '首签三年'),
]

const goalExample = {
  id: 'gol_example', employeeId: employeeExample.id, employeeName: employeeExample.displayName, departmentId: 'dep_platform',
  cycle: '2026-H2', title: '提升核心服务可靠性', description: '将关键链路可用性提升至 99.95%', dueDate: '2026-12-31',
  weight: 40, progress: 30, status: 'active', managerComment: '按季度检查关键指标', canEdit: true, canReview: false,
  createdAt: '2026-08-09T08:00:00Z', updatedAt: '2026-08-09T08:00:00Z',
}
const goalFields: FieldDefinition[] = [
  field('data.id', 'Response', 'string', true, '绩效目标 ID。', 'gol_example'),
  field('data.employeeId', 'Response', 'string', true, '目标归属员工公开 ID。', employeeExample.id),
  field('data.employeeName', 'Response', 'string', true, '员工姓名。', employeeExample.displayName),
  field('data.departmentId', 'Response', 'string', true, '目标所属部门 ID。', 'dep_platform'),
  field('data.cycle', 'Response', 'string', true, '绩效周期。', '2026-H2'),
  field('data.title', 'Response', 'string', true, '目标标题。', '提升核心服务可靠性'),
  field('data.description', 'Response', 'string', true, '目标说明。'),
  field('data.dueDate', 'Response', 'string', true, '目标截止日期。', '2026-12-31'),
  field('data.weight', 'Response', 'integer', true, '目标权重，1-100。', '40'),
  field('data.progress', 'Response', 'integer', true, '完成进度，0-100；100 会自动转为 completed。', '30'),
  field('data.status', 'Response', 'string', true, 'draft、active、completed 或 cancelled。', 'active'),
  field('data.managerComment', 'Response', 'string', true, '直属部门负责人或 HR 的反馈。'),
  field('data.canEdit', 'Response', 'boolean', true, '当前用户是否可维护目标。', 'true'),
  field('data.canReview', 'Response', 'boolean', true, '当前用户是否可填写管理者反馈。', 'false'),
]
const goalInputFields: FieldDefinition[] = [
  field('cycle', 'Body', 'string', true, '绩效周期，最长 32 字符。', '2026-H2'),
  field('title', 'Body', 'string', true, '目标标题，最长 160 字符。', '提升核心服务可靠性'),
  field('description', 'Body', 'string', false, '目标说明，最长 1000 字符。'),
  field('dueDate', 'Body', 'string', true, '截止日期，YYYY-MM-DD。', '2026-12-31'),
  field('weight', 'Body', 'integer', true, '目标权重，1-100。', '40'),
  field('progress', 'Body', 'integer', true, '完成进度，0-100。', '30'),
  field('status', 'Body', 'string', true, 'draft、active、completed 或 cancelled。', 'active'),
  field('managerComment', 'Body', 'string', false, '管理者反馈；员工本人提交时不会写入。'),
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

const updateProfileDocument = peopleEndpoint({
  audience: 'open', id: 'people-update-profile', group: '员工自助', title: '更新个人联系方式',
  summary: '当前员工维护自己的邮箱、电话和紧急联系人，不允许通过本接口更改组织任职信息。', method: 'PUT', path: '/profile', auth: 'session-csrf',
  permissionRequirement: '任意有效 People 会话并完成 CSRF 校验。',
  requestFields: [
    ...csrfFields,
    field('email', 'Body', 'string', false, '邮箱，最长 255 字符。', 'zhangsan@example.com'),
    field('phone', 'Body', 'string', false, '联系电话，最长 32 字符。', '+86 13800138000'),
    field('emergencyContactName', 'Body', 'string', false, '紧急联系人姓名，最长 100 字符。', '李四'),
    field('emergencyContactPhone', 'Body', 'string', false, '紧急联系人电话，最长 32 字符。', '13900139000'),
    field('emergencyContactRelation', 'Body', 'string', false, '与紧急联系人的关系，最长 50 字符。', '配偶'),
  ],
  responseFields: [...envelopeFields, ...employeeResponseFields()],
  requestBody: JSON.stringify({ email: 'zhangsan@example.com', phone: '+86 13800138000', emergencyContactName: '李四', emergencyContactPhone: '13900139000', emergencyContactRelation: '配偶' }, null, 2),
  responseExample: envelope(employeeExample), errors: mutationErrors,
})

const employmentEventsDocument = peopleEndpoint({
  audience: 'open', id: 'people-employment-events', group: '员工生命周期', title: '查询任职轨迹',
  summary: '按生效日期倒序返回入职、调动、晋升、离职及账号启停事件。', method: 'GET', path: '/employees/:id/events', examplePath: `/employees/${employeeExample.id}/events`, auth: 'session',
  permissionRequirement: '员工可查看本人；查看他人需要 people.employee:view。', requestFields: [sessionField, idField],
  responseFields: [
    ...envelopeFields,
    field('data', 'Response', 'array<object>', true, '任职事件列表。'),
    field('data[].id', 'Response', 'string', true, '事件 ID。', 'evt_example'),
    field('data[].employeeId', 'Response', 'string', true, '员工公开 ID。', employeeExample.id),
    field('data[].type', 'Response', 'string', true, 'hire、transfer、promotion、departure、enable 或 disable。', 'transfer'),
    field('data[].effectiveDate', 'Response', 'string', true, '业务生效日期。', '2026-09-01'),
    field('data[].fromDepartmentId', 'Response', 'string', true, '变更前部门 ID。', 'dep_platform'),
    field('data[].toDepartmentId', 'Response', 'string', true, '变更后部门 ID。', 'dep_data'),
    field('data[].fromTitle', 'Response', 'string', true, '变更前职务。', '后端工程师'),
    field('data[].toTitle', 'Response', 'string', true, '变更后职务。', '高级后端工程师'),
    field('data[].note', 'Response', 'string', true, '事件说明。', '组织调整'),
    field('data[].approvalId', 'Response', 'string', true, '关联审批 ID；手工变更时可为空。', 'apr_example'),
  ],
  responseExample: envelope([{ id: 'evt_example', employeeId: employeeExample.id, type: 'transfer', effectiveDate: '2026-09-01', fromDepartmentId: 'dep_platform', fromDepartment: '平台研发部', toDepartmentId: 'dep_data', toDepartment: '数据平台部', fromTitle: '后端工程师', toTitle: '高级后端工程师', note: '组织调整', approvalId: 'apr_example', createdAt: '2026-08-09T08:00:00Z' }]),
})

const hrDashboardDocument = peopleEndpoint({
  audience: 'open', id: 'people-hr-dashboard', group: '人事概览', title: '获取人事概览', summary: '返回人员、组织、审批、假勤、合同和绩效风险指标及分布。',
  method: 'GET', path: '/hr/dashboard', auth: 'session', permissionRequirement: 'People 会话具备 people.dashboard:view。', requestFields: [sessionField],
  responseFields: [
    ...envelopeFields,
    field('data.totalEmployees', 'Response', 'integer', true, '员工总数。', '120'),
    field('data.enabledEmployees', 'Response', 'integer', true, '在职员工数。', '116'),
    field('data.disabledEmployees', 'Response', 'integer', true, '停用员工数。', '4'),
    field('data.departments', 'Response', 'integer', true, '启用部门数。', '9'),
    field('data.pendingDepartures', 'Response', 'integer', true, '待审批离职数。', '2'),
    field('data.pendingApprovals', 'Response', 'integer', true, '全部类型的待审批流程数。', '5'),
    field('data.probationEmployees', 'Response', 'integer', true, '试用期员工数。', '8'),
    field('data.recentHires', 'Response', 'integer', true, '近 30 天入职数。', '3'),
    field('data.employeesOnLeave', 'Response', 'integer', true, '当前正在休假的员工数。', '2'),
    field('data.contractsExpiring', 'Response', 'integer', true, '未来两个月内到期的生效合同数。', '4'),
    field('data.activeGoals', 'Response', 'integer', true, '进行中的绩效目标数。', '38'),
    field('data.overdueGoals', 'Response', 'integer', true, '已逾期且未完成的绩效目标数。', '3'),
    field('data.departmentDistribution', 'Response', 'array<object>', true, '在职员工部门分布；元素包含 name 和 count。'),
    field('data.employmentTypeDistribution', 'Response', 'array<object>', true, '在职员工用工类型分布；元素包含 name 和 count。'),
    field('data.approvalDistribution', 'Response', 'array<object>', true, '待审批流程类型分布；元素包含 name 和 count。'),
  ],
  responseExample: envelope({
    totalEmployees: 120, enabledEmployees: 116, disabledEmployees: 4, departments: 9, pendingDepartures: 2,
    pendingApprovals: 5, probationEmployees: 8, recentHires: 3, employeesOnLeave: 2, contractsExpiring: 4,
    activeGoals: 38, overdueGoals: 3, departmentDistribution: [{ name: '平台研发部', count: 32 }],
    employmentTypeDistribution: [{ name: 'full_time', count: 108 }], approvalDistribution: [{ name: 'leave', count: 3 }],
  }),
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

const approvalTypesDocument = peopleEndpoint({
  audience: 'open', id: 'people-approval-types', group: '通用审批', title: '查询审批类型',
  summary: '返回当前支持的请假、岗位异动和离职流程定义及有序审批步骤。', method: 'GET', path: '/approval-types', auth: 'session',
  permissionRequirement: '任意有效 People 会话。', requestFields: [sessionField],
  responseFields: [
    ...envelopeFields, field('data', 'Response', 'array<object>', true, '审批类型定义。'),
    field('data[].code', 'Response', 'string', true, 'leave、transfer 或 departure。', 'leave'),
    field('data[].name', 'Response', 'string', true, '类型显示名称。', '请假'),
    field('data[].description', 'Response', 'string', true, '适用场景说明。'),
    field('data[].steps', 'Response', 'array<string>', true, '按执行顺序排列的审批步骤名称。'),
  ],
  responseExample: envelope([{ code: 'leave', name: '请假', description: '年假、病假、事假等休假申请', steps: ['部门负责人审批'] }, { code: 'transfer', name: '岗位异动', description: '部门或职务调整申请', steps: ['部门负责人审批', 'HR 审批'] }, { code: 'departure', name: '离职', description: '员工离职与账号停用流程', steps: ['部门负责人审批', 'HR 审批'] }]),
})

const listApprovalsDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-approvals', group: '通用审批', title: '查询审批流程',
  summary: '按可见范围、类型和状态筛选审批；结果包含步骤及当前用户可执行动作。', method: 'GET', path: '/approvals', examplePath: '/approvals?scope=pending&type=leave&status=pending', auth: 'session',
  permissionRequirement: '任意有效 People 会话；scope=all 需要 people.approval:view，权限审批步骤需要 people.approval:review。',
  requestFields: [
    sessionField,
    field('scope', 'Query', 'string', false, 'mine 仅本人、pending 当前待办、all 全量；省略时返回本人和与本人相关流程。', 'pending'),
    field('type', 'Query', 'string', false, 'leave、transfer 或 departure。', 'leave'),
    field('status', 'Query', 'string', false, 'pending、approved、rejected 或 cancelled。', 'pending'),
  ],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '审批流程列表。'), ...approvalFields.map((item) => ({ ...item, name: item.name.replace('data.', 'data[].') }))],
  responseExample: envelope([approvalExample]),
})

const createApprovalDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-approval', group: '通用审批', title: '发起审批流程',
  summary: '发起请假、岗位异动或离职审批；同一员工同一类型只能存在一个待审批流程。', method: 'POST', path: '/approvals', auth: 'session-csrf',
  permissionRequirement: '任意非管理员在职员工；所在启用部门必须配置其他员工作为负责人。',
  prerequisites: [
    'leave.data：leaveType 为 annual、sick、personal 或 other；startDate/endDate 同年且包含 1-60 个工作日；年假校验可用余额。',
    'transfer.data：targetDepartmentId、targetTitle、effectiveDate 必填，可选 reason；目标部门必须启用。',
    'departure.data：reason、lastWorkingDate 必填；日期不得早于今天。',
  ],
  requestFields: [
    ...csrfFields,
    field('type', 'Body', 'string', true, 'leave、transfer 或 departure。', 'transfer'),
    field('data', 'Body', 'object', true, '由 type 决定的类型专属数据。'),
  ],
  responseFields: [...envelopeFields, ...approvalFields], errors: mutationErrors,
  requestBody: JSON.stringify({ type: 'transfer', data: { targetDepartmentId: 'dep_data', targetTitle: '高级后端工程师', effectiveDate: '2026-09-01', reason: '组织调整' } }, null, 2),
  responseExample: envelope(approvalExample, '创建成功'),
})

const getApprovalDocument = peopleEndpoint({
  audience: 'open', id: 'people-get-approval', group: '通用审批', title: '查询审批详情',
  summary: '返回审批业务数据、完整步骤和当前用户可执行动作。', method: 'GET', path: '/approvals/:id', examplePath: '/approvals/apr_example', auth: 'session',
  permissionRequirement: '申请人、流程审批人、people.approval:view 或 people.approval:review 用户。',
  requestFields: [sessionField, field('id', 'Path', 'string', true, '审批流程 ID。', 'apr_example')], responseFields: [...envelopeFields, ...approvalFields],
  errors: mutationErrors, responseExample: envelope(approvalExample),
})

const reviewApprovalDocument = peopleEndpoint({
  audience: 'open', id: 'people-review-approval', group: '通用审批', title: '处理审批步骤',
  summary: '仅当前步骤的指定负责人或具备步骤权限的 HR 可以通过或驳回，申请人不能审批自己的流程。', method: 'POST', path: '/approvals/:id/review', examplePath: '/approvals/apr_example/review', auth: 'session-csrf',
  permissionRequirement: '当前用户匹配步骤 approverId，或步骤要求 people.approval:review 且用户具备该权限。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '审批流程 ID。', 'apr_example'), field('approved', 'Body', 'boolean', true, 'true 通过，false 驳回。', 'true'), field('comment', 'Body', 'string', false, '审批意见，最长 500 字符。', '同意')],
  responseFields: [...envelopeFields, ...approvalFields], errors: mutationErrors,
  requestBody: JSON.stringify({ approved: true, comment: '同意' }, null, 2), responseExample: envelope({ ...approvalExample, currentStep: 2, currentStepName: 'HR 审批' }),
})

const cancelApprovalDocument = peopleEndpoint({
  audience: 'open', id: 'people-cancel-approval', group: '通用审批', title: '撤回审批流程',
  summary: '申请人在第一步尚未处理前撤回自己的流程，同时取消关联请假记录。', method: 'POST', path: '/approvals/:id/cancel', examplePath: '/approvals/apr_example/cancel', auth: 'session-csrf',
  permissionRequirement: '申请人本人，且流程为 pending、currentStep=1。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '审批流程 ID。', 'apr_example')],
  responseFields: [...envelopeFields, field('data.cancelled', 'Response', 'boolean', true, '是否撤回成功。', 'true')], errors: mutationErrors, responseExample: envelope({ cancelled: true }),
})

const leaveBalanceDocument = peopleEndpoint({
  audience: 'open', id: 'people-leave-balance', group: '假勤管理', title: '查询个人假期余额',
  summary: '返回当前员工指定年度的年假额度、已用、审批中和剩余天数，以及病假和事假已用天数。', method: 'GET', path: '/leave/balance', examplePath: '/leave/balance?year=2026', auth: 'session',
  permissionRequirement: '任意有效 People 会话，只能查询本人。', requestFields: [sessionField, field('year', 'Query', 'integer', false, '年度，2000-2200；无效或省略时使用当前年。', '2026')],
  responseFields: [
    ...envelopeFields, field('data.employeeId', 'Response', 'string', true, '员工公开 ID。', employeeExample.id),
    field('data.year', 'Response', 'integer', true, '额度年度。', '2026'),
    field('data.annualEntitlement', 'Response', 'number', true, '年假总额度。', '10'),
    field('data.annualUsed', 'Response', 'number', true, '已批准使用的年假。', '2'),
    field('data.annualPending', 'Response', 'number', true, '审批中的年假。', '1'),
    field('data.annualRemaining', 'Response', 'number', true, '可申请年假余额。', '7'),
    field('data.sickUsed', 'Response', 'number', true, '已批准病假天数。', '1'),
    field('data.personalUsed', 'Response', 'number', true, '已批准事假天数。', '0'),
  ],
  responseExample: envelope({ employeeId: employeeExample.id, year: 2026, annualEntitlement: 10, annualUsed: 2, annualPending: 1, annualRemaining: 7, sickUsed: 1, personalUsed: 0 }),
})

const leaveCalendarDocument = peopleEndpoint({
  audience: 'open', id: 'people-leave-calendar', group: '假勤管理', title: '查询休假日历',
  summary: '查询与指定月份有交集的休假；员工看本人，部门负责人看本部门，people.approval:view 看全量。', method: 'GET', path: '/leave/calendar', examplePath: '/leave/calendar?month=2026-08', auth: 'session',
  permissionRequirement: '任意有效 People 会话；可见范围随角色和权限收敛。', requestFields: [sessionField, field('month', 'Query', 'string', false, '月份，YYYY-MM；省略时返回全部可见记录。', '2026-08')],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '休假记录，包含员工、部门、假种、起止日期、工作日数、原因和审批状态。')],
  responseExample: envelope([{ id: 'lev_example', approvalId: 'apr_leave', employeeId: employeeExample.id, employeeName: employeeExample.displayName, departmentId: 'dep_platform', departmentName: '平台研发部', leaveType: 'annual', startDate: '2026-08-17', endDate: '2026-08-18', days: 2, reason: '家庭安排', status: 'approved', createdAt: '2026-08-09T08:00:00Z', updatedAt: '2026-08-09T08:00:00Z' }]),
})

const listContractsDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-contracts', group: '合同管理', title: '查询员工合同',
  summary: '员工查看本人合同；具备合同查看或管理权限的用户可查看全量并按员工筛选。', method: 'GET', path: '/contracts', examplePath: `/contracts?employeeId=${employeeExample.id}`, auth: 'session',
  permissionRequirement: '任意有效 People 会话；查询他人需要 people.contract:view 或 people.contract:manage。',
  requestFields: [sessionField, field('employeeId', 'Query', 'string', false, '员工公开 ID；无全量权限时忽略并仅返回本人。', employeeExample.id)],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '合同记录。'), ...contractFields.map((item) => ({ ...item, name: item.name.replace('data.', 'data[].') }))], responseExample: envelope([contractExample]),
})

const createContractDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-contract', group: '合同管理', title: '创建员工合同',
  summary: '为指定员工登记合同，并保证同一员工最多一份生效合同。', method: 'POST', path: '/employees/:id/contracts', examplePath: `/employees/${employeeExample.id}/contracts`, auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.contract:manage。', requestFields: [...csrfFields, idField, ...contractInputFields],
  responseFields: [...envelopeFields, ...contractFields], errors: mutationErrors,
  requestBody: JSON.stringify({ type: 'fixed_term', startDate: '2026-08-01', endDate: '2029-07-31', status: 'active', documentName: '张三劳动合同.pdf', note: '首签三年' }, null, 2), responseExample: envelope(contractExample, '创建成功'),
})

const updateContractDocument = peopleEndpoint({
  audience: 'open', id: 'people-update-contract', group: '合同管理', title: '更新员工合同',
  summary: '更新合同类型、期限、状态和关联文档信息。', method: 'PUT', path: '/contracts/:id', examplePath: '/contracts/ctr_example', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.contract:manage。', requestFields: [...csrfFields, field('id', 'Path', 'string', true, '合同记录 ID。', 'ctr_example'), ...contractInputFields],
  responseFields: [...envelopeFields, ...contractFields], errors: mutationErrors,
  requestBody: JSON.stringify({ type: 'fixed_term', startDate: '2026-08-01', endDate: '2029-07-31', status: 'active', documentName: '张三劳动合同.pdf', note: '续签待办已完成' }, null, 2), responseExample: envelope(contractExample),
})

const deleteContractDocument = peopleEndpoint({
  audience: 'open', id: 'people-delete-contract', group: '合同管理', title: '删除员工合同',
  summary: '删除指定合同记录。', method: 'DELETE', path: '/contracts/:id', examplePath: '/contracts/ctr_example', auth: 'session-csrf',
  permissionRequirement: 'People 会话具备 people.contract:manage。', requestFields: [...csrfFields, field('id', 'Path', 'string', true, '合同记录 ID。', 'ctr_example')],
  responseFields: [...envelopeFields, field('data.deleted', 'Response', 'boolean', true, '是否删除成功。', 'true')], errors: mutationErrors, responseExample: envelope({ deleted: true }),
})

const listGoalsDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-goals', group: '绩效目标', title: '查询绩效目标',
  summary: '员工查看本人目标，部门负责人同时查看本部门目标，绩效权限用户查看全量。', method: 'GET', path: '/performance-goals', examplePath: '/performance-goals?cycle=2026-H2', auth: 'session',
  permissionRequirement: '任意有效 People 会话；people.performance:view 或 people.performance:manage 可查看全量。',
  requestFields: [sessionField, field('cycle', 'Query', 'string', false, '精确筛选绩效周期。', '2026-H2')],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '绩效目标。'), ...goalFields.map((item) => ({ ...item, name: item.name.replace('data.', 'data[].') }))], responseExample: envelope([goalExample]),
})

const createGoalDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-goal', group: '绩效目标', title: '创建个人绩效目标',
  summary: '当前员工为自己创建目标，初始状态省略时默认为 active。', method: 'POST', path: '/performance-goals', auth: 'session-csrf',
  permissionRequirement: '任意有效 People 会话并完成 CSRF 校验。', requestFields: [...csrfFields, ...goalInputFields],
  responseFields: [...envelopeFields, ...goalFields], errors: mutationErrors,
  requestBody: JSON.stringify({ cycle: '2026-H2', title: '提升核心服务可靠性', description: '将关键链路可用性提升至 99.95%', dueDate: '2026-12-31', weight: 40, progress: 0, status: 'active', managerComment: '' }, null, 2), responseExample: envelope(goalExample, '创建成功'),
})

const updateGoalDocument = peopleEndpoint({
  audience: 'open', id: 'people-update-goal', group: '绩效目标', title: '更新绩效目标或反馈',
  summary: '员工或 HR 更新目标内容和进度；部门负责人或 HR 可填写管理者反馈。', method: 'PUT', path: '/performance-goals/:id', examplePath: '/performance-goals/gol_example', auth: 'session-csrf',
  permissionRequirement: '目标本人、所属部门负责人，或具备 people.performance:manage 的用户。',
  requestFields: [...csrfFields, field('id', 'Path', 'string', true, '绩效目标 ID。', 'gol_example'), ...goalInputFields],
  responseFields: [...envelopeFields, ...goalFields], errors: mutationErrors,
  requestBody: JSON.stringify({ cycle: '2026-H2', title: '提升核心服务可靠性', description: '将关键链路可用性提升至 99.95%', dueDate: '2026-12-31', weight: 40, progress: 30, status: 'active', managerComment: '按季度检查关键指标' }, null, 2), responseExample: envelope(goalExample),
})

const listDeparturesDocument = peopleEndpoint({
  audience: 'open', id: 'people-list-departures', group: '兼容接口', title: '查询离职申请（兼容）', summary: '旧版离职审批兼容接口；新集成应使用 GET /approvals?type=departure。',
  method: 'GET', path: '/departures', auth: 'session', permissionRequirement: '任意有效 People 会话；people.departure:review 可查看全量。', requestFields: [sessionField],
  responseFields: [...envelopeFields, field('data', 'Response', 'array<object>', true, '当前用户可见的离职申请。'), ...departureFields.map((item) => ({ ...item, name: item.name.replace('data.', 'data[].') }))],
  responseExample: envelope([departureExample]),
})

const createDepartureDocument = peopleEndpoint({
  audience: 'open', id: 'people-create-departure', group: '兼容接口', title: '发起离职申请（兼容）', summary: '旧版兼容入口；内部创建的仍是 departure 类型通用审批，新集成应使用 POST /approvals。',
  method: 'POST', path: '/departures', auth: 'session-csrf', permissionRequirement: '任意非管理员在职员工；所在部门必须配置其他员工作为负责人。',
  requestFields: [...csrfFields, field('reason', 'Body', 'string', true, '离职原因，最长 1000 字符。', '个人发展'), field('lastWorkingDate', 'Body', 'string', true, '最后工作日，不得早于今天。', '2026-08-31')],
  responseFields: [...envelopeFields, ...departureFields], errors: mutationErrors, requestBody: JSON.stringify({ reason: '个人发展', lastWorkingDate: '2026-08-31' }, null, 2), responseExample: envelope(departureExample, '创建成功'),
})

function reviewDepartureDocument(stage: 'manager' | 'hr'): EndpointDocument {
  const hr = stage === 'hr'
  return peopleEndpoint({
    audience: 'open', id: `people-review-departure-${stage}`, group: '兼容接口', title: hr ? 'HR 审批离职（兼容）' : '负责人审批离职（兼容）',
    summary: hr ? '执行离职终审；通过后立即停用申请人账号并撤销会话和 OAuth Token。' : '部门负责人执行一审；通过后流转 HR，驳回则结束。',
    method: 'POST', path: `/departures/:id/${stage}-review`, examplePath: `/departures/dpr_example/${stage}-review`, auth: 'session-csrf',
    permissionRequirement: hr ? 'People 会话具备 people.departure:review。' : '当前用户必须是申请快照中的部门负责人。',
    requestFields: [...csrfFields, field('id', 'Path', 'string', true, '离职申请 ID。', 'dpr_example'), field('approved', 'Body', 'boolean', true, '是否通过。', 'true'), field('comment', 'Body', 'string', false, '审批意见，最长 500 字符。', '同意')],
    responseFields: [...envelopeFields, ...departureFields], errors: mutationErrors, requestBody: JSON.stringify({ approved: true, comment: '同意' }, null, 2),
    responseExample: envelope({ ...departureExample, status: hr ? 'approved' : 'pending_hr' }),
  })
}

const cancelDepartureDocument = peopleEndpoint({
  audience: 'open', id: 'people-cancel-departure', group: '兼容接口', title: '撤回离职申请（兼容）', summary: '旧版兼容入口；申请人在负责人审批前撤回自己的离职申请。',
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
  updateProfileDocument,
  employmentEventsDocument,
  hrDashboardDocument,
  listDepartmentsDocument,
  createDepartmentDocument,
  updateDepartmentDocument,
  deleteDepartmentDocument,
  approvalTypesDocument,
  listApprovalsDocument,
  createApprovalDocument,
  getApprovalDocument,
  reviewApprovalDocument,
  cancelApprovalDocument,
  leaveBalanceDocument,
  leaveCalendarDocument,
  listContractsDocument,
  createContractDocument,
  updateContractDocument,
  deleteContractDocument,
  listGoalsDocument,
  createGoalDocument,
  updateGoalDocument,
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
