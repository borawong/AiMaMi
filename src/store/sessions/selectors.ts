import type { SessionsStoreState } from './types';

export function selectSessionsModuleId(state: SessionsStoreState) {
  return state.moduleId;
}
