import { customInstructionsInitialState } from './initial-state';
import { selectCustomInstructionsModuleId } from './selectors';

export const customInstructionsStore = {
  initialState: customInstructionsInitialState,
  selectors: {
    selectModuleId: selectCustomInstructionsModuleId,
  },
};
