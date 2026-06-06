export const DUMPED_DAEMON_AUTOSWITCH_COMMANDS = [
  {
    "command": "configure_auto_switch",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "configureAutoSwitch"
    ],
    "argKeys": [
      "threshold5hPercent",
      "thresholdWeeklyPercent"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "confirm_pending_auto_switch",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "confirmPendingAutoSwitch"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "confirm_pending_auto_switch_and_restart_codex",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "confirmPendingAutoSwitchAndRestartCodex"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "dismiss_pending_auto_switch",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "dismissPendingAutoSwitch"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_bootstrap_state",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "loadBootstrapState"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_pending_auto_switch",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "loadPendingAutoSwitch"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "run_daemon_once",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "runDaemonOnce"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "set_auto_switch",
    "domain": "daemon-autoswitch",
    "wrappers": [
      "setAutoSwitch"
    ],
    "argKeys": [
      "enabled"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  }
] as const;

export type DumpedDaemonAutoswitchCommand = (typeof DUMPED_DAEMON_AUTOSWITCH_COMMANDS)[number];
