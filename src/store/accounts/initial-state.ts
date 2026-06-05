import type { AccountsStoreState } from './types';

export const accountsInitialState: AccountsStoreState = {
  currentTab: 'overview',
  activePanel: null,
  openDialog: null,
  selectedAccountKeys: [],
  sort: {
    key: 'label',
    direction: 'asc',
  },
  drafts: {
    switchAccountKey: '',
    bulkAccountKeysText: '',
    importFilePath: '',
    exportTargetPath: '',
    sessionJson: '',
    overwriteExisting: false,
  },
  hover: {
    accountKey: null,
    actionKey: null,
  },
  focusTarget: null,
  busyKeys: [],
};
