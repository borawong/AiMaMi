import { useSyncExternalStore } from 'react';
import { accountsInitialState } from './initial-state';
import * as accountsSelectors from './selectors';
import type {
  AccountsBusyKey,
  AccountsDraftState,
  AccountsFocusTarget,
  AccountsPanelKey,
  AccountsDialogKey,
  AccountsSortState,
  AccountsStoreActions,
  AccountsStoreListener,
  AccountsStoreSelector,
  AccountsStoreState,
  AccountsTabKey,
  AccountsUiStore,
} from './types';

function uniqueAccountKeys(accountKeys: readonly string[]) {
  return Array.from(
    new Set(accountKeys.map((accountKey) => accountKey.trim()).filter(Boolean)),
  );
}

function createStoreState(
  initialState: AccountsStoreState,
  updater: AccountsStoreState | AccountsStoreSelector<AccountsStoreState>,
) {
  if (typeof updater === 'function') {
    return updater(initialState);
  }

  return updater;
}

export function createAccountsStore(
  initialState: AccountsStoreState = accountsInitialState,
): AccountsUiStore {
  let state = initialState;
  const listeners = new Set<AccountsStoreListener>();

  const getState = () => state;

  const setState = (
    updater: AccountsStoreState | AccountsStoreSelector<AccountsStoreState>,
  ) => {
    const nextState = createStoreState(state, updater);

    if (Object.is(nextState, state)) {
      return;
    }

    state = nextState;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: AccountsStoreListener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const actions: AccountsStoreActions = {
    setCurrentTab: (tab: AccountsTabKey) => {
      setState((current) => ({ ...current, currentTab: tab }));
    },
    setActivePanel: (panel: AccountsPanelKey) => {
      setState((current) => ({ ...current, activePanel: panel }));
    },
    setOpenDialog: (dialog: AccountsDialogKey) => {
      setState((current) => ({ ...current, openDialog: dialog }));
    },
    setSort: (sort: AccountsSortState) => {
      setState((current) => ({ ...current, sort }));
    },
    setDraftValue: (key, value) => {
      setState((current) => ({
        ...current,
        drafts: {
          ...current.drafts,
          [key]: value,
        },
      }));
    },
    patchDrafts: (drafts: Partial<AccountsDraftState>) => {
      setState((current) => ({
        ...current,
        drafts: {
          ...current.drafts,
          ...drafts,
        },
      }));
    },
    setHoveredAccountKey: (accountKey: string | null) => {
      setState((current) => ({
        ...current,
        hover: {
          ...current.hover,
          accountKey,
        },
      }));
    },
    setHoveredActionKey: (actionKey: string | null) => {
      setState((current) => ({
        ...current,
        hover: {
          ...current.hover,
          actionKey,
        },
      }));
    },
    setFocusTarget: (target: AccountsFocusTarget) => {
      setState((current) => ({ ...current, focusTarget: target }));
    },
    setSelectedAccountKeys: (accountKeys: readonly string[]) => {
      setState((current) => ({
        ...current,
        selectedAccountKeys: uniqueAccountKeys(accountKeys),
      }));
    },
    toggleSelectedAccountKey: (accountKey: string) => {
      const normalizedAccountKey = accountKey.trim();

      if (!normalizedAccountKey) {
        return;
      }

      setState((current) => {
        const selectedKeys = current.selectedAccountKeys.includes(
          normalizedAccountKey,
        )
          ? current.selectedAccountKeys.filter(
              (selectedAccountKey) =>
                selectedAccountKey !== normalizedAccountKey,
            )
          : [...current.selectedAccountKeys, normalizedAccountKey];

        return {
          ...current,
          selectedAccountKeys: selectedKeys,
        };
      });
    },
    clearSelectedAccountKeys: () => {
      setState((current) => ({ ...current, selectedAccountKeys: [] }));
    },
    setBusyKey: (busyKey: AccountsBusyKey, busy: boolean) => {
      setState((current) => {
        const hasBusyKey = current.busyKeys.includes(busyKey);

        if (busy && hasBusyKey) {
          return current;
        }

        if (!busy && !hasBusyKey) {
          return current;
        }

        return {
          ...current,
          busyKeys: busy
            ? [...current.busyKeys, busyKey]
            : current.busyKeys.filter((currentBusyKey) => currentBusyKey !== busyKey),
        };
      });
    },
    reset: () => {
      setState(initialState);
    },
  };

  return {
    initialState,
    actions,
    getState,
    setState,
    subscribe,
    useStore: (selector) =>
      useSyncExternalStore(
        subscribe,
        () => selector(getState()),
        () => selector(initialState),
      ),
  };
}

export const accountsStore = createAccountsStore();

export const accountsStoreSelectors = accountsSelectors;

export function useAccountsStore<TResult>(
  selector: AccountsStoreSelector<TResult>,
) {
  return accountsStore.useStore(selector);
}

export function useAccountsStoreActions() {
  return accountsStore.actions;
}
