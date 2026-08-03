import type { SystemDocument } from '@/types/document'
import { authorizeDocument } from './authorize'
import { addUserToGroupDocument } from './add-user-to-group'
import { baseUrl } from './common'
import { createResourceDocument } from './create-resource'
import { createRoleDocument } from './create-role'
import { downloadSpecDocument } from './download-spec'
import { addPermissionsDocument, removePermissionsDocument } from './permission-grants'
import { addRolePrincipalsDocument, removeRolePrincipalsDocument } from './role-principals'
import { removeUserFromGroupDocument } from './remove-user-from-group'

export const permissionSystem: SystemDocument = {
  id: 'permission',
  name: '权限系统',
  shortName: '权限',
  description: '面向业务服务的资源建模、角色管理、主体授权与实时鉴权接口。',
  version: 'v1',
  baseUrl,
  endpoints: [
    addUserToGroupDocument,
    removeUserFromGroupDocument,
    createResourceDocument,
    createRoleDocument,
    addPermissionsDocument,
    removePermissionsDocument,
    addRolePrincipalsDocument,
    removeRolePrincipalsDocument,
    authorizeDocument,
    downloadSpecDocument,
  ],
}
