import type { RelayStoreState } from './types';

export function selectRelayModuleId(state: RelayStoreState) {
  return state.moduleId;
}
