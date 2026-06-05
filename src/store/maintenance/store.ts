import { maintenanceInitialState } from './initial-state';
import { selectMaintenanceModuleId } from './selectors';

export const maintenanceStore = {
  initialState: maintenanceInitialState,
  selectors: {
    selectModuleId: selectMaintenanceModuleId,
  },
};
