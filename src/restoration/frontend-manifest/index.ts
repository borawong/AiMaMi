import { IPC_COMMAND_DEFINITIONS } from "@/contracts/ipc";

export const FRONTEND_DUMPED_CONTRACT_SLICE_A = {
  name: "frontend-dumped-ipc-contract-slice-a",
  status: "已生成前端 IPC 合同源",
  expectedCommandCount: 127,
  coveredCommandCount: IPC_COMMAND_DEFINITIONS.length,
  evidenceSources: [
    {
      kind: "raw 前端合同报告",
      commandCount: 127,
      role: "命令名、wrapper 和 argKeys 的优先事实来源",
    },
    {
      kind: "internal 前端映射合同报告",
      commandCount: 127,
      role: "交叉核对命令覆盖和脱敏字段",
    },
  ],
  contractFiles: [
    "src/contracts/ipc/commands.ts",
    "src/contracts/ipc/dto.ts",
    "src/contracts/ipc/index.ts",
    "src/contracts/ipc/invoke.ts",
  ],
  transportPolicy: {
    rawCommandField: "command",
    aliasField: "wrapperNames",
    rule: "IPC transport 事实保留 raw 命令名；上层可使用中性 alias，但不得删除 raw 命令名。",
  },
  evidenceDiffs: [
    {
      command: "import_remote_device_secret_if_empty",
      rawArgKeys: ["secret"],
      internalArgKeys: ["sensitive-field"],
      decision: "合同采用 raw arg key；internal 报告该字段为脱敏占位。",
    },
  ],
} as const;

export type FrontendDumpedContractSliceA =
  typeof FRONTEND_DUMPED_CONTRACT_SLICE_A;

export type SliceDDumpedModule =
  | "accounts"
  | "sessions"
  | "analytics"
  | "voice"
  | "tray-shell"
  | "overview";

export type SliceDDumpedCoverageStatus = "covered" | "boundary-only";

export interface SliceDDumpedCommandCoverage {
  module: SliceDDumpedModule;
  command: string;
  status: SliceDDumpedCoverageStatus;
  service: string;
  feature: string;
  surface: string;
  note: string;
}

export type FrontendDumpedIndexAssetOwner =
  | "app-shell"
  | "overview"
  | "custom-instructions"
  | "daemon-autoswitch"
  | "tray-shell"
  | "voice";

export type FrontendDumpedIndexAssetStatus =
  | "covered"
  | "boundary-only"
  | "source-only";

export interface FrontendDumpedIndexAssetSource {
  owner: FrontendDumpedIndexAssetOwner;
  source: string;
  status: FrontendDumpedIndexAssetStatus;
  commands: readonly string[];
  feature: string;
  cache: string;
  surface: string;
  note: string;
}

export interface FrontendDumpedModuleRestorationRequirement {
  module: "plugins";
  command: string;
  source: string;
  status: "covered";
  service: string;
  hook: string;
  cache: string;
  panel: string;
  note: string;
}

export interface FrontendDumpedAppShellRemoteSecretRestorationRequirement {
  module: "app-shell";
  command:
    | "import_remote_device_secret_if_empty"
    | "get_or_create_remote_device_secret";
  source: string;
  status: "covered";
  service: string;
  runtimeOwner: string;
  initializer: string;
  note: string;
}

export interface FrontendDumpedAppShellDesktopMessageQueryRestorationRequirement {
  module: "app-shell";
  source: string;
  queryKey: "desktop-message";
  status: "source-only";
  runtimeOwner: string;
  surface: string;
  reason: string;
}

export interface FrontendDumpedBoundaryException {
  module: "voice";
  status: "boundary-only";
  source: string;
  commandSource: string;
  reason: string;
}

export const FRONTEND_DUMPED_BOUNDARY_EXCEPTIONS = [
  {
    module: "voice",
    status: "boundary-only",
    source: "用户要求",
    commandSource: "internal voice gap 34 commands",
    reason:
      "用户要求 voice 仅保留空骨架边界，不按 dumped mock 业务做真实还原，也不得标为 covered 或 restored。",
  },
] as const satisfies readonly FrontendDumpedBoundaryException[];

export const FRONTEND_DUMPED_INDEX_ASSET_SOURCES = [
  {
    owner: "app-shell",
    source: "assets/index-CL22l5v8.js",
    status: "source-only",
    commands: [
      "check_update_installability",
      "graceful_restart_for_update",
      "open_path",
      "get_mystery_unlock_grants",
      "merge_mystery_unlock_grants",
      "import_remote_device_secret_if_empty",
      "get_or_create_remote_device_secret",
    ],
    feature: "src/entry/root.tsx",
    cache: "src/app/runtime/events.ts",
    surface: "src/app/providers/prompt.tsx",
    note:
      "登记 app shell 在 index chunk 中的启动、更新、提示和全局授权入口；它不是模块还原完成证明，需由入口和 runtime owner 承接。",
  },
  {
    owner: "overview",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    commands: [
      "load_snapshot",
      "refresh_usage_snapshot",
      "load_usage_analytics",
    ],
    feature: "src/features/overview/hooks/index.ts",
    cache: "src/features/overview/cache/index.ts",
    surface: "src/features/overview/panels/index.ts",
    note:
      "overview 不是独立 page chunk，而是 index chunk 内的仪表盘来源，必须由 overview hooks/cache/panels 承接。",
  },
  {
    owner: "custom-instructions",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    commands: [
      "load_custom_instruction_state",
      "preview_custom_instruction_apply",
      "apply_custom_instruction",
      "clear_custom_instruction_block",
      "rollback_custom_instruction",
    ],
    feature: "src/features/custom-instructions/hooks/index.ts",
    cache: "src/features/custom-instructions/cache/index.ts",
    surface: "src/features/custom-instructions/panels/index.ts",
    note:
      "custom-instructions 来源在 index chunk，门禁必须检查模块 hooks/cache/panels，而不是只看 IPC 字符串。",
  },
  {
    owner: "daemon-autoswitch",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    commands: [
      "load_bootstrap_state",
      "load_pending_auto_switch",
      "dismiss_pending_auto_switch",
      "confirm_pending_auto_switch",
      "confirm_pending_auto_switch_and_restart_codex",
      "run_daemon_once",
      "set_auto_switch",
      "configure_auto_switch",
    ],
    feature: "src/features/daemon-autoswitch/hooks/index.ts",
    cache: "src/features/daemon-autoswitch/cache/index.ts",
    surface: "src/features/daemon-autoswitch/panels/index.ts",
    note:
      "daemon-autoswitch 的 bootstrap、pending 和 runner 来源在 index chunk，需显式连接模块 state/cache/UI owner。",
  },
  {
    owner: "tray-shell",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    commands: [
      "get_notification_client_state",
      "focus_main_window",
    ],
    feature: "src/features/tray-shell/hooks/index.ts",
    cache: "src/features/tray-shell/cache/index.ts",
    surface: "src/features/tray-shell/panels/index.ts",
    note:
      "tray shell 来源在 index chunk，必须落到托盘外壳 hooks/cache/panels owner。",
  },
  {
    owner: "voice",
    source: "assets/index-CL22l5v8.js",
    status: "boundary-only",
    commands: [
      "load_voice_workspace",
      "load_voice_runtime_status",
      "start_voice_capture",
      "stop_voice_capture",
      "inject_voice_text",
    ],
    feature: "src/features/voice/contract.ts",
    cache: "src/features/voice/cache/index.ts",
    surface: "src/features/voice/Content.tsx",
    note:
      "用户要求的空骨架例外：voice 来源只登记 boundary-only，不要求真实 hooks/panels/cache 业务还原，也不得误报为 covered 或 restored。",
  },
] as const satisfies readonly FrontendDumpedIndexAssetSource[];

export const FRONTEND_DUMPED_APP_SHELL_REMOTE_SECRET_RESTORATION_MATRIX = [
  {
    module: "app-shell",
    command: "import_remote_device_secret_if_empty",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    service: "src/services/system/index.ts",
    runtimeOwner: "src/app/runtime/secret.ts",
    initializer: "src/app/runtime/initializer.tsx",
    note:
      "app-shell 启动迁移链路必须先读取 localStorage 旧 remote device secret，调用 system service 导入后移除旧值，并由 runtime owner 写入启动缓存。",
  },
  {
    module: "app-shell",
    command: "get_or_create_remote_device_secret",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    service: "src/services/system/index.ts",
    runtimeOwner: "src/app/runtime/secret.ts",
    initializer: "src/app/runtime/initializer.tsx",
    note:
      "app-shell 启动迁移链路必须在导入旧值后获取或创建 remote device secret，并由 initializer 挂载 runtime owner 完成缓存写入。",
  },
] as const satisfies readonly FrontendDumpedAppShellRemoteSecretRestorationRequirement[];

export const FRONTEND_DUMPED_APP_SHELL_DESKTOP_MESSAGE_QUERY_MATRIX = [
  {
    module: "app-shell",
    source: "assets/index-CL22l5v8.js",
    queryKey: "desktop-message",
    status: "source-only",
    runtimeOwner: "src/app/runtime/message.ts",
    surface: "src/app/runtime/popover.tsx",
    reason:
      "dumped evidence 只证明 desktop-message queryKey 和 staleTime，没有可审计 endpoint；runtime 只能登记 source-only 边界并说明空 payload 来源。",
  },
] as const satisfies readonly FrontendDumpedAppShellDesktopMessageQueryRestorationRequirement[];

export const FRONTEND_DUMPED_MODULE_RESTORATION_MATRIX = [
  {
    module: "plugins",
    command: "get_plugin_config",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    service: "src/services/plugins/index.ts",
    hook: "src/features/plugins/hooks/query.ts",
    cache: "src/features/plugins/cache/index.ts",
    panel: "src/features/plugins/panels/page.tsx",
    note:
      "get_plugin_config 必须落到 plugins query hook、config cache 和具体 panel；只在 service/type/contract 出现不算还原。",
  },
  {
    module: "plugins",
    command: "update_plugin_config",
    source: "assets/index-CL22l5v8.js",
    status: "covered",
    service: "src/services/plugins/index.ts",
    hook: "src/features/plugins/hooks/mutation.ts",
    cache: "src/features/plugins/cache/index.ts",
    panel: "src/features/plugins/panels/page.tsx",
    note:
      "update_plugin_config 必须落到 plugins mutation hook、mutation payload cache 和具体 panel；只覆盖命令字符串不算还原。",
  },
] as const satisfies readonly FrontendDumpedModuleRestorationRequirement[];

export const FRONTEND_DUMPED_CONTRACT_SLICE_D_COVERAGE = [
  {
    module: "accounts",
    command: "begin_add_account_attach_monitor",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "账号添加监控由 accounts service 暴露原始命令，mutation hook 写入账号模块缓存，操作面板只触发模块 action。",
  },
  {
    module: "accounts",
    command: "export_accounts_to_file",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "账号导出由 accounts service 统一处理保存路径和 IPC wrapper，mutation 成功后只写回 accounts cache。",
  },
  {
    module: "accounts",
    command: "import_accounts_from_file",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "账号文件导入由操作面板收集路径和选择项，hook 提交 mutation，并按模块合同刷新账号事实。",
  },
  {
    module: "accounts",
    command: "logout",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "登出命令作为账号模块 action 暴露，页面不直连 IPC，结果经 mutation owner 写回缓存。",
  },
  {
    module: "accounts",
    command: "preview_account_import",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "导入预览由 accounts service owning 打开文件对话框和 preview wrapper，面板只消费返回的文件路径和预览结果。",
  },
  {
    module: "accounts",
    command: "remove_accounts",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/detail.tsx",
    note: "批量移除和详情页移除都归 accounts mutation owner，组件只传账号 key，不保存后端事实。",
  },
  {
    module: "accounts",
    command: "switch_account",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/detail.tsx",
    note: "账号切换由详情面板和操作面板复用同一 mutation action，后端返回 payload 后再更新账号缓存。",
  },
  {
    module: "accounts",
    command: "switch_account_and_restart_codex",
    status: "covered",
    service: "src/services/accounts/index.ts",
    feature: "src/features/accounts/hooks/mutation.ts",
    surface: "src/features/accounts/panels/actions.tsx",
    note: "切换并重启由账号操作面板触发，同样经 accounts mutation owner 写回结果，页面层不直连 IPC。",
  },
  {
    module: "sessions",
    command: "load_sessions",
    status: "covered",
    service: "src/services/sessions/index.ts",
    feature: "src/features/sessions/hooks/index.ts",
    surface: "src/features/sessions/components/sessions-page.tsx",
    note: "会话列表由模块 query 读取。",
  },
  {
    module: "sessions",
    command: "delete_sessions",
    status: "covered",
    service: "src/services/sessions/index.ts",
    feature: "src/features/sessions/hooks/index.ts",
    surface: "src/features/sessions/components/sessions-page.tsx",
    note: "删除动作按 mutation payload 写回模块缓存。",
  },
  {
    module: "sessions",
    command: "import_chatgpt_session_account",
    status: "covered",
    service: "src/services/sessions/index.ts",
    feature: "src/features/sessions/hooks/index.ts",
    surface: "src/features/sessions/components/sessions-page.tsx",
    note: "导入入口只传 dumped 证实的 sessionJson 与 overwriteExisting 参数。",
  },
  {
    module: "sessions",
    command: "load_usage_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/sessions/hooks/index.ts",
    surface: "src/features/sessions/components/sessions-page.tsx",
    note: "会话页按 dumped 资产补充只读用量指标入口。",
  },
  {
    module: "analytics",
    command: "load_usage_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "分析页用量面板入口已覆盖。",
  },
  {
    module: "analytics",
    command: "load_quota_history",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "配额历史按 accountKey 参数读取。",
  },
  {
    module: "analytics",
    command: "load_session_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "会话分析按 range 参数读取。",
  },
  {
    module: "analytics",
    command: "load_token_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "Token 分析按 range 参数读取。",
  },
  {
    module: "analytics",
    command: "load_tool_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "工具分析按 range 参数读取。",
  },
  {
    module: "analytics",
    command: "load_change_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/analytics/hooks/index.ts",
    surface: "src/features/analytics/components/analytics-page.tsx",
    note: "变更分析按 range 参数读取。",
  },
  {
    module: "overview",
    command: "load_snapshot",
    status: "covered",
    service: "src/services/system/index.ts",
    feature: "src/features/overview/hooks/index.ts",
    surface: "src/features/overview/components/overview-page.tsx",
    note: "仪表盘快照使用 localOnly 只读入口。",
  },
  {
    module: "overview",
    command: "refresh_usage_snapshot",
    status: "covered",
    service: "src/services/system/index.ts",
    feature: "src/features/overview/hooks/index.ts",
    surface: "src/features/overview/components/overview-page.tsx",
    note: "刷新动作按 mutation payload 写回 overview cache。",
  },
  {
    module: "overview",
    command: "load_usage_analytics",
    status: "covered",
    service: "src/services/analytics/index.ts",
    feature: "src/features/overview/hooks/index.ts",
    surface: "src/features/overview/components/overview-page.tsx",
    note: "仪表盘用量面板复用 dumped 用量分析入口。",
  },
  {
    module: "tray-shell",
    command: "get_notification_client_state",
    status: "covered",
    service: "src/services/system/index.ts",
    feature: "src/features/tray-shell/hooks/index.ts",
    surface: "src/features/tray-shell/components/tray-shell-page.tsx",
    note: "托盘外壳读取通知客户端状态。",
  },
  {
    module: "tray-shell",
    command: "focus_main_window",
    status: "covered",
    service: "src/services/system/index.ts",
    feature: "src/features/tray-shell/hooks/index.ts",
    surface: "src/features/tray-shell/components/tray-shell-page.tsx",
    note: "托盘外壳保留主窗口聚焦动作。",
  },
  {
    module: "voice",
    command: "load_voice_workspace",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "upsert_voice_template",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "remove_voice_template",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "upsert_voice_vocabulary",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "remove_voice_vocabulary",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "replace_voice_vocabulary_kind",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "upsert_voice_vocabulary_app_scope",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "remove_voice_vocabulary_app_scope",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "resolve_voice_vocabulary_app_info",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "generate_voice_prompt",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "load_voice_llm_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "save_voice_llm_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "test_voice_llm_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "load_voice_asr_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "save_voice_asr_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "test_voice_asr_config",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "remove_voice_history_entry",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "load_voice_runtime_status",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "request_voice_permissions",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "request_accessibility_permission",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_global_shortcut",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "capture_voice_trigger_key",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "cancel_voice_trigger_capture",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_trigger_listener_suppressed",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_trigger_key",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_trigger_bindings",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "update_voice_runtime_settings",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_processing_mode_id",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "start_voice_capture",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "stop_voice_capture",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "inject_voice_text",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "show_voice_search_overlay",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "set_voice_mode_shortcut",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
  {
    module: "voice",
    command: "remove_voice_mode_shortcut",
    status: "boundary-only",
    service: "src/services/voice/index.ts",
    feature: "src/features/voice/contract.ts",
    surface: "src/features/voice/Content.tsx",
    note: "仅登记 voice 空骨架合同边界；服务层、Content 与合同文件不提供业务实现。",
  },
] as const satisfies readonly SliceDDumpedCommandCoverage[];

export type FrontendDumpedContractSliceD =
  typeof FRONTEND_DUMPED_CONTRACT_SLICE_D_COVERAGE;

export function getSliceDDumpedCommandCoverage(module: SliceDDumpedModule) {
  return FRONTEND_DUMPED_CONTRACT_SLICE_D_COVERAGE.filter(
    (item) => item.module === module,
  );
}
