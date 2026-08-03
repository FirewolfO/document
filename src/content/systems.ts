import type { SystemDocument } from '@/types/document'
import { permissionSystem } from './permission'

export const systems: SystemDocument[] = [permissionSystem]

export function findSystem(systemId: string): SystemDocument | undefined {
  return systems.find((system) => system.id === systemId)
}
