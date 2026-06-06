/**
 * 中文职责说明：记录 mcp 模块由 dumped 证据确认的命令、来源文件和包装调用链。
 */

export const DUMPED_MCP_COMMANDS = [
  {
    "command": "load_mcp_servers",
    "domain": "mcp",
    "wrappers": [
      "loadMcpServers"
    ],
    "argKeys": [],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/mcp-page-CWT3lnG-.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 2
  },
  {
    "command": "remove_mcp_server",
    "domain": "mcp",
    "wrappers": [
      "removeMcpServer"
    ],
    "argKeys": [
      "name"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/mcp-page-CWT3lnG-.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "set_mcp_server_enabled",
    "domain": "mcp",
    "wrappers": [
      "setMcpServerEnabled"
    ],
    "argKeys": [
      "enabled",
      "name"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/mcp-page-CWT3lnG-.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  },
  {
    "command": "upsert_mcp_server",
    "domain": "mcp",
    "wrappers": [
      "upsertMcpServer"
    ],
    "argKeys": [
      "args",
      "environment",
      "headers"
    ],
    "files": [
      "assets/index-CL22l5v8.js",
      "assets/mcp-page-CWT3lnG-.js"
    ],
    "i18nKeys": [],
    "controlFlowCount": 1
  }
] as const;

export type DumpedMcpCommand = (typeof DUMPED_MCP_COMMANDS)[number];
