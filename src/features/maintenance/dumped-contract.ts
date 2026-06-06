/**
 * ????????????????? dumped ??????????wrapper??????????
 */

export const DUMPED_MAINTENANCE_COMMANDS = [
  {
    "command": "clean",
    "domain": "maintenance",
    "wrappers": [
      "clean"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "diagnose",
    "domain": "maintenance",
    "wrappers": [
      "diagnose"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "force_kill_codex",
    "domain": "maintenance",
    "wrappers": [
      "forceKillCodex"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/maintenance-page-j6kXR210.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_system_info",
    "domain": "maintenance",
    "wrappers": [
      "getSystemInfo"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "open_path",
    "domain": "maintenance",
    "wrappers": [
      "openPath"
    ],
    "argKeys": [
      "path"
    ],
    "files": [
      "assets/accounts-page-CJFT2P5o.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 4
  },
  {
    "command": "rebuild_registry",
    "domain": "maintenance",
    "wrappers": [
      "rebuildRegistry"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "reset_codex_config",
    "domain": "maintenance",
    "wrappers": [
      "resetCodexConfig"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/maintenance-page-j6kXR210.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "restart_codex",
    "domain": "maintenance",
    "wrappers": [
      "restartCodex",
      "restartCodexApp"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/maintenance-page-j6kXR210.js",
      "assets/relay-page-CljGSoid.js",
      "assets/use-relay-providers-BNphfsn5.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  }
] as const;

export type DumpedMaintenanceCommand = (typeof DUMPED_MAINTENANCE_COMMANDS)[number];
