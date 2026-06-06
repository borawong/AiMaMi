/**
 * ????????????????? dumped ??????????wrapper??????????
 */

export const DUMPED_ANALYTICS_COMMANDS = [
  {
    "command": "load_change_analytics",
    "domain": "analytics",
    "wrappers": [
      "loadChangeAnalytics"
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
    "command": "load_quota_history",
    "domain": "analytics",
    "wrappers": [
      "loadQuotaHistory"
    ],
    "argKeys": [
      "accountKey"
    ],
    "files": [
      "assets/analytics-panel-D01GGJ7u.js",
      "assets/index-CL22l5v8.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "load_token_analytics",
    "domain": "analytics",
    "wrappers": [
      "loadTokenAnalytics"
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
    "command": "load_tool_analytics",
    "domain": "analytics",
    "wrappers": [
      "loadToolAnalytics"
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
    "command": "load_usage_analytics",
    "domain": "analytics",
    "wrappers": [
      "loadUsageAnalytics"
    ],
    "argKeys": [],
    "files": [
      "assets/analytics-panel-D01GGJ7u.js",
      "assets/index-CL22l5v8.js",
      "assets/sessions-page-_V8EZ45X.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 3
  }
] as const;

export type DumpedAnalyticsCommand = (typeof DUMPED_ANALYTICS_COMMANDS)[number];
