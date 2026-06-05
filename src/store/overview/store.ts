import { overviewInitialState } from './initial-state';
import { selectOverviewModuleId } from './selectors';

export const overviewStore = {
  initialState: overviewInitialState,
  selectors: {
    selectModuleId: selectOverviewModuleId,
  },
};
