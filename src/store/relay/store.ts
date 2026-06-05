import { relayInitialState } from './initial-state';
import { selectRelayModuleId } from './selectors';

export const relayStore = {
  initialState: relayInitialState,
  selectors: {
    selectModuleId: selectRelayModuleId,
  },
};
