import type { TrayShellStoreState } from './types';

export function selectTrayShellModuleId(state: TrayShellStoreState) {
  return state.moduleId;
}
