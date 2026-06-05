import type { SkillsStoreState } from './types';

export function selectSkillsModuleId(state: SkillsStoreState) {
  return state.moduleId;
}
