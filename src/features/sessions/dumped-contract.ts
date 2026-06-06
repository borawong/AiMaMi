/**
 * ????????????????? dumped ??????????wrapper??????????
 */

export const DUMPED_SESSIONS_COMMANDS = [
  {
    "command": "delete_sessions",
    "domain": "sessions",
    "wrappers": [
      "deleteSessions"
    ],
    "argKeys": [
      "ids"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/sessions-page-_V8EZ45X.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "import_chatgpt_session_account",
    "domain": "sessions",
    "wrappers": [
      "importChatGptSessionAccount"
    ],
    "argKeys": [
      "overwriteExisting",
      "sessionJson"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "accounts.addAccountSessionFailedDesc",
      "accounts.addAccountSessionFailedTitle",
      "accounts.addAccountSessionSuccessDesc",
      "accounts.addAccountSessionSuccessDescPlaceholder",
      "accounts.addAccountSessionSuccessTitle"
    ],
    "controlFlowCount": 1
  },
  {
    "command": "load_session_analytics",
    "domain": "sessions",
    "wrappers": [
      "loadSessionAnalytics"
    ],
    "argKeys": [
      "range"
    ],
    "files": [
      "assets/analytics-panel-D01GGJ7u.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_sessions",
    "domain": "sessions",
    "wrappers": [
      "loadSessions"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/sessions-page-_V8EZ45X.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedSessionsCommand = (typeof DUMPED_SESSIONS_COMMANDS)[number];
