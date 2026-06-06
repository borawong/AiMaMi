/**
 * ????????????????? dumped ??????????wrapper??????????
 */

export const DUMPED_PLUGINS_COMMANDS = [
  {
    "command": "get_plugin_config",
    "domain": "runtime-extensions",
    "wrappers": [
      "getPluginConfig"
    ],
    "argKeys": [
      "id"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  },
  {
    "command": "list_plugins",
    "domain": "runtime-extensions",
    "wrappers": [
      "listPlugins"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/plugins-page-BOi_QT1c.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "toggle_plugin",
    "domain": "runtime-extensions",
    "wrappers": [
      "togglePlugin"
    ],
    "argKeys": [
      "enabled",
      "id"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/plugins-page-BOi_QT1c.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "update_plugin_config",
    "domain": "runtime-extensions",
    "wrappers": [
      "updatePluginConfig"
    ],
    "argKeys": [
      "id",
      "settings"
    ],
    "files": [
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 0
  }
] as const;

export type DumpedPluginsCommand = (typeof DUMPED_PLUGINS_COMMANDS)[number];
