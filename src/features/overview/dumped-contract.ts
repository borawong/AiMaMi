/**
 * 中文职责说明：记录 overview 模块由 dumped 证据确认的命令、来源文件和包装调用链。
 */

export const DUMPED_OVERVIEW_COMMANDS = [
  {
    "command": "focus_main_window",
    "domain": "system",
    "wrappers": [
      "focusMainWindow"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_device_id",
    "domain": "system",
    "wrappers": [
      "getDeviceId"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "common.error",
      "feedback.errorDesc",
      "feedback.errorTitle",
      "feedback.networkErrorDesc",
      "feedback.networkErrorTitle",
      "feedback.noDevice",
      "feedback.successDesc",
      "feedback.successTitle",
      "mysteryCode.errorNetwork",
      "mysteryCode.success",
      "mysteryCode.successDesc",
      "mysteryCode.successIdempotent",
      "mysteryCode.toastErrorHint"
    ],
    "controlFlowCount": 3
  },
  {
    "command": "get_mystery_unlock_grants",
    "domain": "system",
    "wrappers": [
      "getMysteryUnlockGrants"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_notification_client_state",
    "domain": "system",
    "wrappers": [
      "getNotificationClientState"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_or_create_remote_device_secret",
    "domain": "system",
    "wrappers": [],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "import_remote_device_secret_if_empty",
    "domain": "system",
    "wrappers": [],
    "argKeys": [
      "secret"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_snapshot",
    "domain": "system",
    "wrappers": [
      "loadSnapshot"
    ],
    "argKeys": [
      "localOnly"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  },
  {
    "command": "merge_mystery_unlock_grants",
    "domain": "system",
    "wrappers": [
      "mergeMysteryUnlockGrants"
    ],
    "argKeys": [
      "grants"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "mysteryCode.errorNetwork",
      "mysteryCode.success",
      "mysteryCode.successDesc",
      "mysteryCode.successIdempotent",
      "mysteryCode.toastErrorHint"
    ],
    "controlFlowCount": 2
  },
  {
    "command": "refresh_usage_snapshot",
    "domain": "system",
    "wrappers": [
      "refreshUsageSnapshot"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedOverviewCommand = (typeof DUMPED_OVERVIEW_COMMANDS)[number];
