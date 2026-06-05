import { trayShellInitialState } from './initial-state';
import { selectTrayShellModuleId } from './selectors';

export const trayShellStore = {
  initialState: trayShellInitialState,
  selectors: {
    selectModuleId: selectTrayShellModuleId,
  },
};
