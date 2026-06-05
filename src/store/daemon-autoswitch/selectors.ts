import type { DaemonAutoswitchStoreState } from './types';

export function selectDaemonAutoswitchModuleId(state: DaemonAutoswitchStoreState) {
  return state.moduleId;
}
