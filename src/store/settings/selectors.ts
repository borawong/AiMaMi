import type { SettingsStoreState } from './types';

export function selectSettingsModuleId(state: SettingsStoreState) {
  return state.moduleId;
}
