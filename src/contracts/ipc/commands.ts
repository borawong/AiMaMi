export const IPC_COMMAND_DOMAINS = [
  "accounts",
  "analytics",
  "custom-instructions",
  "daemon-autoswitch",
  "maintenance",
  "mcp",
  "relay",
  "runtime-extensions",
  "sessions",
  "settings",
  "skills",
  "system",
  "voice"
] as const;

export type IpcCommandDomain = (typeof IPC_COMMAND_DOMAINS)[number];

export const IPC_COMMAND_DEFINITIONS = [
  {
    "domain": "accounts",
    "command": "begin_add_account_attach_monitor",
    "wrapperNames": [
      "beginAddAccountAttachMonitor"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "export_accounts_to_file",
    "wrapperNames": [
      "exportAccountsToFile"
    ],
    "argKeys": [
      "accountKeys",
      "targetPath"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "import_accounts_from_file",
    "wrapperNames": [
      "importAccountsFromFile"
    ],
    "argKeys": [
      "filePath",
      "overwriteExisting",
      "selectedKeys"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "logout",
    "wrapperNames": [
      "logout"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "preview_account_import",
    "wrapperNames": [
      "previewAccountImport"
    ],
    "argKeys": [
      "filePath"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "remove_accounts",
    "wrapperNames": [
      "removeAccounts"
    ],
    "argKeys": [
      "accountKeys"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "switch_account",
    "wrapperNames": [
      "switchAccount"
    ],
    "argKeys": [
      "accountKey"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "accounts",
    "command": "switch_account_and_restart_codex",
    "wrapperNames": [
      "switchAccountAndRestartCodex"
    ],
    "argKeys": [
      "accountKey"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "analytics",
    "command": "load_change_analytics",
    "wrapperNames": [
      "loadChangeAnalytics"
    ],
    "argKeys": [
      "range"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "analytics",
    "command": "load_quota_history",
    "wrapperNames": [
      "loadQuotaHistory"
    ],
    "argKeys": [
      "accountKey"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "analytics",
    "command": "load_token_analytics",
    "wrapperNames": [
      "loadTokenAnalytics"
    ],
    "argKeys": [
      "range"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "analytics",
    "command": "load_tool_analytics",
    "wrapperNames": [
      "loadToolAnalytics"
    ],
    "argKeys": [
      "range"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "analytics",
    "command": "load_usage_analytics",
    "wrapperNames": [
      "loadUsageAnalytics"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "custom-instructions",
    "command": "apply_custom_instruction",
    "wrapperNames": [
      "applyCustomInstruction"
    ],
    "argKeys": [
      "content",
      "source",
      "templateCode",
      "templateTitle"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "custom-instructions",
    "command": "clear_custom_instruction_block",
    "wrapperNames": [
      "clearCustomInstructionBlock"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "custom-instructions",
    "command": "load_custom_instruction_state",
    "wrapperNames": [
      "loadCustomInstructionState"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "custom-instructions",
    "command": "preview_custom_instruction_apply",
    "wrapperNames": [
      "previewCustomInstructionApply"
    ],
    "argKeys": [
      "content"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "custom-instructions",
    "command": "rollback_custom_instruction",
    "wrapperNames": [
      "rollbackCustomInstruction"
    ],
    "argKeys": [
      "historyId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "configure_auto_switch",
    "wrapperNames": [
      "configureAutoSwitch"
    ],
    "argKeys": [
      "threshold5hPercent",
      "thresholdWeeklyPercent"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "confirm_pending_auto_switch",
    "wrapperNames": [
      "confirmPendingAutoSwitch"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "confirm_pending_auto_switch_and_restart_codex",
    "wrapperNames": [
      "confirmPendingAutoSwitchAndRestartCodex"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "dismiss_pending_auto_switch",
    "wrapperNames": [
      "dismissPendingAutoSwitch"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "load_bootstrap_state",
    "wrapperNames": [
      "loadBootstrapState"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "load_pending_auto_switch",
    "wrapperNames": [
      "loadPendingAutoSwitch"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "run_daemon_once",
    "wrapperNames": [
      "runDaemonOnce"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "daemon-autoswitch",
    "command": "set_auto_switch",
    "wrapperNames": [
      "setAutoSwitch"
    ],
    "argKeys": [
      "enabled"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "clean",
    "wrapperNames": [
      "clean"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "diagnose",
    "wrapperNames": [
      "diagnose"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "force_kill_codex",
    "wrapperNames": [
      "forceKillCodex"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "get_system_info",
    "wrapperNames": [
      "getSystemInfo"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "open_path",
    "wrapperNames": [
      "openPath"
    ],
    "argKeys": [
      "path"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "rebuild_registry",
    "wrapperNames": [
      "rebuildRegistry"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "reset_codex_config",
    "wrapperNames": [
      "resetCodexConfig"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "maintenance",
    "command": "restart_codex",
    "wrapperNames": [
      "restartCodex",
      "restartCodexApp"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "mcp",
    "command": "load_mcp_servers",
    "wrapperNames": [
      "loadMcpServers"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "mcp",
    "command": "remove_mcp_server",
    "wrapperNames": [
      "removeMcpServer"
    ],
    "argKeys": [
      "name"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "mcp",
    "command": "set_mcp_server_enabled",
    "wrapperNames": [
      "setMcpServerEnabled"
    ],
    "argKeys": [
      "enabled",
      "name"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "mcp",
    "command": "upsert_mcp_server",
    "wrapperNames": [
      "upsertMcpServer"
    ],
    "argKeys": [
      "args",
      "environment",
      "headers"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "activate_relay_provider",
    "wrapperNames": [
      "activate"
    ],
    "argKeys": [
      "ide",
      "providerId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "deactivate_relay_provider",
    "wrapperNames": [
      "deactivate"
    ],
    "argKeys": [
      "ide",
      "providerId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "delete_relay_provider",
    "wrapperNames": [
      "delete"
    ],
    "argKeys": [
      "providerId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "diagnose_codex_router",
    "wrapperNames": [],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "export_relay_config",
    "wrapperNames": [
      "exportConfig"
    ],
    "argKeys": [
      "filePath",
      "includeApiKeys"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "fetch_relay_models_draft",
    "wrapperNames": [
      "fetchModelsDraft"
    ],
    "argKeys": [
      "input"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "fix_codex_router_issue",
    "wrapperNames": [],
    "argKeys": [
      "itemId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "get_passthrough_audit_log",
    "wrapperNames": [
      "getPassthroughAuditLog"
    ],
    "argKeys": [
      "limit"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "get_relay_active",
    "wrapperNames": [
      "getActive"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "get_relay_proxy_status",
    "wrapperNames": [
      "getProxyStatus"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "import_relay_config",
    "wrapperNames": [
      "importConfig"
    ],
    "argKeys": [
      "filePath"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "load_relay_state",
    "wrapperNames": [
      "loadState"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "run_codex_router_diagnostics",
    "wrapperNames": [],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "set_block_official_passthrough",
    "wrapperNames": [
      "setBlockOfficialPassthrough"
    ],
    "argKeys": [
      "blocked"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "set_codex_router_enabled",
    "wrapperNames": [
      "setCodexRouterEnabled"
    ],
    "argKeys": [
      "enabled",
      "relaunch"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "set_relay_provider_network",
    "wrapperNames": [
      "setNetwork"
    ],
    "argKeys": [
      "network",
      "providerId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "test_relay_draft",
    "wrapperNames": [
      "testDraft"
    ],
    "argKeys": [
      "input"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "test_relay_provider",
    "wrapperNames": [
      "test"
    ],
    "argKeys": [
      "providerId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "relay",
    "command": "upsert_relay_provider",
    "wrapperNames": [
      "upsert"
    ],
    "argKeys": [
      "input"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "runtime-extensions",
    "command": "get_plugin_config",
    "wrapperNames": [
      "getPluginConfig"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "runtime-extensions",
    "command": "list_plugins",
    "wrapperNames": [
      "listPlugins"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "runtime-extensions",
    "command": "toggle_plugin",
    "wrapperNames": [
      "togglePlugin"
    ],
    "argKeys": [
      "enabled",
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "runtime-extensions",
    "command": "update_plugin_config",
    "wrapperNames": [
      "updatePluginConfig"
    ],
    "argKeys": [
      "id",
      "settings"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "sessions",
    "command": "delete_sessions",
    "wrapperNames": [
      "deleteSessions"
    ],
    "argKeys": [
      "ids"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "sessions",
    "command": "import_chatgpt_session_account",
    "wrapperNames": [
      "importChatGptSessionAccount"
    ],
    "argKeys": [
      "overwriteExisting",
      "sessionJson"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "sessions",
    "command": "load_session_analytics",
    "wrapperNames": [
      "loadSessionAnalytics"
    ],
    "argKeys": [
      "range"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "sessions",
    "command": "load_sessions",
    "wrapperNames": [
      "loadSessions"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "check_update_installability",
    "wrapperNames": [
      "checkUpdateInstallability"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "detect_api_proxy_config",
    "wrapperNames": [
      "detectApiProxyConfig"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "get_hotspot_enabled",
    "wrapperNames": [
      "getHotspotEnabled"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "get_image_compat",
    "wrapperNames": [
      "getImageCompat"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "get_usage_refresh_interval",
    "wrapperNames": [
      "getUsageRefreshInterval"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "graceful_restart_for_update",
    "wrapperNames": [],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "has_notch",
    "wrapperNames": [
      "hasNotch"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "hotspot_ready",
    "wrapperNames": [
      "hotspotReady"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "set_api_proxy_config",
    "wrapperNames": [
      "setApiProxyConfig"
    ],
    "argKeys": [
      "mode",
      "url"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "set_hotspot_enabled",
    "wrapperNames": [
      "setHotspotEnabled"
    ],
    "argKeys": [
      "enabled"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "set_image_compat",
    "wrapperNames": [
      "setImageCompat"
    ],
    "argKeys": [
      "enabled"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "set_usage_refresh_interval",
    "wrapperNames": [
      "setUsageRefreshInterval"
    ],
    "argKeys": [
      "interval"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "settings",
    "command": "test_api_proxy_config",
    "wrapperNames": [
      "testApiProxyConfig"
    ],
    "argKeys": [
      "mode",
      "url"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "delete_skill_backup",
    "wrapperNames": [
      "deleteSkillBackup"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "import_skill",
    "wrapperNames": [
      "importSkill"
    ],
    "argKeys": [
      "path"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "load_installed_skills",
    "wrapperNames": [
      "loadInstalledSkills"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "load_skill_backups",
    "wrapperNames": [
      "loadSkillBackups"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "remove_skill",
    "wrapperNames": [
      "removeSkill"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "skills",
    "command": "restore_skill_backup",
    "wrapperNames": [
      "restoreSkillBackup"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "focus_main_window",
    "wrapperNames": [
      "focusMainWindow"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "get_device_id",
    "wrapperNames": [
      "getDeviceId"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "get_mystery_unlock_grants",
    "wrapperNames": [
      "getMysteryUnlockGrants"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "get_notification_client_state",
    "wrapperNames": [
      "getNotificationClientState"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "get_or_create_remote_device_secret",
    "wrapperNames": [],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "import_remote_device_secret_if_empty",
    "wrapperNames": [],
    "argKeys": [
      "secret"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "load_snapshot",
    "wrapperNames": [
      "loadSnapshot"
    ],
    "argKeys": [
      "localOnly"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "merge_mystery_unlock_grants",
    "wrapperNames": [
      "mergeMysteryUnlockGrants"
    ],
    "argKeys": [
      "grants"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "system",
    "command": "refresh_usage_snapshot",
    "wrapperNames": [
      "refreshUsageSnapshot"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "cancel_voice_trigger_capture",
    "wrapperNames": [
      "cancelVoiceTriggerCapture"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "capture_voice_trigger_key",
    "wrapperNames": [
      "captureVoiceTriggerKey"
    ],
    "argKeys": [
      "style"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "generate_voice_prompt",
    "wrapperNames": [
      "generateVoicePrompt"
    ],
    "argKeys": [
      "asrDurationMs",
      "asrEmotion",
      "asrErrorCode",
      "asrLanguage",
      "asrModel",
      "asrProvider",
      "clipboardText",
      "llmApiKey",
      "llmBaseUrl",
      "llmModel",
      "llmProvider",
      "promptOverride",
      "rawText",
      "selectedText",
      "targetAppName",
      "targetBundleId",
      "templateId",
      "templateKind",
      "templateTitle"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "inject_voice_text",
    "wrapperNames": [
      "injectVoiceText"
    ],
    "argKeys": [
      "expectedBundleId",
      "text"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "load_voice_asr_config",
    "wrapperNames": [
      "loadVoiceAsrConfig"
    ],
    "argKeys": [
      "provider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "load_voice_llm_config",
    "wrapperNames": [
      "loadVoiceLlmConfig"
    ],
    "argKeys": [
      "provider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "load_voice_runtime_status",
    "wrapperNames": [
      "loadVoiceRuntimeStatus"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "load_voice_workspace",
    "wrapperNames": [
      "loadVoiceWorkspace"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "remove_voice_history_entry",
    "wrapperNames": [
      "removeVoiceHistoryEntry"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "remove_voice_mode_shortcut",
    "wrapperNames": [
      "removeVoiceModeShortcut"
    ],
    "argKeys": [
      "modeId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "remove_voice_template",
    "wrapperNames": [
      "removeVoiceTemplate"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "remove_voice_vocabulary",
    "wrapperNames": [
      "removeVoiceVocabulary"
    ],
    "argKeys": [
      "id"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "remove_voice_vocabulary_app_scope",
    "wrapperNames": [
      "removeVoiceVocabularyAppScope"
    ],
    "argKeys": [
      "appBundleId"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "replace_voice_vocabulary_kind",
    "wrapperNames": [
      "replaceVoiceVocabularyKind"
    ],
    "argKeys": [
      "appBundleId",
      "appName",
      "entries",
      "kind",
      "notes",
      "replacement",
      "source"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "request_accessibility_permission",
    "wrapperNames": [
      "requestAccessibilityPermission"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "request_voice_permissions",
    "wrapperNames": [
      "requestVoicePermissions"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "resolve_voice_vocabulary_app_info",
    "wrapperNames": [
      "resolveVoiceVocabularyAppInfo"
    ],
    "argKeys": [
      "path"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "save_voice_asr_config",
    "wrapperNames": [
      "saveVoiceAsrConfig"
    ],
    "argKeys": [
      "asrApiKey",
      "asrBaseUrl",
      "asrModel",
      "asrProvider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "save_voice_llm_config",
    "wrapperNames": [
      "saveVoiceLlmConfig"
    ],
    "argKeys": [
      "llmApiKey",
      "llmBaseUrl",
      "llmModel",
      "llmProvider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_global_shortcut",
    "wrapperNames": [
      "setVoiceGlobalShortcut"
    ],
    "argKeys": [
      "shortcut"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_mode_shortcut",
    "wrapperNames": [
      "setVoiceModeShortcut"
    ],
    "argKeys": [
      "keyCode",
      "keyKind",
      "keyLabel",
      "modeId",
      "modifierMask",
      "style"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_processing_mode_id",
    "wrapperNames": [
      "setVoiceProcessingModeId"
    ],
    "argKeys": [
      "modeId",
      "processingMode"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_trigger_bindings",
    "wrapperNames": [
      "setVoiceTriggerBindings"
    ],
    "argKeys": [
      "activeStyle",
      "holdKeyCode",
      "holdKeyKind",
      "holdKeyLabel",
      "holdModifierMask",
      "toggleKeyCode",
      "toggleKeyKind",
      "toggleKeyLabel",
      "toggleModifierMask"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_trigger_key",
    "wrapperNames": [
      "setVoiceTriggerKey"
    ],
    "argKeys": [
      "keyCode",
      "keyKind",
      "keyLabel",
      "modifierMask",
      "style"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "set_voice_trigger_listener_suppressed",
    "wrapperNames": [
      "setVoiceTriggerListenerSuppressed"
    ],
    "argKeys": [
      "suppressed"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "show_voice_search_overlay",
    "wrapperNames": [
      "showVoiceSearchOverlay"
    ],
    "argKeys": [
      "output",
      "query"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "start_voice_capture",
    "wrapperNames": [
      "startVoiceCapture"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "stop_voice_capture",
    "wrapperNames": [
      "stopVoiceCapture"
    ],
    "argKeys": [],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "test_voice_asr_config",
    "wrapperNames": [
      "testVoiceAsrConfig"
    ],
    "argKeys": [
      "asrApiKey",
      "asrBaseUrl",
      "asrModel",
      "asrProvider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "test_voice_llm_config",
    "wrapperNames": [
      "testVoiceLlmConfig"
    ],
    "argKeys": [
      "llmApiKey",
      "llmBaseUrl",
      "llmModel",
      "llmProvider"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "update_voice_runtime_settings",
    "wrapperNames": [
      "updateVoiceRuntimeSettings"
    ],
    "argKeys": [
      "enabled",
      "processingMode",
      "processingModeId",
      "shortcut",
      "speechModel"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "upsert_voice_template",
    "wrapperNames": [
      "upsertVoiceTemplate"
    ],
    "argKeys": [
      "content",
      "description",
      "id",
      "title"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "upsert_voice_vocabulary",
    "wrapperNames": [
      "upsertVoiceVocabulary"
    ],
    "argKeys": [
      "appBundleId",
      "appName",
      "id",
      "kind",
      "notes",
      "replacement",
      "source"
    ],
    "source": "minified",
    "tier": "P1"
  },
  {
    "domain": "voice",
    "command": "upsert_voice_vocabulary_app_scope",
    "wrapperNames": [
      "upsertVoiceVocabularyAppScope"
    ],
    "argKeys": [
      "bundleId",
      "name",
      "path"
    ],
    "source": "minified",
    "tier": "P1"
  }
] as const;

export type IpcCommandName = (typeof IPC_COMMAND_DEFINITIONS)[number]["command"];
export type IpcCommandDefinition = (typeof IPC_COMMAND_DEFINITIONS)[number];

export function getIpcCommandsForDomain(domain: IpcCommandDomain) {
  return IPC_COMMAND_DEFINITIONS.filter((item) => item.domain === domain);
}

export function getIpcCommandDefinition(command: IpcCommandName) {
  return IPC_COMMAND_DEFINITIONS.find((item) => item.command === command);
}
