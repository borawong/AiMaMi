import { settingsInitialState } from './initial-state';
import { selectSettingsModuleId } from './selectors';

export const settingsStore = {
  initialState: settingsInitialState,
  selectors: {
    selectModuleId: selectSettingsModuleId,
  },
};
