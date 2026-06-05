export type AccountsTabKey = 'overview' | 'actions' | 'import-export';

export type AccountsPanelKey = 'actions' | 'import' | 'export' | null;

export type AccountsDialogKey =
  | 'remove-confirm'
  | 'logout-confirm'
  | 'import-preview'
  | null;

export type AccountsSortKey = 'label' | 'last-used';

export type AccountsSortDirection = 'asc' | 'desc';

export interface AccountsSortState {
  readonly key: AccountsSortKey;
  readonly direction: AccountsSortDirection;
}

export interface AccountsDraftState {
  readonly switchAccountKey: string;
  readonly bulkAccountKeysText: string;
  readonly importFilePath: string;
  readonly exportTargetPath: string;
  readonly sessionJson: string;
  readonly overwriteExisting: boolean;
}

export type AccountsDraftKey = keyof AccountsDraftState;

export type AccountsFocusTarget =
  | 'switch-account'
  | 'bulk-account-keys'
  | 'import-file'
  | 'export-target'
  | 'session-json'
  | null;

export interface AccountsHoverState {
  readonly accountKey: string | null;
  readonly actionKey: string | null;
}

export type AccountsBusyKey =
  | 'switch-account'
  | 'switch-account-and-restart'
  | 'remove-accounts'
  | 'logout'
  | 'preview-import'
  | 'import-file'
  | 'import-session'
  | 'export-file'
  | 'attach-monitor';

export interface AccountsStoreState {
  readonly currentTab: AccountsTabKey;
  readonly activePanel: AccountsPanelKey;
  readonly openDialog: AccountsDialogKey;
  readonly selectedAccountKeys: readonly string[];
  readonly sort: AccountsSortState;
  readonly drafts: AccountsDraftState;
  readonly hover: AccountsHoverState;
  readonly focusTarget: AccountsFocusTarget;
  readonly busyKeys: readonly AccountsBusyKey[];
}

export type AccountsStoreSelector<TResult> = (
  state: AccountsStoreState,
) => TResult;

export type AccountsStoreListener = () => void;

export interface AccountsStoreActions {
  setCurrentTab(tab: AccountsTabKey): void;
  setActivePanel(panel: AccountsPanelKey): void;
  setOpenDialog(dialog: AccountsDialogKey): void;
  setSort(sort: AccountsSortState): void;
  setDraftValue<TKey extends AccountsDraftKey>(
    key: TKey,
    value: AccountsDraftState[TKey],
  ): void;
  patchDrafts(drafts: Partial<AccountsDraftState>): void;
  setHoveredAccountKey(accountKey: string | null): void;
  setHoveredActionKey(actionKey: string | null): void;
  setFocusTarget(target: AccountsFocusTarget): void;
  setSelectedAccountKeys(accountKeys: readonly string[]): void;
  toggleSelectedAccountKey(accountKey: string): void;
  clearSelectedAccountKeys(): void;
  setBusyKey(busyKey: AccountsBusyKey, busy: boolean): void;
  reset(): void;
}

export interface AccountsUiStore {
  readonly initialState: AccountsStoreState;
  readonly actions: AccountsStoreActions;
  getState(): AccountsStoreState;
  setState(updater: AccountsStoreState | AccountsStoreSelector<AccountsStoreState>): void;
  subscribe(listener: AccountsStoreListener): () => void;
  useStore<TResult>(selector: AccountsStoreSelector<TResult>): TResult;
}
