import { voiceInitialState } from './initial-state';
import { selectVoiceModuleId } from './selectors';

export const voiceStore = {
  initialState: voiceInitialState,
  selectors: {
    selectModuleId: selectVoiceModuleId,
  },
};
