import type { SystemDocument } from '@/types/document'
import { peopleInnerBaseUrl, peopleOpenBaseUrl } from './common'
import { peopleInnerEndpoints } from './inner'
import { peopleOpenEndpoints } from './open'

export const peopleOpenSystem: SystemDocument = {
  id: 'people',
  audience: 'open',
  name: 'People 系统',
  shortName: 'People',
  description: '员工登录、组织管理与 OAuth 2.0 身份服务的开放接口。',
  version: 'v1',
  baseUrl: peopleOpenBaseUrl,
  endpoints: peopleOpenEndpoints,
}

export const peopleInnerSystem: SystemDocument = {
  id: 'people',
  audience: 'inner',
  name: 'People 系统',
  shortName: 'People',
  description: '面向受信任内部服务的员工与部门实时目录接口。',
  version: 'v1',
  baseUrl: peopleInnerBaseUrl,
  endpoints: peopleInnerEndpoints,
}
