import type { AccountsBusyKey, AccountsStoreState } from './types';

export function selectAccountsCurrentTab(state: AccountsStoreState) {
  return state.currentTab;
}

export function selectAccountsActivePanel(state: AccountsStoreState) {
  return state.activePanel;
}

export function selectAccountsOpenDialog(state: AccountsStoreState) {
  return state.openDialog;
}

export function selectAccountsSelectedKeys(state: AccountsStoreState) {
  return state.selectedAccountKeys;
}

export function selectAccountsSort(state: AccountsStoreState) {
  return state.sort;
}

export function selectAccountsDrafts(state: AccountsStoreState) {
  return state.drafts;
}

export function selectAccountsHover(state: AccountsStoreState) {
  return state.hover;
}

export function selectAccountsFocusTarget(state: AccountsStoreState) {
  return state.focusTarget;
}

export function selectAccountsBusyKeys(state: AccountsStoreState) {
  return state.busyKeys;
}

export function selectIsAccountsBusy(
  state: AccountsStoreState,
  busyKey: AccountsBusyKey,
) {
  return state.busyKeys.includes(busyKey);
}
