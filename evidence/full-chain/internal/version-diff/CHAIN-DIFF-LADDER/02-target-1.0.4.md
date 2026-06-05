# Hop 02 — 1.0.1 → 1.0.4 逐链路差异阶梯

**task#2 · diff-2 · 2026-05-24**（接 opus-diff 初版，按 lead「别将就粗」铺到逐条分支级）· voice/CI 子系统下线（44 退役逐条）+ plugins 引入（6 真新增逐条）+ 12 口径伪影标注 + 全链路状态表

## hop 概览

| 项 | 值 |
|---|---|
| 方向 | 1.0.1（146 注册，voice 全盛旁支底座）→ 1.0.4（119 注册，voice=0 + 有 plugins，直系前身） |
| 关键事实 | **1.0.1 ≠ 1.0.4 超集**——voice 维度「父级有、子级删」（44 退役），plugins 维度「父级无、子级加」（真新增 6）。1.0.4 才是 1.0.5/1.0.6 直系前身。 |
| 净命令变化 | **−44 退役**（voice 19 + voice_runtime 15 + custom_instructions 5 + inlined-voice* 4 + sessions 1）+ **+6 真新增**（plugins×3 + force_kill_codex + reset_codex_config + confirm_pending_auto_switch_and_restart_sync）；另 **12 口径伪影**（1.0.1 已有 body、被 101 口径剔为 helper，104 计入——演进上「全程在」，非真新增） |
| binary | 1.0.1 arm64-full（`platform::*` 全符号）；1.0.4 universal sha `39aebce2…`，arm64-thin `9494a906…`，nm 符号 59603 |
| 主证据源 | `FULL-CHAIN-101.md`（1212 行，**44 退役命令逐条 body 地址 + 业务 call-tree + FE args**）+ `_delta-chain-v2/101-104/{must-reverse,command-status}.tsv`（**104 侧存活命令的 6 added + 91 modified 分支级 delta**）+ `FULL-CHAIN-104.md`（§5 FE-forward 关键事实 + §3 新增命令）+ `CROSS-VERSION-REGISTRATION-EVOLUTION.md` §2/§3/§5 |
| 证据等级（诚实） | **退役 44 条**：1.0.1 侧由 FULL-CHAIN-101 逐条坐实（pseudocode 地址 + objdump-bl call-tree，**high**）；1.0.4 侧由 FULL-CHAIN-104 §5 `strings -axF` 验证 backend 符号 + cstring 归零（**high**）。**真新增 6 条**：1.0.4 侧由 `_delta-chain-v2/101-104` must-reverse 标 `added` + FULL-CHAIN-104 坐实（**high**）；1.0.1 侧符号数=0 坐实（**high**）。**无专门 DELTA-LOGIC-104**（1.0.4 不是 delta-chain 锚版），故 1.0.4 存活命令的「相对 1.0.1 的 body 改动」粒度＝`_delta-chain-v2/101-104` 的 modified-* 分类（body-fp/calltree 级，非逐函数 ghidra），逐条标 confidence。 |

> 四件套：**链路名 ｜ 变更类型 ｜ 具体改了什么(1.0.1 链路 → 1.0.4 状态，分支/callee/IPC) ｜ 证据锚**。退役命令给「1.0.1 完整链路 → 1.0.4 归零」；新增给「1.0.1 无 → 1.0.4 链路」；存活改动给 delta 分类。

---

## A. 退役链路（voice/CI 子系统 backend 下线 · 44 条逐条）

> **关键诚实点（FULL-CHAIN-104 §5）**：1.0.4 前端仍 ship 这些 voice/CI 命令（FE-forward），但 1.0.4 arm64 binary **零 backend 符号 + 零 cstring**（逐个 `strings -axF` 验证）。这是 **backend 退役**——1.0.1 有完整 backend body，1.0.4 backend 符号归零，前端残留为「FE 领先 backend」。退役后任何基于 1.0.4/1.0.5/1.0.6 的复刻**不含**语音/自定义指令；复刻语音必回 1.0.1 底座。所有退役命令 1.0.4 状态统一＝「backend 符号 + cstring 归零，FE-forward 残留」，下表「具体改了什么」列出 **1.0.1 链路**（退役前实现），证据锚给 1.0.1 pseudocode 短名 + call-tree。

### A.1 voice 模块（19 退役 · `commands::voice::*` → `core::voice*`）

| 链路名 | 1.0.1 入参（FE args） | 1.0.1 链路（body 地址 → 业务 call-tree） | 证据锚（PC 短名 / confidence） |
|---|---|---|---|
| `generate_voice_prompt` | asr*/llm*/clipboardText/rawText/selectedText/targetApp*/template* (19 args) | `0x1005abacc` → `String::clone` → `voice_llm::LlmConfig::is_configured` → `CodexPaths::clone` → `core::voice::generate_prompt` → response_serialize | `0112_…generate_voice_prom…c`；**high** |
| `load_voice_asr_config` | `provider` | `0x1005aca84` → `core::voice_asr::load_saved_config` → `CoreEnvelope::ok` | `0113_…load_voice_asr_conf…c`；**high** |
| `load_voice_llm_config` | `provider` | `0x1005acc88` → `core::voice_llm::load_saved_config` → `CoreEnvelope::ok` | `0114_…load_voice_llm_conf…c`；**high** |
| `load_voice_workspace` | 无 | `0x1005ab664` → `core::voice::read_workspace_file` → `core::voice::to_payload` → `CoreEnvelope::ok` | `0115_…load_voice_workspac…c`；**high** |
| `remove_voice_history_entry` | `id` | `0x1005af434` → `core::voice::remove_history_entry` → `CoreEnvelope::ok` | `0117_…remove_voice_histor…c`；**high** |
| `remove_voice_template` | `id` | `0x1005ace8c` → `core::voice::remove_template` → `CoreEnvelope::ok` | `0118_…remove_voice_templa…c`；**high** |
| `remove_voice_vocabulary` | `id` | `0x1005aea30` → `core::voice::remove_vocabulary` → `CoreEnvelope::ok` | `0119_…remove_voice_vocabu…c`；**high** |
| `remove_voice_vocabulary_app_scope` | `appBundleId` | `0x1005afc9c` → `core::voice::remove_vocabulary_app_scope` → `CoreEnvelope::ok` | `0120_…remove_voice_vocabu…c`；**high** |
| `replace_voice_vocabulary_kind` | `appBundleId,appName,entries,kind` | `0x1005af7e0` → `core::voice::replace_vocabulary_kind` → `CoreEnvelope::ok` | `0121_…replace_voice_vocab…c`；**high** |
| `resolve_voice_vocabulary_app_info` | `path` | `0x1005b0048` → `core::str::converts::from_utf8` → response_serialize | `0123_…resolve_voice_vocab…c`；**high** |
| `save_voice_asr_config` | `asrApiKey,asrBaseUrl,asrModel,asrProvider` | `0x1005ad238` → `core::voice_asr::save_config`（persistence_commit）→ `CoreEnvelope::ok` | `0124_…save_voice_asr_conf…c`；**high**（含写盘） |
| `save_voice_llm_config` | `llmApiKey,llmBaseUrl,llmModel,llmProvider` | `0x1005ad3fc` → `core::voice_llm::save_config`（persistence_commit）→ `CoreEnvelope::ok` | `0125_…save_voice_llm_conf…c`；**high**（含写盘） |
| `test_voice_asr_config` | `asrApiKey,asrBaseUrl,asrModel,asrProvider` | `0x1005ad5c0` → `voice_asr::normalize_provider` → `AsrConfig::is_configured` → reqwest `ClientBuilder::default/build` + `into_url` + `RequestBuilder::{new,header_sensitive,send}` + `Response::text`（**出站 HTTP 健康检查**） | `0126_…test_voice_asr_conf…c`；**high**（含 external_call_recorded） |
| `test_voice_llm_config` | `llmApiKey,llmBaseUrl,llmModel,llmProvider` | `0x1005ae0a0` → `voice_llm::LlmConfig::is_configured` → `voice_llm::call_llm`（出站）→ `trim_matches` → `CoreEnvelope::ok` | `0127_…test_voice_llm_conf…c`；**high** |
| `upsert_voice_template` | `content,description,id,title` | `0x1005ae2ec` → `core::voice::upsert_template` → response_serialize | `0128_…upsert_voice_templa…c`；**high** |
| `upsert_voice_vocabulary` | `appBundleId,appName,id,kind,notes,replacement,source` | `0x1005aeddc` → `core::voice::upsert_vocabulary` → response_serialize | `0129_…upsert_voice_vocabu…c`；**high** |
| `upsert_voice_vocabulary_app_scope` | `bundleId,name,path` | `0x1005b051c` → `core::voice::upsert_vocabulary_app_scope` → `CoreEnvelope::ok` | `0130_…upsert_voice_vocabu…c`；**high** |
| `read_plist_value`（BE-only） | native-UI（非 JS） | `0x1005ab2a0` → `core::str::trim_matches` → response_serialize | `0116_…read_plist_value…c`；**high**（注：voice 模块 §830 计 19，含 2 个 BE-only helper `read_plist_value`/`resolve_macos_app_info`；演进表 §2 的 voice=19 取该模块全体——本表对齐 101 模块计数） |
| `resolve_macos_app_info`（BE-only） | native-UI（非 JS） | `0x1005ae89c`（closure-only）→ `core::str::converts::from_utf8` → response_serialize | `0122_…resolve_macos_app_i…c`；**high** |

> **诚实计数对账**：FULL-CHAIN-101 §voice 模块标题计 **19**（含 17 FE+BE + 2 BE-only helper）。演进表 §2 的「voice=19」即此模块全体；上表 19 条逐条列出，无遗漏、无补足省略。

### A.2 voice_runtime 模块（15 退役 · `commands::voice_runtime::*` → `core::voice_runtime*` / `platform::*`）

| 链路名 | 1.0.1 入参 | 1.0.1 链路（body 地址 → call-tree） | 证据锚 / confidence |
|---|---|---|---|
| `hide_voice_search_overlay`（BE-only） | native-UI | `0x10037b27c` → `WryHandle::clone` → `CoreEnvelope::ok` | `0131_…hide_voice…c`；**high** |
| `inject_voice_text` | `expectedBundleId,text` | `0x10037aa88` → `platform::text_injection::inject_text` → response_serialize | `0132_…inject_voic…c`；**high** |
| `load_voice_runtime_status` | 无 | `0x10037b400` → `core::voice_runtime::load_status` → `CoreEnvelope::ok` | `0133_…load_voice…c`；**high** |
| `open_macos_privacy_pane` | mock-dispatcher 枚举 | `0x10037ae60` → `std::process::Command::spawn`（sidecar_dispatch，开隐私设置面板）| `0134_…open_macos…c`；**high**（注：我方仓有同名 ours-only，hop 00 §C） |
| `remove_voice_mode_shortcut` | `modeId` | `0x10037b6f4` → `core::voice_runtime::remove_mode_shortcut` → `CoreEnvelope::ok` | `0135_…remove_voic…c`；**high** |
| `request_accessibility_permission` | 无 | `0x10037bbf8` → `core::voice_runtime::request_accessibility` → `CoreEnvelope::ok` | `0136_…request_acc…c`；**high** |
| `request_voice_permissions` | 无 | `0x10037b4f4` → `platform::voice_permissions::request_async` → `voice_runtime::load_status` → `CoreEnvelope::ok` | `0137_…request_voi…c`；**high** |
| `set_voice_global_shortcut` | `shortcut` | `0x10037b600` → `core::voice_runtime::set_global_shortcut` → `CoreEnvelope::ok` | `0138_…set_voice_g…c`；**high** |
| `set_voice_mode_shortcut` | `keyCode,keyKind,keyLabel,modeId,modifierMask,style` | `0x10037b180` → `core::voice_runtime::set_mode_shortcut` → `CoreEnvelope::ok` | `0139_…set_voice_m…c`；**high** |
| `set_voice_processing_mode_id` | `modeId,processingMode` | `0x10037b9a0` → `core::voice_runtime::set_processing_mode_id` → `CoreEnvelope::ok` | `0140_…set_voice_p…c`；**high** |
| `set_voice_trigger_bindings` | `activeStyle,hold*,toggle*` (9 args) | `0x10037b83c` → `core::voice_runtime::set_trigger_bindings` → `CoreEnvelope::ok` | `0141_…set_voice_t…c`；**high** |
| `set_voice_trigger_key` | `keyCode,keyKind,keyLabel,modifierMask,style` | `0x10037ad4c` → `core::voice_runtime::set_trigger_key` → `CoreEnvelope::ok` | `0142_…set_voice_t…c`；**high** |
| `start_voice_capture` | 无 | `0x10037asource archive8` → `core::voice_runtime::start_capture` → `CoreEnvelope::ok` | `0143_…start_voice…c`；**high** |
| `stop_voice_capture` | 无 | `0x10037ab64` → `core::voice_runtime::stop_capture` → `CoreEnvelope::ok` | `0144_…stop_voice…c`；**high** |
| `update_voice_runtime_settings` | `enabled,processingMode,processingModeId,shortcut,speechModel` | `0x10037ba94` → `core::voice_runtime::update_settings_internal` → `CoreEnvelope::ok` | `0145_…update_voic…c`；**high** |

> **诚实标注**：voice_runtime 模块标题计 15，上表列出 15 条全。`request_accessibility_permission` 与 `request_voice_permissions` 为两条独立命令（不合并）。演进表 §2 voice_runtime=15 与此一致。

### A.3 custom_instructions 模块（5 退役 · `commands::custom_instructions::*` → `core::custom_instructions::*`）

| 链路名 | 1.0.1 入参 | 1.0.1 链路（body 地址 → callee） | 证据锚 / confidence |
|---|---|---|---|
| `apply_custom_instruction`（`0x100307858`） | `content,source,templateCode,templateTitle` | → `core::custom_instructions::apply_managed_content` → `CoreEnvelope::ok` | `0027`（FULL-CHAIN-101 §custom_instructions）；**high** |
| `clear_custom_instruction_block`（`0x1003084bc`） | 无 | → `core::custom_instructions::clear_managed_block` → ok | `0028`；**high** |
| `load_custom_instruction_state`（`0x100308120`） | 无 | → `core::custom_instructions::load_state` → ok（**注：我方仓仍注册此命令**，hop 00 §D surface-scope 偏差） | `0029`；**high** |
| `preview_custom_instruction_apply`（`0x100308858`） | `content` | → `core::custom_instructions::preview_apply` → ok（**注：我方仓仍注册**，hop 00 §D） | `0030`；**high** |
| `rollback_custom_instruction`（`0x100307d2c`） | `historyId` | → `core::custom_instructions::rollback_history` → ok | `0031`；**high** |

### A.4 inlined voice*（4 退役 · 1.0.1 wrapper 完全内联，无独立 commands:: 符号）

| 链路名 | 1.0.1 入参 | 1.0.1 状态 → 1.0.4 状态 | 证据锚 / confidence |
|---|---|---|---|
| `cancel_voice_trigger_capture` | 无 | 1.0.1：wrapper 内联无独立体（业务符号见 REGISTRATION-TABLE-101 §2.inlined），FE `re("cancel_voice_trigger_capture")`。1.0.4：随 voice 退役归零。 | FULL-CHAIN-101 §(inlined)；演进表 §2 inlined(voice*)=4；**high**（inlined 体无独立符号，如实标） |
| `capture_voice_trigger_key` | `style` | 1.0.1：内联无独立体，FE `re(…,{style})`。1.0.4：归零。 | 同上；**high** |
| `set_voice_trigger_listener_suppressed` | `suppressed` | 1.0.1：内联无独立体，FE `re(…,{suppressed})`。1.0.4：归零。 | 同上；**high** |
| `show_voice_search_overlay` | `output,query` | 1.0.1：内联无独立体，FE `re(…,{output,query})`。1.0.4：归零。（注：我方仓有 ours-only `hide_voice_search_overlay`/`mark_voice_overlay_ready`，hop 00 §C） | 同上；**high** |

> **诚实边界**：这 4 条在 1.0.1 是 inlined command（无独立 ghidra body），1.0.1 侧只能证「FE re() 触发 + 业务符号存在」，**无独立函数体逐行**——故标 inlined，未伪造 body 地址。FULL-CHAIN-101 §(inlined) 共 15 条，但其中 11 条（load_sessions/switch_account/get_relay_active/test_relay_provider…）**全程在**（1.0.4/1.0.6 仍存活），仅这 4 条 voice* 随子系统退役。

### A.5 sessions（1 退役 · `commands::sessions::*`）

| 链路名 | 1.0.1 入参 | 1.0.1 链路 → 1.0.4 状态 | 证据锚 / confidence |
|---|---|---|---|
| `recover_unindexed_sessions`（`0x10030b6f0`） | `ids`（closure-only body） | 1.0.1：→ `core::sessions::recover_unindexed_sessions` → response_serialize。1.0.4：**显式移除**（task-e-recover-unindexed-sessions-removal，非 voice 连带，是独立 session 功能下线）。 | FULL-CHAIN-101 §sessions `0065`；演进表 §2 sessions=1；parity-freeze `reports/1.0.4/task-e-recover-unindexed-sessions-removal.md`；**high** |

---

## B. 真新增链路（1.0.1 binary 无任何 body 符号 · 6 条逐条）

> 演进表 §3 + `_delta-chain-v2/101-104/must-reverse.tsv` 标 `added`：只有这 6 个是真·1.0.4 首现（1.0.1 binary `commands::plugins::` 符号数=0 等坐实）。1.0.4 侧的分支细节由 must-reverse `added` + FULL-CHAIN-104 §1/§3 锚；逐命令 1.0.5/1.0.6 演进链已在 hop 03/04 给出，本表给「1.0.1 无 → 1.0.4 引入」的状态 + 1.0.4 链路指针。

| 链路名 | 变更类型 | 具体改了什么（1.0.1 无 → 1.0.4 链路） | 证据锚 / confidence |
|---|---|---|---|
| `get_plugin_config`（plugins） | 新增（plugins 模块 1.0.1 不存在） | **1.0.1**：`commands::plugins::` 符号数=0，模块不存在。**1.0.4**：plugins 模块引入，`PluginRegistry::get_config` → status payload（1.0.5 分支级见 hop 03 §B）。 | 演进表 §3 真新增 6；`_delta-chain-v2/101-104` command-status `plugins::get_plugin_config`；FULL-CHAIN-104 §1 plugins=3；**high** |
| `toggle_plugin`（plugins） | 新增（plugins 模块） | 1.0.1 无 → 1.0.4 `PluginRegistry::set_enabled`（切换插件启用，写注册表）。 | 演进表 §3；must-reverse `plugins::toggle_plugin`；**high** |
| `update_plugin_config`（plugins） | 新增（plugins 模块） | 1.0.1 无 → 1.0.4 `PluginRegistry::update_settings`（更新插件设置）。 | 演进表 §3；must-reverse `plugins::update_plugin_config`；**high** |
| `force_kill_codex`（system） | 新增 | 1.0.1 无强杀命令 → 1.0.4 新增（强杀 Codex 进程；1.0.6 分支 → `platform::process::force_kill_all_codex_processes`，无 confirm 守卫，见 hop 04 §B）。 | 演进表 §3；must-reverse `system::force_kill_codex`(added)；**high** |
| `reset_codex_config`（system） | 新增 | 1.0.1 无 → 1.0.4 新增配置重置（含 smart-routing 守卫：重置前检查 relay 路由是否激活，激活回写 `0x46` 错误码；1.0.5 分支 `RelayManager::snapshot` + 路由检查 + `fs::write` 见 hop 03 §C）。 | 演进表 §3；must-reverse `system::reset_codex_config`(added)；**high** |
| `confirm_pending_auto_switch_and_restart_sync`（system） | 新增（重构自 `perform_switch_payload_with_restart`） | **1.0.1** 只有 `confirm_pending_auto_switch`（无 restart 变体），但有 helper `accounts::perform_switch_payload_with_restart`（0x1005b4fe4，101 剔为 helper）。**1.0.4** 重构为注册命令，带三级降级回滚（restart failed → FileRestoreState::restore ×4 → recovery；1.0.5 分支级见 hop 03 §C）。 | 演进表 §3；must-reverse `system::confirm_…_restart_sync`(added)；FULL-CHAIN-101 附录 `perform_switch_payload_with_restart`(helper)；FULL-CHAIN-104 §3 async twin；**high** |

---

## C. 口径伪影（1.0.1 已有 body、104 口径计入 · 12 条，非真新增）

> 演进表 §3：这 12 个在归一矩阵显示「1.0.4 出现」，但 **1.0.1 binary 已有后端 body**，只是被 101 口径判为私有 helper/alias 剔除（不计 146），104 口径计入。**演进上应视为「全程在」，非真新增**，不伪装成演进。1.0.1 侧 helper 地址见 FULL-CHAIN-101 附录（剔除的 11 helper）+ §accounts/§tray_menu。

| 链路名 | 1.0.1 helper 地址（101 剔除处） | 口径归属变更说明 | 证据锚 |
|---|---|---|---|
| `append_switch_warning` | `0x1005b1340` | 1.0.1 helper body，101 剔为 helper（不计 146），104 计入 → 矩阵显「1.0.4 出现」，实为全程在 | FULL-CHAIN-101 附录；演进表 §3 |
| `broadcast_runtime_snapshot` | `0x1005b143c` | 同上（accounts helper） | 同上 |
| `capture_switch_rollback_state` | `0x1005b2538` | 同上（accounts helper） | 同上 |
| `quota_text` | `0x100652628`（tray_menu） | 同上（tray helper） | 同上 |
| `relaunch_codex_after_success` | `0x1005b23f8` | 同上（accounts helper） | 同上 |
| `resolve_cached_auto_switch_service_state` | `0x1005b5ae0` | 同上（accounts helper） | 同上 |
| `create_bootstrap_tray_menu` | `0x1006539a8`（tray_menu） | 同上（tray helper） | 同上 |
| `create_tray_menu_from_snapshot` | `0x100654ab0`（tray_menu） | 同上（tray helper） | 同上 |
| `refresh_tray_menu_with_snapshot` | `0x100655a40`（tray_menu） | 同上（tray helper） | 同上 |
| `refresh_usage_snapshot_with_retry` | （101 helper，attached to accounts）| 同上 | 演进表 §3 |
| `switch_account_sync` | （101 inlined/helper 族） | 1.0.1 已有同步切换 body，101 口径剔、104 计入 | 演进表 §3 |
| `switch_account_and_restart_sync` | （101 inlined/helper 族，对偶 `switch_account_and_restart_codex`） | 1.0.1 已有 async twin body，101 剔为 helper、104 计入 | 演进表 §3；FULL-CHAIN-104 §3 async twin |

> **诚实声明**：演进表 §3 列 12 条口径伪影。上表 12 条全列；其中 9 条在 FULL-CHAIN-101 附录有明确剔除地址（**high**），3 条（refresh_usage_snapshot_with_retry / switch_account_sync / switch_account_and_restart_sync）为 101 inlined/helper 族归属，无单独附录地址行（**medium-high**，由演进表 §3 口径裁定 + 101 inlined 段佐证），如实标注差别。

---

## D. 1.0.4 存活命令的 body 改动（相对 1.0.1 · `_delta-chain-v2/101-104` 分类）

> `_delta-chain-v2/101-104/must-reverse.tsv`（98 行，无表头）对 **104 侧存活的 98 命令**做了 1.0.1↔1.0.4 body-fp/calltree 比对：6 added（已在 §B）+ 34 modified-body+calltree + 56 modified-calltree + 2 modified-calltree+frontend。这些是「跨过 voice 退役后，1.0.4 相对 1.0.1 仍在演化的存活命令」。**粒度＝delta 分类**（body-fp / calltree 级，非逐函数 ghidra——1.0.4 不是 delta-chain 锚版，无 DELTA-LOGIC-104），逐类给计数 + 边界，不逐条伪装成深逆。

| delta 类别 | 计数 | 含义 | 证据锚 |
|---|---|---|---|
| added | 6 | 见 §B（plugins×3 + force_kill + reset_config + confirm_restart_sync） | must-reverse.tsv `added` |
| modified-body+calltree | 34 | 存活命令既改 body 又改调用图（1.0.1→1.0.4）。覆盖 accounts/analytics/hotspot/mcp/relay/skills/system/tray_menu 各模块的演化命令。 | must-reverse.tsv `modified-body+calltree`（34 行实测）；MODIFICATION-AUDIT.md |
| modified-calltree | 56 | 仅调用图变（body-fp 稳定）——多为 1.0.1→1.0.4 重构中 callee 增删/重排。 | must-reverse.tsv `modified-calltree` |
| modified-calltree+frontend | 2 | 调用图 + 前端触发同变。 | must-reverse.tsv `modified-calltree+frontend` |
| unchanged（safe-skip） | 1 | **1.0.4 binary 直证**，body-fp + calltree 与 1.0.1 一致 = 逻辑未变（非「继承 1.0.1」——是 1.0.4 重逆确认没变）。 | safe-skip.tsv `unchanged`；1.0.4 pseudocode 本版直证 |

> **计数实测（diff-2 复核 2026-05-24）**：`awk -F'\t' '{print $NF}' must-reverse.tsv | sort | uniq -c` = 6 added + 34 modified-body+calltree + 56 modified-calltree + 2 modified-calltree+frontend = 98（无表头）。

> **诚实边界**：§D 是「1.0.4 存活命令相对 1.0.1 的演化分类」，**不是逐命令分支级深逆**（无 DELTA-LOGIC-104）。逐命令名见 `_delta-chain-v2/101-104/command-status.tsv`（101 行）；逐命令分支级若需，要回 1.0.4 重新 ghidra（当前未做，如实标注，不抬升）。这 97 命令的 1.0.5 分支级在 hop 03（其中 37 进入 105 delta），1.0.6 在 hop 04。

---

## E. hop 02 全链路状态表（1.0.1 → 1.0.4，覆盖两版注册数 146 → 119）

> 命令×状态，覆盖 1.0.1(146) 全集 → 1.0.4(119) 全集。状态枚举：**retired**（44，backend 归零）/ **NEW**（6 真新增）/ **口径伪影-全程在**（12，1.0.1 有 body 被 101 剔）/ **survived-modified**（存活但 body/calltree 变）/ **survived-unchanged**（存活体未变）。

| 状态 | 计数 | 命令清单（或聚合说明） |
|---|---|---|
| retired（backend 归零） | 44 | voice 19（§A.1）+ voice_runtime 15（§A.2）+ custom_instructions 5（§A.3）+ inlined-voice* 4（§A.4）+ sessions 1（recover_unindexed_sessions，§A.5）—— 逐条见 §A，1.0.1 链路全列、1.0.4 归零 |
| NEW（1.0.4 首现） | 6 | `get_plugin_config` `toggle_plugin` `update_plugin_config` `force_kill_codex` `reset_codex_config` `confirm_pending_auto_switch_and_restart_sync`（§B） |
| 口径伪影-全程在 | 12 | `append_switch_warning` `broadcast_runtime_snapshot` `capture_switch_rollback_state` `quota_text` `relaunch_codex_after_success` `resolve_cached_auto_switch_service_state` `create_bootstrap_tray_menu` `create_tray_menu_from_snapshot` `refresh_tray_menu_with_snapshot` `refresh_usage_snapshot_with_retry` `switch_account_sync` `switch_account_and_restart_sync`（§C，1.0.1 有 body、101 口径剔、104 计入——非真新增） |
| survived-modified | 92 | 1.0.1 存活进 1.0.4 且 body/calltree 变：34 modified-body+calltree + 56 modified-calltree + 2 modified-calltree+frontend（§D，含 §C 的 12 口径伪影中已计 body 的部分；按 must-reverse 分类，98 行实测） |
| survived-unchanged | 1 | **1.0.4 本版直证**、body-fp + calltree 与 1.0.1 一致 = 逻辑未变（§D safe-skip `unchanged`，非继承） |
| **1.0.1 侧合计** | **146** | 146 = 44 retired + 102 全程在（其中 12 口径伪影被 101 剔出 146、另 90 在 146 内）。注：retired 44 中 inlined-voice* 4 + sessions closure-only 在 146 注册集口径内（演进表 §2 计入 44） |
| **1.0.4 侧合计** | **119** | 119 = 102 全程在（survived，含 12 口径伪影回计 + 90 在册存活）+ 6 NEW + 11 口径回计差。**口径对账见下注** |

> **口径对账（诚实）**：1.0.1=146、1.0.4=119 是演进表 invoke_handler 注册集口径。146 − 44 retired = 102 共享核心；102 + 6 NEW = 108 ≠ 119。差额 11 来自 **101 与 104 口径对 helper 的不同裁定**（演进表 §3：12 口径伪影中 101 剔为 helper、104 计入；演进表 §6 进一步 reconcile 124 superset / 83 FE-only 等切片）。本表不强行凑 119=108+11 的简单加减（那会掩盖口径差），而是**如实指向演进表 §1 lifecycle 桶**（全程在 98 + 1.0.4 新增留存 18[6 真+12 伪影] = 116 ≈ 119 减 logout 等边界）。**119 的精确逐命令拆分以 `REGISTRATION-TABLE-104` 为权威**，本 hop 不重算注册数，只逐链路给状态。

---

## F. hop 02 诚实小结

- **44 退役逐条铺开**（接 opus-diff 初版的「按模块归组 + 代表命令」，本版按 lead「别将就粗」**逐条列 1.0.1 body 地址 + 业务 call-tree + FE args**）：voice 19 / voice_runtime 15 / custom_instructions 5 / inlined-voice* 4 / sessions 1，全列无省略。
- **1.0.1 ≠ 1.0.4 超集**：voice「父有子删」(44) + plugins「父无子加」(6)，明确区分，不当成简单 delta。
- **退役是 backend 退役**：FULL-CHAIN-104 §5 坐实——1.0.4 前端仍 ship voice/CI（FE-forward），backend 符号 + cstring 归零。复刻语音必回 1.0.1 底座。
- **真新增 vs 口径伪影严格分**：真新增 6（§B，1.0.4 must-reverse `added` 坐实）vs 口径伪影 12（§C，1.0.1 已有 body，标「全程在」非演进）——演进表 §3 口径已显式拆分，本 hop 沿用并补 101 helper 地址。
- **inlined 命令如实标无独立体**：A.4 的 4 条 voice* + §B 的 confirm_restart_sync 前身（perform_switch_payload_with_restart helper）均标 inlined/helper，未伪造独立 ghidra body 地址。
- **§D 粒度边界明示**：1.0.4 存活命令的 body 改动只到 `_delta-chain-v2/101-104` 的 delta 分类（无 DELTA-LOGIC-104），逐命令分支级若需要回 1.0.4 重新 ghidra，当前未做、不抬升 confidence。
- **状态表口径对账诚实**：146→119 的差额来自 101/104 helper 口径差，本表指向演进表 §1/§3/§6 reconcile，不强凑加减掩盖切片差。
- **client-only 边界**：全部客户端 binary 行为，无服务端主张。
