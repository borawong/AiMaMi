export const DUMPED_ACCOUNTS_COMMANDS = [
  {
    "command": "begin_add_account_attach_monitor",
    "domain": "accounts",
    "wrappers": [
      "beginAddAccountAttachMonitor"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "export_accounts_to_file",
    "domain": "accounts",
    "wrappers": [
      "exportAccountsToFile"
    ],
    "argKeys": [
      "accountKeys",
      "targetPath"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "accounts.io.saveDialogTitle"
    ],
    "controlFlowCount": 1
  },
  {
    "command": "import_accounts_from_file",
    "domain": "accounts",
    "wrappers": [
      "importAccountsFromFile"
    ],
    "argKeys": [
      "filePath",
      "overwriteExisting",
      "selectedKeys"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "logout",
    "domain": "accounts",
    "wrappers": [
      "logout"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "preview_account_import",
    "domain": "accounts",
    "wrappers": [
      "previewAccountImport"
    ],
    "argKeys": [
      "filePath"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "accounts.io.openDialogTitle"
    ],
    "controlFlowCount": 1
  },
  {
    "command": "remove_accounts",
    "domain": "accounts",
    "wrappers": [
      "removeAccounts"
    ],
    "argKeys": [
      "accountKeys"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "switch_account",
    "domain": "accounts",
    "wrappers": [
      "switchAccount"
    ],
    "argKeys": [
      "accountKey"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "switch_account_and_restart_codex",
    "domain": "accounts",
    "wrappers": [
      "switchAccountAndRestartCodex"
    ],
    "argKeys": [
      "accountKey"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedAccountsCommand = (typeof DUMPED_ACCOUNTS_COMMANDS)[number];
