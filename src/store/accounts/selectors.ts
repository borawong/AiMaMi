import type { AccountsStoreState } from './types';

export function selectAccountsModuleId(state: AccountsStoreState) {
  return state.moduleId;
}
