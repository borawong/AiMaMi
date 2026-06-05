# Frontend Orphan Callchain Pseudocode - AiMaMi 1.0.9

Evidence type: frontend inventory and source archive 1.1 comparison only. No backend gate promotion.

## Shell Summary Mount

```text
ShellSummaryMount():
  after ready delay:
    query usage summary -> invoke("load_usage_analytics")
    query mcp summary -> invoke("load_mcp_servers")
    query installed skills summary -> invoke("load_installed_skills")
```

## Sessions Page

```text
SessionsPageMount():
  query sessions -> invoke("load_sessions")
  query usage analytics -> invoke("load_usage_analytics")

DeleteSessions(ids):
  guard ids not empty
  invoke("delete_sessions", { ids })
  clear selection
  invalidate sessions
  refetch usage analytics

RepoExtraRecoverUnindexedSessions(ids):
  source archive repo surface only in this bundle
  not present in AiMaMi 1.0.9 frontend IPC command set
```

## Analytics Panel

```text
AnalyticsPanel(tab, range, accountKey):
  if tab == "sessions":
    invoke("load_session_analytics", { range })
  if tab == "tokens":
    invoke("load_token_analytics", { range })
  if tab == "tools":
    invoke("load_tool_analytics", { range })
  if tab == "changes":
    invoke("load_change_analytics", { range })
  if tab == "quota" and accountKey exists:
    invoke("load_quota_history", { accountKey })
  summary card:
    invoke("load_usage_analytics")
```

## MCP Page

```text
McpPageMount():
  query mcp servers -> invoke("load_mcp_servers")

SaveServer(form):
  normalize args/env/headers
  invoke("upsert_mcp_server", form)
  invalidate mcp servers

ToggleServer(name, enabled):
  invoke("set_mcp_server_enabled", { name, enabled })
  invalidate mcp servers

RemoveServer(name):
  confirm destructive action
  invoke("remove_mcp_server", { name })
  invalidate mcp servers
```

## Skills Page

```text
SkillsPageMount(tab):
  query installed -> invoke("load_installed_skills")
  if tab == "backups":
    query backups -> invoke("load_skill_backups")

ImportSkill(path):
  invoke("import_skill", { path })
  invalidate installed skills

RemoveSkill(id):
  invoke("remove_skill", { id })
  invalidate installed skills

RestoreBackup(id):
  invoke("restore_skill_backup", { id })
  invalidate installed skills
  invalidate skill backups

DeleteBackup(id):
  invoke("delete_skill_backup", { id })
  invalidate skill backups
```

## Custom Instructions

```text
CustomInstructionsPageMount():
  query state -> invoke("load_custom_instruction_state")

PreviewApply(content, templateId):
  guard content or template selected
  invoke("preview_custom_instruction_apply", { content, templateId })
  show preview dialog

ApplyInstruction(payload):
  invoke("apply_custom_instruction", payload)
  update state

ClearManagedBlock():
  confirm destructive action
  invoke("clear_custom_instruction_block")
  update state

Rollback(historyId):
  invoke("rollback_custom_instruction", { historyId })
  update state
```

## Voice Surface

```text
VoiceWorkspaceMount():
  invoke("load_voice_workspace")
  invoke("load_voice_runtime_status")
  optional provider config:
    invoke("load_voice_llm_config", { provider })
    invoke("load_voice_asr_config", { provider })

VoiceConfigSaveAndTest(kind, providerConfig):
  if kind == "llm":
    invoke("save_voice_llm_config", providerConfig)
    invoke("test_voice_llm_config", providerConfig)
  if kind == "asr":
    invoke("save_voice_asr_config", providerConfig)
    invoke("test_voice_asr_config", providerConfig)

VoiceVocabularyAndTemplates():
  invoke("upsert_voice_template" | "remove_voice_template")
  invoke("upsert_voice_vocabulary" | "remove_voice_vocabulary")
  invoke("replace_voice_vocabulary_kind")
  invoke("upsert_voice_vocabulary_app_scope" | "remove_voice_vocabulary_app_scope")
  invoke("resolve_voice_vocabulary_app_info")

VoiceRuntimeControls():
  invoke("request_voice_permissions")
  invoke("request_accessibility_permission")
  invoke("set_voice_global_shortcut")
  invoke("capture_voice_trigger_key" | "cancel_voice_trigger_capture")
  invoke("set_voice_trigger_key")
  invoke("set_voice_trigger_bindings")
  invoke("update_voice_runtime_settings")
  invoke("set_voice_processing_mode_id")
  invoke("start_voice_capture" | "stop_voice_capture")
  invoke("inject_voice_text")
  invoke("show_voice_search_overlay")
  invoke("set_voice_mode_shortcut" | "remove_voice_mode_shortcut")
```
