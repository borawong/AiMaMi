import { daemonAutoswitchInitialState } from './initial-state';
import { selectDaemonAutoswitchModuleId } from './selectors';

export const daemonAutoswitchStore = {
  initialState: daemonAutoswitchInitialState,
  selectors: {
    selectModuleId: selectDaemonAutoswitchModuleId,
  },
};
