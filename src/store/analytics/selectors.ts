import type { AnalyticsStoreState } from './types';

export function selectAnalyticsModuleId(state: AnalyticsStoreState) {
  return state.moduleId;
}
