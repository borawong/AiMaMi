import type { CustomInstructionsStoreState } from './types';

export function selectCustomInstructionsModuleId(state: CustomInstructionsStoreState) {
  return state.moduleId;
}
