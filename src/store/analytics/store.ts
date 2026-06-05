import { analyticsInitialState } from './initial-state';
import { selectAnalyticsModuleId } from './selectors';

export const analyticsStore = {
  initialState: analyticsInitialState,
  selectors: {
    selectModuleId: selectAnalyticsModuleId,
  },
};
