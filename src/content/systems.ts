import type { ApiAudience, SystemDocument } from '@/types/document'
import { peopleInnerSystem, peopleOpenSystem } from './people'
import { permissionSystem } from './permission'

export const systems: SystemDocument[] = [permissionSystem, peopleOpenSystem, peopleInnerSystem]

export function systemsForAudience(audience: ApiAudience): SystemDocument[] {
  return systems.filter((system) => system.audience === audience)
}

export function findSystem(audience: ApiAudience, systemId: string): SystemDocument | undefined {
  return systems.find((system) => system.audience === audience && system.id === systemId)
}
