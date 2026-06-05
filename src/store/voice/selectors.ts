import type { VoiceStoreState } from './types';

export function selectVoiceModuleId(state: VoiceStoreState) {
  return state.moduleId;
}
