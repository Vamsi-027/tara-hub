import type { IEventBusModuleService } from '@medusajs/framework/types'
import type { ICacheService } from '@medusajs/framework/types'

declare module '@medusajs/framework/types' {
  interface ModuleImplementations {
    'event_bus': IEventBusModuleService,
    'cache': ICacheService
  }
}