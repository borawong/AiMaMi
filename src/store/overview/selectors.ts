import type { OverviewStoreState } from './types';

export function selectOverviewModuleId(state: OverviewStoreState) {
  return state.moduleId;
}
