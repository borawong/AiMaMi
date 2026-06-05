import type { MaintenanceStoreState } from './types';

export function selectMaintenanceModuleId(state: MaintenanceStoreState) {
  return state.moduleId;
}
