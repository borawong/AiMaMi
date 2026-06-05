# Hop 04 — 1.0.5 → 1.0.6 逐链路差异阶梯

**task#2 · opus-diff · 2026-05-24** · 全量 60 命令 + 3 退役链路

## hop 概览

| 项 | 值 |
|---|---|
| 方向 | 1.0.5（120/121 注册）→ 1.0.6（122 注册），直系继承链末端 |
| 净命令变化 | **+2 真新增**（`get_image_compat` / `set_image_compat`）+ relay **+2 查询**（`get_relay_active` / `get_relay_proxy_status`）；**−3 退役**（`list_plugins` + `custom_instructions_entry_enabled` + `recharge_entry_enabled`） |
| delta 总数 | 60 must-reverse（4 added + 32 modified-body+calltree + 24 modified-body） |
| 三大 delta 模式 | (a) ok 包内联化（analytics/load 类，移除旧 alloc-shim）；(b) std 线程 `Builder::spawn_unchecked` → `lifecycle::spawn_unchecked`（watcher 类）；(c) bootstrap 缓存写回扩展（load_mcp/skills/usage） |
| binary | 1.0.6 arm64 SHA `aa3ee8a3…`；prev 1.0.5 SHA `16fce96e…` |
| 主证据源 | `aimami-1.0.6-fullchain-20260523/logic/DELTA-LOGIC-106.md`（60 命令分支级）+ `CROSS-VERSION-REGISTRATION-EVOLUTION.md` §4 |
| 覆盖 | Ghidra 60/60 decompiled（0 misses）；call-trees 60/60 gate pass；frontend-cf 95 rows / 36 直接触发 + 24 后台；verify-106 确认 60 全为真实改动（非 codegen 噪声） |

> 四件套：**链路名 ｜ 变更类型 ｜ 具体改了什么(分支/callee/IPC/前端) ｜ 证据锚**。pseudocode 用短名，confidence 不抬升。

---

## A. NEW Commands（新增 · 优先级 1，4 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `get_image_compat`（`commands::system`，`0x100139b70`） | 新增 + 新增前端触发 | **后端新增 5 步**：`CodexPaths::resolve_codex_home`+`from_home` → `std::fs::read_to_string::inner` 读 config.toml（读失败哨兵 `&DAT_8000…` → 返回 `false`）→ 逐行扫描匹配 section 头 `[feature]`（magic `0x657275746165665b`）+ field `image_generation`（magic `0x65675f6567616d69`），值 `false` 命中即设 compat=ON（**取反语义**）→ `CoreEnvelope<bool>::ok`。**入参**：无。**前端**：rows=1 guards=0（设置/系统信息页加载读开关）。**对偶**：`set_image_compat`。 | PC `0004_…get_image_compat_5756c6source archive.c`；DELTA-LOGIC-106 §NEW；演进表 §4「净增 2」；leaf=response_serialize；**high** |
| `set_image_compat`（`commands::system`，`0x10013a1c4`） | 新增 + 新增前端触发 + 新增 IPC 入参 + 新增持久化点 | **后端新增 4 步**：`resolve_codex_home`+`from_home` → `read_to_string::inner`（缺失则空起步）→ 逐行定位 `[feature]`/`image_generation` 按入参 `param_2` 重写 field 行 → **`std::fs::write::inner` 全量写回 config.toml**（持久化点）；写失败 `<io::Error as Display>::fmt`+`format_inner(s_config_toml…)` → err。**入参**：新增 `param_2: uint`。**IPC**：`CoreEnvelope<bool>` ok(回显)/err(io)。**前端**：rows=1 guards=0 trig=`useMutation.mutationFn`（开关 toggle，**无 confirm 守卫**）。 | PC `0005_…set_image_compat_72a0790a.c`；DELTA-LOGIC-106 §NEW；leaf=response_serialize（中途 persistence_commit at `fs::write`）；**high** |
| `get_relay_active`（`commands::relay`，`0x10029ae88`） | 新增 | **后端新增**：`RelayManager::get_active`（读各 IDE 当前激活提供方 `RelayActiveByIde`）→ 2×`__rust_alloc` 构造 "ok"/"Success" 状态字面量 → `*param_1=2`（ok discriminant）+ payload + status。**入参**：无。**持久化**：纯内存读 manager 快照，无文件 IO。**IPC**：`CoreEnvelope<RelayActiveByIde>`。**前端**：无 CCF row（internal — relay 页 hook / tray 内部读，事件/hook 拉取模式）。 | PC `0031_…get_relay_active_27dd5bd4.c`；DELTA-LOGIC-106 §NEW；leaf=response_serialize；**high**（前端 internal 已记录） |
| `get_relay_proxy_status`（`commands::relay`，`0x10029d09c`） | 新增 | **后端新增**：`RelayManager::compose_proxy_status(state[0x10])`（组装代理运行/端口/活动连接态，payload 比 get_relay_active 丰富，占 `param_1[9..0x12]`）→ 2×alloc "ok"/"Success" → `*param_1=2`+丰富 payload。**入参**：`param_2`=state/Repository 指针（`*(param_2+0x10)`=RelayManager 句柄）。**持久化**：纯内存读代理态快照，**不实际探测网络**。**IPC**：`CoreEnvelope<RelayProxyStatus>`。**前端**：无 CCF row（internal — relay 页轮询/hook）。 | PC `0039_…get_relay_proxy_sta_f4fd824f.c`；DELTA-LOGIC-106 §NEW；leaf=response_serialize；**high** |

---

## B. MODIFIED body+calltree（改 body + 改调用图 · 优先级 2，32 条）

> 这 32 条既改函数体（body-fp 变）又改调用结构（callee-diff 非空），verify-106 已确认非噪声。

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `run_daemon_once`（`0x100138998`） | 改 callee | callee **added** `Repository::auto_switch_config`（1.0.6 新增 auto-switch 配置读取，决定是否轮换）；removed 旧 `Repository::*` 路径。链：auto_switch_config → load_local_state_synced → enrich_accounts_via_api → select_rotation_candidate → sync_local_runtime_state + sync_auto_switch_request(persist) → persist_progressive_state(persist) → build_daemon_payload。**前端**：无（daemon tick）。 | PC `0002_…run_daemon_once_00c12ab7.c`；8 edges leaf=persistence_commit；**high** |
| `force_kill_codex`（`0x100139a04`） | 改 body+callee（模式 a） | added `CoreEnvelope<T>::ok` 内联；removed alloc-shim 间接层。链：`platform::process::force_kill_all_codex_processes`（SIGKILL 级强杀）→ ok。**前端**：rows=1 guards=0 trig=mutationFn（强杀按钮，**无 confirm 守卫**——破坏性直发）。 | PC `0003_…force_kill_codex…c`；2 edges leaf=response_serialize；**high** |
| `reset_codex_config`（`0x10013af34`） | 改 body+callee（模式 a） | added `CoreEnvelope<T>::ok` 内联。链：`RelayManager::snapshot`（reset 时保留 relay 块）→ `resolve_codex_home`+`from_home` → `std::fs::write::inner`（重写 config.toml 恢复默认 + 注入 relay 块）→ ok。**持久化**：写 config.toml。**前端**：rows=1 guards=0 trig=mutationFn（重置按钮，无 confirm 守卫）。 | PC `…reset_codex_config…c`；5 edges leaf=response_serialize；**high** |
| `load_bootstrap_state`（`0x10013b1c0`） | 改 body（模式 a） | added `CoreEnvelope<T>::ok`。链：`core::bootstrap_cache::load` → ok。**持久化**：纯读 bootstrap_cache。**前端**：rows=1 guards=0（启动期加载）。 | PC `…load_bootstrap_state…c`；2 edges leaf=response_serialize；**high** |
| `start_usage_refresh_watcher`（`0x10013d820`） | 改 callee（模式 b） | `Builder::spawn_unchecked` → **`std::thread::lifecycle::spawn_unchecked`**（std 线程 API 升级）。链：`StateManager::try_get` → `get_usage_refresh_interval`+`usage_refresh_interval_seconds` → `SystemTime::now`/`duration_since` → `Context::clone` → lifecycle::spawn_unchecked（起后台用量刷新线程）。**前端**：无（background watcher）。 | PC `…start_usage_refresh_watcher…c`；7 edges leaf=sidecar_dispatch；**high** |
| `begin_add_account_attach_monitor`（`0x10013dff8`） | 改 callee（模式 b） | `Builder::spawn_unchecked` → `lifecycle::spawn_unchecked`。链：`Repository::load_snapshot_local` → lifecycle::spawn_unchecked（起账号添加监视线程）。**前端**：rows=1 trig=mutationFn（添加账号流程）。 | PC `…begin_add_account…c`；2 edges leaf=sidecar_dispatch；**high** |
| `start_auto_switch_pending_watcher`（`0x10013e68c`） | 改 callee（模式 b） | `Builder::spawn_unchecked` → `lifecycle::spawn_unchecked`。链：`Context::clone` → lifecycle::spawn_unchecked（起 auto-switch 待确认监视线程）。**前端**：无（background watcher）。 | PC `…start_auto_switch_pending_watcher…c`；2 edges leaf=sidecar_dispatch；**high** |
| `load_quota_history`（`0x100145104`） | 改 body+callee（模式 a） | added `CoreEnvelope<T>::ok`；removed alloc-shim。链：`CodexPaths::clone` → `core::quota_history::load_history` → ok。**持久化**：读 quota history 文件。**前端**：rows=1 guards=0（analytics 页加载）。 | PC `…load_quota_history…c`；3 edges leaf=response_serialize；**high** |
| `load_tool_analytics`（`0x1001454d0`） | 改 body+callee（模式 a） | added `CoreEnvelope<T>::ok`；removed alloc-shim（ok 包内联化）。链：`CodexPaths::clone` → `core::session_analytics::compute_tool_analytics`（从 session JSONL 算）→ ok。**仅模式 a，无 bootstrap 写回**。**前端**：rows=1 guards=0（analytics tab）。 | PC entry `0x1001454d0`；3 edges leaf=response_serialize；**high** |
| `load_token_analytics`（`0x100145874`） | 改 body+callee（模式 a） | 同 `load_tool_analytics` 同构，callee=`compute_token_analytics`。仅模式 a。**前端**：rows=1 guards=0。 | PC entry `0x100145874`；3 edges leaf=response_serialize；**high** |
| `load_session_analytics`（`0x1001464a8`） | 改 body+callee（模式 a） | 同构，callee=`compute_session_analytics`。仅模式 a。**前端**：rows=1 guards=0。 | PC entry `0x1001464a8`；3 edges leaf=response_serialize；**high** |
| `load_change_analytics`（`0x100146104`） | 改 body+callee（模式 a） | 同构，callee=`compute_change_analytics`。仅模式 a。**前端**：rows=1 guards=0。 | PC entry `0x100146104`；3 edges leaf=response_serialize；**high** |
| `load_usage_analytics`（`0x100145source archive4`） | 改 body+callee（模式 a+c） | added `CoreEnvelope<T>::ok` + **新增 callee `Repository::store_bootstrap_usage_analytics`**（用量分析结果写回 bootstrap 缓存加速下次启动）。链：`CodexPaths::clone` → `core::analytics::compute_usage_analytics` → **store_bootstrap_usage_analytics(persist)** → ok。**对照 1.0.5**：1.0.5 无此 bootstrap 写回边。**前端**：rows=3 guards=0。 | PC entry `0x100145source archive4`；4 edges leaf=response_serialize；**high** |
| `load_mcp_servers`（`0x100299240`） | 改 body+callee（模式 c） | added alloc-shim + **`Repository::store_bootstrap_mcp_servers`**（bootstrap 缓存写回 MCP 列表）。链：`core::mcp::load_mcp_servers`（读 config.toml MCP 块）→ `SystemTime::now`/`duration_since` → store_bootstrap_mcp_servers(persist)。**持久化**：读 config.toml + 写 bootstrap MCP 缓存。**前端**：rows=2 guards=0。 | PC entry `0x100299240`；4 edges leaf=persistence_commit；**high** |
| `remove_mcp_server`（`0x10029973c`） | 改 body+callee | added alloc-shim + drop_in_place（Vec 增长路径）。链：`core::mcp::remove_mcp_server`（删 config.toml MCP 条目）→ `core::mcp::load_mcp_servers`（重读返回最新）。**持久化**：写 config.toml。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029973c`；2 edges leaf=response_serialize；**high** |
| `load_installed_skills`（`0x10029f01c`） | 改 body+callee（模式 c） | added alloc-shim + **`Repository::store_bootstrap_installed_skills`**（bootstrap 写回技能列表）。链：`core::skills::load_installed_skills` → `SystemTime` → store_bootstrap_installed_skills(persist)。**持久化**：读 `~/.codex/skills/` + 写 bootstrap 技能缓存。**前端**：rows=2 guards=0。 | PC entry `0x10029f01c`；4 edges leaf=persistence_commit；**high** |
| `import_skill`（`0x10029da0c`） | 改 body+callee | added alloc-shim + drop_in_place（Vec/String 增长）。链：`core::skills::import_skill`（解压/拷贝到 `~/.codex/skills/`，**路径穿越防线**）。**前端**：rows=1 guards=1 trig=mutationFn（一处校验）。 | PC entry `0x10029da0c`；1 edge leaf=response_serialize；**high** |
| `remove_skill`（`0x10029de58`） | 改 body+callee | added alloc-shim + drop_in_place。链：`core::skills::remove_skill`（删技能目录含备份）。**持久化**：写 `~/.codex/skills/`。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029de58`；1 edge leaf=response_serialize；**high** |
| `delete_skill_backup`（`0x10029e7d0`） | 改 body+callee | added alloc-shim + drop_in_place。链：`core::skills::delete_skill_backup`。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029e7d0`；1 edge；**high** |
| `restore_skill_backup`（`0x10029ebc8`） | 改 body+callee | added alloc-shim + drop_in_place。链：`core::skills::restore_skill_backup`（从备份恢复）。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029ebc8`；1 edge；**high** |
| `load_skill_backups`（`0x10029e2fc`） | 改 body+callee | added alloc-shim + drop_in_place。链：`core::skills::load_skill_backups` + `SystemTime`（枚举备份）。**前端**：rows=1 guards=0。 | PC entry `0x10029e2fc`；3 edges；**high** |
| `delete_relay_provider`（`0x10029b754`） | 改 body+callee | added alloc-shim；removed `core::*` 旧路径（relay IO 路径重写）。链：`RelayManager::delete`（删 relay 提供方 + 回写 config.toml）。**持久化**：写 config.toml relay 块。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029b754`；1 edge；**high** |
| `export_relay_config`（`0x10029b218`） | 改 body+callee | added alloc-shim；removed 旧路径。链：`RelayManager::snapshot` → `core::relay::io::export_to_file`。**持久化**：导出 relay 配置到文件。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029b218`；2 edges；**high** |
| `import_relay_config`（`0x10029b4bc`） | 改 body+callee | added alloc-shim；removed 旧路径。链：`RelayManager::import_config`（从文件导入 relay 配置）。**持久化**：写 config.toml relay 块。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029b4bc`；1 edge；**high** |
| `diagnose_codex_router`（`0x10029b9c8`） | 改 body+callee | added `Pattern::is_contained_in` + panic_in_cleanup（字符串包含检查路径）。链：`RelayManager::snapshot`+`RelayState::clone` → `codex_config_stale_reason` → `resolve_codex_home`+`from_home`+`read_to_string::inner`（读 config.toml）→ `has_router_thread_migration`（检测 router 线程迁移）→ `codex_writer::user_top_level_profile`。**持久化**：读 config.toml；诊断结果可能写回。**前端**：rows=1 **guards=2**（诊断前 2 处校验）。 | PC entry `0x10029b9c8`；8 edges leaf=persistence_commit；**high** |
| `fix_codex_router_issue`（`0x10029c9bc`） | 改 callee | **removed** `CoreEnvelope<T>::ok`（错误返回路径调整）。链：`resolve_codex_home`+`from_home` → `RelayManager::snapshot` → `codex_diagnostic::fix_all`+`fix_issue`（写回 config）→ `platform::process::is_process_running`+`stop_codex_app_gracefully`（修复需重启 codex）。**持久化/进程**：写 config.toml + 停止 codex。**前端**：rows=2 guards=0。 | PC entry `0x10029c9bc`；7 edges leaf=none(depth≥5)；**high** |
| `run_codex_router_diagnostics`（`0x10029d890`） | 改 body+callee | added alloc-shim/dealloc（诊断结果集合构造）。链：`resolve_codex_home`+`from_home` → `RelayManager::snapshot` → `codex_diagnostic::run_diagnostics`（全套 router 诊断）。**持久化**：读 config.toml。**前端**：rows=3 guards=0。 | PC entry `0x10029d890`；4 edges leaf=response_serialize；**high** |
| `get_plugin_config`（`0x1003a31e0`） | 改 body+callee（模式 a） | added `CoreEnvelope<T>::ok`；removed alloc-shim。链：`PluginRegistry::get_config` → ok。**持久化**：读插件注册表配置。**前端**：无 CCF row（internal — 插件页 hook 内部读）。 | PC entry `0x1003a31e0`；2 edges leaf=response_serialize；**high** |
| `handle_tray_menu_event`（`0x1005dd41c`） | 改 callee | added drop_in_place<CoreError>/MutexGuard（错误处理 + 锁路径）。链：`Context::clone`+`StateManager::try_get` → `RelayManager::snapshot`+`RelayState::clone` → `load_local_state_synced` → `hotspot::focus_main_window`/`MessageDialogBuilder::show`/`Dialog::message`（菜单项行为分支）→ `send_user_message`（派发窗口事件）。**前端**：无（native tray 菜单事件，OS 触发）。 | PC entry `0x1005dd41c`；9 edges leaf=sidecar_dispatch；**high** |
| `create_hotspot_window`（`0x1005db220`） | 改 callee | added drop_in_place<Webview>/WebviewBuilder（窗口构造路径）。链：`Manager::get_webview_window`（查现有）→ `WebviewWindowBuilder::new`+`WindowBuilder::{title,inner_size,position,with_webview}` → `apply_native_hotspot_properties`+`set_window_alpha`。**进程**：创建原生 webview 窗口。**前端**：无（由 set_hotspot_enabled/hotspot_ready 内部调）。 | PC entry `0x1005db220`；10 edges leaf=sidecar_dispatch；**high** |
| `schedule_hotspot_relayout`（`0x1005dbd90`） | 改 callee（模式 b） | added thread Drop/Arc drop_slow（线程生命周期路径）。链：`Context::clone` → `std::thread::lifecycle::spawn_unchecked`（派发重新布局线程）。**前端**：无（hotspot 内部）。 | PC entry `0x1005dbd90`；2 edges leaf=sidecar_dispatch；**high** |
| `set_hotspot_enabled`（`0x1005dac98`） | 改 callee | added drop_in_place<MutexGuard<RuntimeAuthority>>（IPC authority 锁路径）。链：`Repository::load_settings` → `Manager::get_webview_window`+`create_hotspot_window`（启用时创建）→ `Repository::save_settings`(persist 写 hotspot 开关)。**持久化**：写 settings。**前端**：rows=1 trig=mutationFn。 | PC entry `0x1005dac98`；4 edges leaf=persistence_commit；**high** |
| `switch_account_and_restart_sync`（`0x1001436c4`） | 改 callee | added drop_in_place<Vec<String>>/models（回滚/警告集合）。链：`capture_switch_rollback_state`（捕获回滚态）→ `switch_account_sync`（写 auth.json）→ `relaunch_codex_after_success`（重启 codex）→ `refresh_full_runtime_snapshot` → `append_switch_warning`（如 RUNTIME_REFRESH_FAILED_AFTER_SWITCH）。**持久化/进程**：写 auth.json + 重启 codex。**前端**：无 CCF row（由账号页切换流程经其它命令链触发；internal）。 | PC entry `0x1001436c4`；5 edges leaf=none(depth≥5)；**high** |

---

## C. MODIFIED body only（仅改 body · 优先级 3，24 条）

> 这 24 条仅函数体变（body-fp 变），callee 结构不变或仅 codegen 噪声（drop/alloc 重排）。verify-106 确认体变为真，**但非调用图变**——故与 B 段严格分开。

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `get_system_info`（`0x100138448`） | 改 body | 体变（codegen 级）；callee 图不变。链：`std::process::Command::output`（执行系统命令）→ `from_utf8`+`trim_matches`（解析输出）。**IPC**：`CoreEnvelope<SystemInfo>`。**前端**：rows=1 guards=0。 | PC entry `0x100138448`；3 edges leaf=external_call_recorded；**high** |
| `confirm_pending_auto_switch`（`0x10013c72c`） | 改 body | 体变。链：`Repository::confirm_pending_auto_switch`。**前端**：rows=1 guards=0。 | PC entry `0x10013c72c`；1 edge leaf=response_serialize；**high** |
| `confirm_pending_auto_switch_and_restart_sync`（`0x10013f1c4`） | 改 body | 体变。链：`StateManager::try_get` → `Repository::confirm_pending_auto_switch`（确认 + 触发重启同步）。**前端**：无（background，由确认流程内部链）。 | PC entry `0x10013f1c4`；2 edges leaf=response_serialize；**high** |
| `load_api_request_context_from_repo`（`0x10013ea80`） | 改 body | 体变。链：`StateManager::try_get` → `core::auth::load_auth_file`（读 auth.json）→ `make_api_request_context`。**凭据**：读 auth.json sensitive-field（仅本机）。**前端**：无（internal）。 | PC entry `0x10013ea80`；3 edges leaf=response_serialize；**high** |
| `broadcast_runtime_snapshot`（`0x1001410dc`） | 改 body | added drop_in_place<MutexGuard<HashMap>>（事件监听表锁）。链：`CoreSnapshotPayload::clone` → `SystemTime::now`/`duration_since` → `tauri::Emitter::emit`（广播运行态快照事件）。**前端**：无（emit 事件源，前端是监听方）。 | PC entry `0x1001410dc`；4 edges leaf=response_serialize；**high** |
| `load_full_runtime_snapshot`（`0x100141448`） | 改 body | added drop_in_place<ApiDiagnostics>（drop glue 调整，callee 图不变）。链：`load_local_state_synced` → `enrich_accounts_via_api` → `persist_progressive_state` → `make_status_payload_with_service_state` → `store_bootstrap_snapshot_progressive` → `CoreEnvelope::ok_with_warnings`。**持久化**：写 progressive + bootstrap snapshot（同 1.0.5，无新增写回点）。**前端**：无（snapshot 编排，internal）。 | PC entry `0x100141448`；6 edges leaf=response_serialize；**high** |
| `load_usage_only_runtime_snapshot`（`0x100143fb0`） | 改 body | added drop_in_place<ApiDiagnostics>。链：同 `load_full_runtime_snapshot` 但 enrich 用 `enrich_active_account_usage_via_api`（仅活动账号用量）。**持久化**：写 progressive + bootstrap。**前端**：无。 | PC entry `0x100143fb0`；6 edges leaf=response_serialize；**high** |
| `refresh_full_runtime_snapshot`（`0x1001434fc`） | 改 body | removed panic_in_cleanup。链：`StateManager::try_get` → `load_full_runtime_snapshot` → `broadcast_runtime_snapshot`（刷新 + 广播）。**前端**：无（internal）。 | PC entry `0x1001434fc`；3 edges leaf=response_serialize；**high** |
| `refresh_usage_snapshot_with_retry`（`0x1001449fc`） | 改 body | removed panic_in_cleanup。链：`StateManager::try_get` → `resolve_cached_auto_switch_service_state` → `load_usage_only_runtime_snapshot` → `broadcast_runtime_snapshot` → `std::thread::sleep`（失败重试退避）。**前端**：无。 | PC entry `0x1001449fc`；5 edges leaf=none(depth≥5)；**high** |
| `resolve_cached_auto_switch_service_state`（`0x100144d68`） | 改 body | added drop_in_place<InstalledSkillSummary>。链：`StateManager::try_get` → `core::bootstrap_cache::load`（读缓存的 auto-switch 服务态）。**前端**：无（internal）。 | PC entry `0x100144d68`；2 edges leaf=response_serialize；**high** |
| `upsert_mcp_server`（`0x100299dbc`） | 改 body | added drop_in_place<RelayActiveByIde>。链：`core::mcp::upsert_mcp_server`（写 config.toml MCP 块）→ `load_mcp_servers`（重读）→ ok。**持久化**：写 config.toml。**前端**：rows=1 trig=mutationFn。 | PC entry `0x100299dbc`；3 edges leaf=response_serialize；**high** |
| `set_mcp_server_enabled`（`0x10029a834`） | 改 body | added drop_in_place<MutexGuard<Repository>>。链：`core::mcp::set_mcp_server_enabled`（改启用标志）→ `load_mcp_servers` → ok。**持久化**：写 config.toml。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029a834`；3 edges leaf=response_serialize；**high** |
| `load_relay_state`（`0x10029afa8`） | 改 body | 体变。链：`RelayManager::ensure_proxy_started`（确保代理启动）→ `RelayManager::snapshot` → `RelayState::clone` → ok。**前端**：rows=1 guards=0。 | PC entry `0x10029afa8`；4 edges leaf=response_serialize；**high** |
| `upsert_relay_provider`（`0x10029c7d4`） | 改 body | 体变。链：`RelayManager::upsert`（新增/更新 relay 提供方 + 写 config）→ ok。**持久化**：写 config.toml relay 块。**前端**：rows=1 trig=mutationFn。 | PC entry `0x10029c7d4`；2 edges leaf=response_serialize；**high** |
| `toggle_plugin`（`0x1003a2f0c`） | 改 body | 体变。链：`PluginRegistry::set_enabled`（切换插件启用）→ ok。**持久化**：写插件注册表。**前端**：rows=1 trig=mutationFn。 | PC entry `0x1003a2f0c`；2 edges leaf=response_serialize；**high** |
| `update_plugin_config`（`0x1003a32e8`） | 改 body | 体变。链：`PluginRegistry::update_settings`（更新插件设置）→ ok。**持久化**：写插件注册表。**前端**：无（internal）。 | PC entry `0x1003a32e8`；2 edges leaf=response_serialize；**high** |
| `hotspot_ready`（`0x1005da650`） | 改 body | added drop_in_place<Webview>/Window。链：`Manager::get_webview_window` → `apply_native_hotspot_properties` → `set_window_alpha`（hotspot 窗口就绪初始化）。**前端**：rows=1 **guards=1**。 | PC entry `0x1005da650`；3 edges leaf=response_serialize；**high** |
| `set_window_alpha`（`0x1005da72c`） | 改 body | 体变。链：`WryWindowDispatcher::window_handle` → `expect_failed`（设窗口透明度，经原生句柄）。**前端**：无（internal，hotspot 调用）。 | PC entry `0x1005da72c`；2 edges leaf=response_serialize；**high** |
| `get_hotspot_enabled`（`0x1005daa9c`） | 改 body | added drop_in_place<MutexGuard<RuntimeAuthority>>。链：`Repository::load_settings`（读 hotspot 开关）。**前端**：rows=1 guards=0。 | PC entry `0x1005daa9c`；1 edge leaf=response_serialize；**high** |
| `apply_native_hotspot_properties`（`0x1005dc190`） | 改 body | 体变。链：`WryWindowDispatcher::window_handle` → `platform::screen::compute_hotspot_frame`（计算 hotspot 屏幕位置）。**前端**：无（internal）。 | PC entry `0x1005dc190`；3 edges leaf=response_serialize；**high** |
| `register_hotspot_relayout_observers`（`0x1005dc85c`） | 改 body | 体变。链：`Context::clone` → `tauri_runtime_wry::send_user_message`（注册 relayout 观察者）。**前端**：无（internal）。 | PC entry `0x1005dc85c`；2 edges leaf=sidecar_dispatch；**high** |
| `create_bootstrap_tray_menu`（`0x1005de42c`） | 改 body | added MenuBuilder drop。链：`MenuItem::with_id` → `MenuBuilder::{separator,item,build}`（构造启动期 tray 菜单）。**前端**：无（native tray）。 | PC entry `0x1005de42c`；4 edges leaf=response_serialize；**high** |
| `create_tray_menu_from_snapshot`（`0x1005df5c0`） | 改 body | added MenuBuilder drop。链：`MenuItem::with_id` → `MenuBuilder::separator` → `CheckMenuItem::with_id`（含勾选项）→ `MenuBuilder::{item,build}`（从快照构造 tray 菜单）。**前端**：无（native tray）。 | PC entry `0x1005df5c0`；5 edges leaf=none(depth≥5)；**high** |

---

## D. 退役链路（不在 60 delta，演进表 §4 补，3 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `list_plugins` | 退役 | 1.0.4→1.0.5 唯一 added（105 的 120 − list_plugins = 104 的 119），**1.0.6 又删**（plugins 模块 1.0.6 收缩）。属「1.0.5 新增→1.0.6 移除」桶。1.0.6 注册集不再含此命令。 | 演进表 §1（1.0.5 新增→1.0.6 移除桶=3）+ §4「list_plugins：104→105 加，105→106 删」；DELTA-LOGIC-105 §NEW（1.0.5 时的 added 链路：`PluginRegistry::list`） |
| `custom_instructions_entry_enabled` | 退役 | `->bool` feature-flag 命令，fin-105 计入、1.0.6 收缩去除。属「105→106 移除 3」。 | 演进表 §4「105→106 移除 3：list_plugins + custom_instructions_entry_enabled + recharge_entry_enabled」 |
| `recharge_entry_enabled` | 退役 | 同上，`->bool` feature-flag，1.0.6 收缩去除。 | 演进表 §4「105→106 移除 3」 |

---

## D2. hop 04 全链路状态表（1.0.6 全注册数 122）

> 命令×状态，覆盖 1.0.6 注册集（122）。状态枚举：**NEW**（4，§A）/ **MODIFIED-body+calltree**（32，§B）/ **MODIFIED-body**（24，§C）/ **unchanged-direct（本版直证-未变）**（62，1.0.6 binary 直证、body-fp 与 1.0.5 一致即逻辑未变）/ **retired**（3，§D，从 1.0.5 移除，不在 1.0.6 的 122 内）。
>
> **口径（lead 裁定 / opus-audit 查实）**：「未变」≠「没逆/继承前版」——这 62 条的 raw 是**本版（1.0.6）直证**（每条 `.c` 全 `status:decompiled`、SHA 对齐 1.0.6 binary `aa3ee8a3…`），body-fp 与 1.0.5 一致 = 逻辑未变。证据锚指向**本版** `fullchain-106-direct/pseudocode/<cmd>.c`，不写「继承 1.0.5」。

| 状态 | 计数 | 命令清单（或聚合说明） |
|---|---|---|
| NEW | 4 | `get_image_compat` `set_image_compat` `get_relay_active` `get_relay_proxy_status` |
| MODIFIED-body+calltree | 32 | §B 全 32 条（run_daemon_once / force_kill_codex / reset_codex_config / load_bootstrap_state / start_usage_refresh_watcher / begin_add_account_attach_monitor / start_auto_switch_pending_watcher / load_quota_history / load_tool/sensitive-field/session/change/usage_analytics / load_mcp_servers / remove_mcp_server / load_installed_skills / import/remove/delete/restore/load_skill_backup(s) / delete/export/import_relay_config / diagnose/fix/run_codex_router_diagnostics / get_plugin_config / handle_tray_menu_event / create_hotspot_window / schedule_hotspot_relayout / set_hotspot_enabled / switch_account_and_restart_sync） |
| MODIFIED-body | 24 | §C 全 24 条（get_system_info / confirm_pending_auto_switch(+_restart_sync) / load_api_request_context_from_repo / broadcast_runtime_snapshot / load_full/usage_only_runtime_snapshot / refresh_full_runtime_snapshot / refresh_usage_snapshot_with_retry / resolve_cached_auto_switch_service_state / upsert_mcp_server / set_mcp_server_enabled / load_relay_state / upsert_relay_provider / toggle_plugin / update_plugin_config / hotspot_ready / set_window_alpha / get_hotspot_enabled / apply_native_hotspot_properties / register_hotspot_relayout_observers / create_bootstrap_tray_menu / create_tray_menu_from_snapshot） |
| unchanged-direct（本版直证-未变） | 62 | **1.0.6 binary 直证**（每条 `.c` status:decompiled、SHA 对齐 1.0.6），body-fp 与 1.0.5 一致 = 逻辑未变（account 导入导出族 / session 族 / settings 族 / 其余 system 命令 / stable-19 中存活部分等）；证据锚 `fullchain-106-direct/pseudocode/<cmd>.c`；`command-status.tsv`(105-106-fixed) safe-skip 桶 + REGISTRATION-TABLE-106 |
| retired | 3 | `list_plugins`（1.0.5 加→1.0.6 删）+ `custom_instructions_entry_enabled` + `recharge_entry_enabled`（`->bool` flag，1.0.6 收缩去除）—— 不在 1.0.6 的 122 内 |
| **1.0.6 合计** | **122** | NEW 4 + MODIFIED 56(32+24) + unchanged-direct 62 = 122（演进表口径 §6 基准 122） |

**对账**：1.0.5(121) − 3 retired + 4 NEW = 122（演进表 §0「1.0.5 → 1.0.6 +image_compat/relay get 等，−list_plugins」+ §4「105→106 移除 3、净增 2 + relay get 2」）。56 modified 的体改部分属「1.0.5 已注册→1.0.6 改」，仍计入 122。

---

## E. hop 04 诚实小结

- **delta 层严格分桶**：NEW(4) / body+calltree(32) / body-only(24) 不混列。同 analytics 类逐命令区分——只有 `load_usage_analytics`/`load_mcp_servers`/`load_installed_skills` 加了 bootstrap 写回（模式 c），`load_tool/sensitive-field/session/change_analytics` 只有 ok 包内联（模式 a）。
- **三大 delta 模式**已逐命令标注归属，未一刀切。
- **前端触发分布**：36 命令有直接 JSX/hook 触发链，24 为后台/native（watcher/hotspot/tray/snapshot/emit），逐条标 internal。
- **退役**用演进表口径（list_plugins + 2 个 `->bool` flag），不与 60 delta 混。
- **client-only 边界**：本 hop 全部为客户端 binary 行为，无服务端主张。
