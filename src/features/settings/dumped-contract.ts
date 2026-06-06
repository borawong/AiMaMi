/**
 * ????????????????? dumped ??????????wrapper??????????
 */

export const DUMPED_SETTINGS_COMMANDS = [
  {
    "command": "check_update_installability",
    "domain": "settings",
    "wrappers": [
      "checkUpdateInstallability"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  },
  {
    "command": "detect_api_proxy_config",
    "domain": "settings",
    "wrappers": [
      "detectApiProxyConfig"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_hotspot_enabled",
    "domain": "settings",
    "wrappers": [
      "getHotspotEnabled"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "get_image_compat",
    "domain": "settings",
    "wrappers": [
      "getImageCompat"
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
    "command": "get_usage_refresh_interval",
    "domain": "settings",
    "wrappers": [
      "getUsageRefreshInterval"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "settings.refreshIntervalSaveFailedDesc",
      "settings.refreshIntervalSaveFailedTitle"
    ],
    "controlFlowCount": 2
  },
  {
    "command": "graceful_restart_for_update",
    "domain": "settings",
    "wrappers": [],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "has_notch",
    "domain": "settings",
    "wrappers": [
      "hasNotch"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "hotspot_ready",
    "domain": "settings",
    "wrappers": [
      "hotspotReady"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "set_api_proxy_config",
    "domain": "settings",
    "wrappers": [
      "setApiProxyConfig"
    ],
    "argKeys": [
      "mode",
      "url"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "set_hotspot_enabled",
    "domain": "settings",
    "wrappers": [
      "setHotspotEnabled"
    ],
    "argKeys": [
      "enabled"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/settings-page-CHeElwco.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "set_image_compat",
    "domain": "settings",
    "wrappers": [
      "setImageCompat"
    ],
    "argKeys": [
      "enabled"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/maintenance-page-j6kXR210.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "set_usage_refresh_interval",
    "domain": "settings",
    "wrappers": [
      "setUsageRefreshInterval"
    ],
    "argKeys": [
      "interval"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [
      "settings.refreshIntervalSaveFailedDesc",
      "settings.refreshIntervalSaveFailedTitle"
    ],
    "controlFlowCount": 1
  },
  {
    "command": "test_api_proxy_config",
    "domain": "settings",
    "wrappers": [
      "testApiProxyConfig"
    ],
    "argKeys": [
      "mode",
      "url"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedSettingsCommand = (typeof DUMPED_SETTINGS_COMMANDS)[number];
