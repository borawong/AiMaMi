import { sessionsInitialState } from './initial-state';
import { selectSessionsModuleId } from './selectors';

export const sessionsStore = {
  initialState: sessionsInitialState,
  selectors: {
    selectModuleId: selectSessionsModuleId,
  },
};
