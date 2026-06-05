import { accountsInitialState } from './initial-state';
import { selectAccountsModuleId } from './selectors';

export const accountsStore = {
  initialState: accountsInitialState,
  selectors: {
    selectModuleId: selectAccountsModuleId,
  },
};
