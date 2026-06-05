# Hop 03 — 1.0.4 → 1.0.5 逐链路差异阶梯

**task#2 · opus-diff · 2026-05-24** · 全量 37 命令

## hop 概览

| 项 | 值 |
|---|---|
| 方向 | 1.0.4（119 注册）→ 1.0.5（120，+logout=121），直系继承链 |
| 净命令变化 | **+1 真新增**（`list_plugins`，plugins 模块）；演进表另记「1.0.4 新增→1.0.5 移除 5」（1.0.4 短暂存在的 async/中间态命令） |
| delta 总数 | 37 must-reverse（1 added + 14 modified-body+calltree + 22 modified-body） |
| 主 delta 模式 | (a) **bootstrap_cache 注入**（load_mcp/skills/usage 在成功路径附 `core::bootstrap_cache::update`）；(b) relay 前置 `ensure_proxy_started`；(c) watcher/snapshot 去抖/重试 static 引入 |
| binary | 1.0.5 arm64-pure（Mach-O arm64 via lipo -thin） |
| 主证据源 | `aimami-1.0.5-fullchain-20260523/logic/DELTA-LOGIC-105.md`（37 命令分支级）+ `STABLE-19-LOGIC.md` + 演进表 §4 |
| 覆盖 | Ghidra 37/37 decompiled；call-trees 37/37（14 手工 + 23 自动）；frontend 18 直接 + 19 事件 |

> Discriminant 编码（DELTA-LOGIC-105 文首）：`*param_1=0x8000…`=Err；`&DAT_0000000a`(10)=ok 哨兵；`*param_1=2`=ok-with-status；`*param_1=3`=snapshot 变体。持锁序幕（OnceBox+Mutex+GLOBAL_PANIC_COUNT 毒锁恢复）所有持锁命令通用，下文不逐条重复。

> 四件套：**链路名 ｜ 变更类型 ｜ 具体改了什么 ｜ 证据锚**。

---

## A. NEW Commands（新增 · 优先级 1，1 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `list_plugins`（`0x10054ed94`） | 新增 + 新增前端触发 | **plugins 模块新增列举命令**。单路：`PluginRegistry::list`（拉全量插件列表）→ 2×`__rust_alloc` 构造 "ok"(0x6b6f)/"Success" 状态字面量 → `*param_1=2`（payload 变体）+ 插件 Vec + status。alloc 失败 OOM abort（非业务错误）。**入参**：无。**IPC**：`CoreEnvelope<Vec<PluginEntry>>`。**前端**：`plugins-page-BBaMlrBp.js` rows=1 guards=0（插件页加载直接 invoke）。 | PC `0025_…list_plugins_6148010b.c`；leaf=response_serialize；**high** |

---

## B. MODIFIED body+calltree（改 body + 改调用图 · 优先级 2，14 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `load_mcp_servers`（`0x100309090`） | 改 body+callee（模式 a） | 持锁序幕 → `core::mcp::load_mcp_servers`（读 config.toml MCP 块）。成功 **【calltree 新增】**：`SystemTime::now`+`duration_since` → `CodexPaths::ensure_directories` → **`core::bootstrap_cache::update`**（1.0.4 无此调用）。**持久化**：读 config.toml + 新增 bootstrap_cache 写入 + ensure_directories 可能建目录。**前端**：`index-PNMmfNWS.js` rows=2 guards=0。 | PC `0001_…load_mcp_servers_061e3e8a.c`；leaf=persistence_commit；**high** |
| `load_installed_skills`（`0x10030bf90`） | 改 body+callee（模式 a） | 与 load_mcp_servers 镜像：`core::skills::load_installed_skills` 成功后 **【calltree 新增】** `SystemTime`+`ensure_directories`+**`bootstrap_cache::update`**。**前端**：`index-PNMmfNWS.js` rows=2 guards=0。 | PC `0008_…load_installed_ski_34a7afd0.c`；leaf=persistence_commit；**high** |
| `load_relay_state`（`0x100450e98`） | 改 callee（模式 b） | **calltree 新增** `RelayManager::ensure_proxy_started`（1.0.4 无此前置启动——读 relay 状态前先懒启动本地中转代理）→ `RelayManager::snapshot` → `RelayState::clone`（0x1a-stride 深拷）→ ok。**前端**：`use-relay-providers-CvazO0GD.js` rows=1 guards=0。 | PC `0009_…load_relay_state_c8d0bb08.c`；leaf=response_serialize；**high** |
| `diagnose_codex_router`（`0x1004516c4`） | 改 body+callee | 最重 relay 命令。链：`RelayManager::snapshot` → `RelayState::clone` → `CodexRouteDiagnostic::clone` → `codex_config_stale_reason` → `Vec::clone` → `resolve_codex_home` → `from_home` → `std::fs::read_to_string::inner`（读 codex 配置）→ `format_inner(s_profile_…)` → StrSearcher/memchr 扫 router profile 段 → `codex_writer::user_top_level_profile` → `metadata`+`from_utf8_lossy` → `codex_thread_visibility::has_router_thread_migration`。**前端**：`relay-page-cR3Sm2TY.js` rows=1 **guards=2**（preflight `if(!…config_toml_has_router) return` + `if(i){…}`）。 | PC `0012_…diagnose_codex_rout_a99723ce.c`；leaf=external_call_recorded+response_serialize；**high** |
| `run_daemon_once`（`0x100545d1c`） | 改 body+callee | 守护轮转核心。链：持锁 → `load_registry_or_empty` → `load_local_state_synced` → `enrich_accounts_via_api`（出站 HTTP 刷用量）→ `persist_progressive_state`(写盘) → `sync_local_runtime_state` → **`select_rotation_candidate`**（选轮转账号，新增）→ `sync_auto_switch_request`(写盘) → `build_daemon_payload`。**持久化/HTTP**：enrich via API + 两次写盘。**前端**：无（watcher/定时）。 | PC `0013_…run_daemon_once_460fd0d6.c`；leaf=persistence_commit×2；**high** |
| `start_usage_refresh_watcher`（`0x100549df0`） | 改 callee | 链：`StateManager::try_get` → 已运行哨兵检查（`plVar6[1]` 标志）→ **`Repository::get_usage_refresh_interval`**（新增，间隔从设置读）→ `usage_refresh_interval_seconds` → `SystemTime` → `Context::clone` → `Builder::spawn_unchecked`（起后台刷新线程）。**前端**：无（启动期）。 | PC `0016_…start_usage_refres_be9c2353.c`；leaf=sidecar_dispatch；**high** |
| `schedule_full_runtime_refresh`（`0x10054a394`） | 改 body+callee（模式 c） | **新增 7 秒去抖** `if (LAST_FULL_RUNTIME_REFRESH_REQUEST_AT < 1 || 7 < now - LAST_…)`（全局 static）→ `Context::clone` → `tauri::async_runtime::spawn_blocking` → `tokio::drop_join_handle_fast`。**前端**：无（事件驱动）。 | PC `0017_…schedule_full_runt_9ae92975.c`；leaf=sidecar_dispatch；**high** |
| `begin_add_account_attach_monitor`（`0x10054a5cc`） | 改 body+callee | 链：持锁 → `Repository::load_snapshot_local`（!=3 → 快照清理 drop 链）→ `Builder::spawn_unchecked`（起监控线程，附 snapshot）→ 错误分支 CoreError::fmt。**前端**：`accounts-page-Bij_umN3.js` rows=1 guards=0（useMutation）。 | PC `0018_…begin_add_account_31df956f.c`；leaf=sidecar_dispatch；**high** |
| `start_auto_switch_pending_watcher`（`0x10054ac94`） | 改 body+callee | 极简副作用型：`Context::clone` → `Builder::spawn_unchecked`（起 pending auto-switch 监控线程）。**前端**：无（启动期）。 | PC `0019_…start_auto_switch_555f2b27.c`；leaf=sidecar_dispatch；**high** |
| `schedule_hotspot_relayout`（`0x10054df78`） | 改 body+callee（模式 c） | 三段重复 `Context::clone` → `spawn_unchecked`（按 **RELAYOUT_VERSION** 多次 relayout 调度），每段失败有独立 abort。**前端**：无（事件驱动）。 | PC `0023_…schedule_hotspot_b3f841ea.c`；leaf=sidecar_dispatch；**medium-high** |
| `get_plugin_config`（`0x10054f15c`） | 改 body+callee | 链：`PluginRegistry::get_config(id, len)` → `local_a8[0] != 6`（6=配置存在）→ 构造 status → `*param_1=2`（payload 含 config+status）。**入参**：plugin id (ptr+len)。**前端**：无直接 invoke（插件页内部触发）。 | PC `0026_…get_plugin_config_6545c90e.c`；leaf=response_serialize；**high** |
| `load_usage_analytics`（`0x100554c28`） | 改 body+callee（模式 a） | 链：持锁 → `CodexPaths::clone` → `core::analytics::compute_usage_analytics`（==1 → Err）→ 成功 **【calltree 新增】** `ensure_directories` → **`bootstrap_cache::update`** → status → `*param_1=2`（payload 含 analytics）。**持久化**：读分析数据 + bootstrap_cache 写入。**前端**：`analytics-panel-CkSu3Snb.js` rows=3 guards=0。 | PC `0034_…load_usage_anal_b5421227.c`；leaf=persistence_commit+response_serialize；**high** |
| `handle_tray_menu_event`（`0x1005bb90c`） | 改 body+callee | 菜单 id 派发：`if (param_3<0x14)` 短 id；`param_3==9 && *param_2=="quit"` → `AppHandle::exit(0)`。否则 `StateManager::try_get` → `RelayManager::snapshot`+`RelayState::clone`（0x1a-stride）→ 按 id 长度(uVar9==4/5/6)分派 **router/profile 切换分支**（新增）→ `String::clone` 取目标 → `Context::clone` → `send_user_message`。**前端**：无（tray 原生回调）。 | PC `0036_…handle_tray_men_735ac2f3.c`；leaf=sidecar_dispatch；**high** |
| `append_codex_router_section`（`0x1005bdb5c`） | 改 body+callee | tray 菜单**新增 codex router 段**（relay snapshot 驱动）：`StateManager::try_get`（null → param_3 透传）→ `RelayManager::snapshot`+`RelayState::clone` → `MenuBuilder::separator` → 构建失败 != `0x8000…0025` 哨兵 → tauri::Error::fmt → Err；否则 `format_inner` 组菜单文案 + `MenuItem::with_id` → 二次 separator → 回写 menu。**前端**：无（tray 构建期）。 | PC `0037_…append_codex_ro_3a36efda.c`；leaf=response_serialize；**high** |

---

## C. MODIFIED body only（仅改 body · 优先级 3，22 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `upsert_mcp_server`（`0x100309ae0`） | 改 body | **transport 类型解析**（按 param_4 长度）：len==3→`sse`；len==4 且 `0x70747468`=="http"→1；len==5 且 =="stdio"→0；else→3(未知)。组 McpServer → `core::mcp::upsert_mcp_server` → `load_mcp_servers`（重读）→ ok。**持久化**：写 config.toml MCP 块。**前端**：`mcp-page-QI5Qt401.js` guards=0 argKeys=args,environment,headers。 | PC `0002_…upsert_mcp_server_88271ee7.c`；call-tree upsert→load_mcp_servers→serialize；**high** |
| `set_mcp_server_enabled`（`0x10030a544`） | 改 body | 持锁 → `set_mcp_server_enabled(name,len,enabled)` → `load_mcp_servers`（重读）→ ok（镜像 upsert「写后重读」）。**持久化**：改 config.toml enabled。**前端**：`mcp-page` guards=0 argKeys=name,enabled。 | PC `0003_…set_mcp_server_enable_71555f07.c`；**high** |
| `import_skill`（`0x10030acbc`） | 改 body | 持锁 → `core::skills::import_skill`（local_2b8!=2 → ok；否则 Err）。**持久化**：拷技能目录到 `~/.codex/`（**路径穿越防线** ROADMAP v1.1）。**前端**：`skills-page-Dxw-RW3E.js` **guards=1**（preflight `if(typeof B=="string") return`）argKeys=path。 | PC `0004_…import_skill_a4293350.c`；**high** |
| `remove_skill`（`0x10030b06c`） | 改 body | 持锁 → `core::skills::remove_skill`（!=0x8000… → ok）。**持久化**：删技能目录。**前端**：`skills-page` guards=0 argKeys=id。 | PC `0005_…remove_skill_6a33d3source archive.c`；**high** |
| `delete_skill_backup`（`0x10030b850`） | 改 body | 持锁 → `delete_skill_backup(backup根, id)`（==ok 哨兵 → 多字段回写 ok）。**持久化**：删技能备份（**路径穿越防线**）。**前端**：`skills-page` guards=0 argKeys=id。 | PC `0006_…delete_skill_backu_c1a01931.c`；**high** |
| `restore_skill_backup`（`0x10030bbd8`） | 改 body | 持锁 → `restore_skill_backup`（!=2 → ok）。**持久化**：从备份还原技能目录（**路径穿越防线**）。**前端**：`skills-page` guards=0 argKeys=id。 | PC `0007_…restore_skill_back_1b7a8ca8.c`；**high** |
| `export_relay_config`（`0x1004510f4`） | 改 body | `RelayManager::snapshot` → `core::relay::io::export_to_file`（==10 → ok）。`if(*param_3!=0)`=includeApiKeys 分支。**凭据**：includeApiKeys=false 时不导出 API field（**凭据安全**）。**前端**：`relay-page` guards=0 argKeys=filePath,includeApiKeys。 | PC `0010_…export_relay_config_64381f65.c`；**high** |
| `import_relay_config`（`0x1004512f0`） | 改 body | `RelayManager::import_config`（==ok 哨兵）→ `if(*param_4!=0)` → **`tray_menu::refresh_tray_menu`** → ok。**持久化**：写 relay 配置（智能路由 config.toml 注入，需与 MCP 块迁移和平共存）+ 刷 tray。**前端**：`relay-page` guards=0 argKeys=filePath。 | PC `0011_…import_relay_config_10d53236.c`；**high** |
| `reset_codex_config`（`0x100547360`） | 改 body | `RelayManager::snapshot` → **`if((local_3c4&1)!=0)` 路由激活检查**（激活时回写 `param_1[3]=0x46` 错误码）→ `resolve_codex_home`+`from_home` → `metadata`（检查 config.toml）→ `std::fs::write::inner`（写默认）。**持久化**：写 config.toml。**前端**：`maintenance-page-CYMU4Rdm.js` guards=0。 | PC `0014_…reset_codex_config_64025100.c`；**high** |
| `confirm_pending_auto_switch`（`0x100548cb4`） | 改 body | 持锁 → `Repository::confirm_pending_auto_switch`（==2 → Err）→ 成功 → `accounts::refresh_full_runtime_snapshot`（==3 snapshot 变体回写）。**持久化**：确认 auto-switch 写盘 + 刷快照。**前端**：`index-PNMmfNWS.js` guards=0（全局监听触发）。 | PC `0015_…confirm_pending_au_306e5a2c.c`；call-tree confirm→refresh→serialize；**high** |
| `load_api_request_context_from_repo`（`0x10054b08c`） | 改 body | 持锁 → 取 auth 路径 → `core::auth::load_auth_file`（==`0x8000000000000001` auth 缺失哨兵 → 空 ctx；否则 `make_api_request_context` → 成功 ctx）。**凭据**：读 auth.json sensitive-field（只读本机）。**前端**：无（API 调用前置）。 | PC `0020_…load_api_request_c_e1ac94b4.c`；**high** |
| `confirm_pending_auto_switch_and_restart_sync`（`0x10054b71c`） | 改 body | 带回滚重命令：`capture_switch_rollback_state`（==0x8000… → Err）→ `try_get` → 持锁 → `confirm_pending_auto_switch`（==2 → Err）→ `relaunch_codex_after_success`（重启）→ 失败 `format_inner(s_Codex_restart_failed)` + **`FileRestoreState::restore`×4**（回滚）→ 回滚失败 → 二次 relaunch + `s_Codex_recovery_failed` → `refresh_full_runtime_snapshot`(==3) → `append_switch_warning`。**持久化/进程**：写盘 + 重启 + 三级降级。**前端**：无（restart 变体，事件链）。 | PC `0021_…confirm_pending_au_4a4ec838.c`；7 edges；**high** |
| `get_hotspot_enabled`（`0x10054ce74`） | 改 body | 持锁 → `Repository::load_settings` → 读 hotspot enabled → 回写 `param_1[1]`(bool)。**持久化**：读 settings。**前端**：`settings-page-C-moWbfE.js` guards=0。 | PC `0022_…get_hotspot_enabl_f6a8677d.c`；leaf=response_serialize；**high** |
| `register_hotspot_relayout_observers`（`0x10054e94c`） | 改 body | **`if(INSTALLED==0||…)` 幂等守卫**（OnceLock 风格 static，已安装 return）→ `Context::clone` → `send_user_message`（注册观察者，==0x13 成功）。**前端**：无（启动期一次性）。 | PC `0024_…register_hotspot_99bff2e5.c`；leaf=sidecar_dispatch；**high** |
| `broadcast_runtime_snapshot`（`0x10054ff90`） | 改 body | **`DISPLAY_SNAPSHOT_CACHE` 全局缓存锁**（`DAT_1012ec0d8` mutex）→ 有效标志 → `DAT_1012ec0e8!=3`(非 snapshot 跳过)→ `CoreSnapshotPayload::clone` → `if(param_4==0xb)` → `SystemTime` → 
ote_usage_refresh_activity` → **`refresh_tray_menu_with_snapshot`**。**持久化**：读全局缓存 + 刷 tray。**前端**：无（内部广播）。 | PC `0027_…broadcast_runtim_230378b1.c`；leaf=sidecar_dispatch；**high** |
| `load_full_runtime_snapshot`（`0x100550368`） | 改 body | 账号运行时快照核心：持锁 → `load_local_state_synced`(==2 → Err `*param_1=3`)→ 取 auth → `enrich_accounts_via_api`（出站 HTTP 刷全部账号）→ 二次持锁 → `persist_progressive_state`(写盘) → `make_status_payload_with_service_state` → `store_bootstrap_snapshot_progressive`(写 bootstrap)→ `ok_with_warnings`。**持久化/HTTP**：enrich + 两次写盘。**前端**：无（由 schedule_full_runtime_refresh 驱动）。 | PC `0028_…load_full_runtim_128f51e9.c`；6 edges；**high** |
| `get_cached_display_snapshot`（`0x100550d54`） | 改 body | `DISPLAY_SNAPSHOT_CACHE` 缓存锁 → 有效标志 → `if(DAT_1012ec0e8==3)` → `*param_1=3`(命中)；否则 clone 或空 payload。**纯读缓存无 IO（最快路径，tray 用）**。**前端**：无（tray/内部读缓存）。 | PC `0029_…get_cached_displ_3ed6ffcf.c`；leaf=response_serialize；**high** |
| `switch_account_and_restart_sync`（`0x10055258c`） | 改 body | 带回滚账号切换：切换主逻辑(`local_590==2`)→ 失败 `FileRestoreState::restore`(首段)→ `s_Codex_restart_failed` → **`FileRestoreState::restore`×4**（回滚 auth/config）→ 回滚失败 `s_Rollback_failed` → 二次 restore×4 + `s_Codex_recovery_failed`。**持久化/进程**：切账号写多文件 + 重启 + 4 段回滚 + recovery（与 0021 同回滚骨架）。**前端**：无（confirm 链/事件触发）。 | PC `0030_…switch_account_a_6f759493.c`；call-tree FileRestoreState::restore→serialize；**high** |
| `load_usage_only_runtime_snapshot`（`0x100552d64`） | 改 body | 与 `load_full_runtime_snapshot` 几乎镜像，**唯一差异 enrich 步骤 = `enrich_active_account_usage_via_api`**（仅当前激活账号，非全账号）。其余链相同。**持久化/HTTP**：enrich active-only + 两次写盘。**前端**：无（snapshot 维护，轻量刷新路径）。 | PC `0031_…load_usage_only_72d32947.c`；6 edges；**high** |
| `refresh_usage_snapshot_with_retry`（`0x100553754`） | 改 body | 带重试：`try_get`（null → panic_fmt）→ 首次刷新(`local_358==3` → 返回)→ 失败 → **`std::thread::sleep(1, 200000000)`（睡 1.2 秒）**→ 二次刷新。**单次重试 + 1.2s 退避**。**前端**：无（watcher 驱动）。 | PC `0032_…refresh_usage_sn_f2714865.c`；call-tree try_get→sleep；**high** |
| `resolve_cached_auto_switch_service_state`（`0x100553ab8`） | 改 body | 先查内存缓存(`local_6a0!=3` → 命中直返)；否则 `try_get` → 持锁 → `core::bootstrap_cache::load` → `local_690==3` → 解析 service state → `return`/`return 4`(默认)。**持久化**：读 bootstrap_cache（无写）。**IPC**：裸枚举字节（非标准 envelope，轻量）。**前端**：无（内部状态查询）。 | PC `0033_…resolve_cached_a_792b9ef5.c`；leaf=response_serialize；**medium-high**（返回裸枚举字节） |
| `create_tray_menu`（`0x1005bb274`） | 改 body | `accounts::get_cached_display_snapshot`(==3 命中)→ `try_get` → 持锁 → `bootstrap_cache::load` → `if(local_6b8[0]==3)`(有 bootstrap 快照)→ **`create_bootstrap_tray_menu`**；否则降级建空菜单。**持久化**：读 display cache + bootstrap_cache（无写）。**Delta 要点**：tray 构建优先用 bootstrap 缓存快照（启动期快速渲染）。**前端**：无（tray 构建期）。 | PC `0035_…create_tray_men_7bb11caf.c`；call-tree get_cached_display_snapshot→bootstrap_cache::load→create_bootstrap_tray_menu→serialize；**high** |

---

## D. 1.0.4 短暂命令（演进表记「1.0.4 新增→1.0.5 移除 5」）

> 演进表 §1 记 1.0.4 短暂存在的 5 个 async/中间态命令在 1.0.5 被移除。DELTA-LOGIC-105 是「105 相对 104 的 must-reverse delta」（37 命令均为 105 仍存在的），**不含**这 5 个已移除命令的逐链路。本 hop 据演进表口径标「退役」，逐命令链路需回 FULL-CHAIN-104 提取（暂标证据等级 medium，待 104 链路补全）。

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| （5 个 async/中间态命令，命令名待 FULL-CHAIN-104 / evolution-matrix 逐条核） | 退役 | 1.0.4 短暂存在的 async 变体，1.0.5 收口移除（演进表「1.0.4 新增→1.0.5 移除 5」桶）。具体命令名 + 退役链路需查 `_work-xver-101/evolution-matrix.tsv` lifecycle 列。 | 演进表 §1 lifecycle 桶「1.0.4 新增→1.0.5 移除=5」；逐命令待 evolution-matrix + FULL-CHAIN-104；**medium**（未逐命令坐实，如实标注） |

---

## D2. hop 03 全链路状态表（1.0.5 全注册数 120/121）

> 命令×状态，覆盖 1.0.5 注册集（120，+logout=121）。状态枚举：**NEW**（1，§A）/ **MODIFIED-body+calltree**（14，§B）/ **MODIFIED-body**（22，§C）/ **unchanged-direct（本版直证-未变）**（64，safe-skip：本版 binary 直证、body-fp 与 1.0.4 一致即逻辑未变）/ **unchanged-direct-stable（本版直证-稳定）**（19，stable：跨版本稳定核心，本版直证）/ **retired-from-1.0.4**（5，§D 演进表「1.0.4 新增→1.0.5 移除」桶）。
>
> **口径（lead 裁定 / opus-audit 查实）**：「未变」≠「没逆/继承前版」——safe-skip/stable 的 raw 是**本版直证**（每条 `.c` 全 `status:decompiled`、SHA 对齐本版 binary），只是 body-fp 与前版一致（逻辑未变）。证据锚指向**本版** `fullchain-105-direct/pseudocode/<cmd>.c`，不写「继承前版」。

| 状态 | 计数 | 命令清单（或聚合说明） |
|---|---|---|
| NEW | 1 | `list_plugins`（§A，plugins 模块本版引入；1.0.6 又退役见 hop 04 §D） |
| MODIFIED-body+calltree | 14 | §B 全 14（load_mcp_servers / load_installed_skills / load_relay_state / diagnose_codex_router / run_daemon_once / start_usage_refresh_watcher / schedule_full_runtime_refresh / begin_add_account_attach_monitor / start_auto_switch_pending_watcher / schedule_hotspot_relayout / get_plugin_config / load_usage_analytics / handle_tray_menu_event / append_codex_router_section） |
| MODIFIED-body | 22 | §C 全 22（upsert/set_mcp_server_enabled / import/remove/delete/restore_skill(_backup) / export/import_relay_config / reset_codex_config / confirm_pending_auto_switch(+_restart_sync) / load_api_request_context_from_repo / get_hotspot_enabled / register_hotspot_relayout_observers / broadcast/load_full/load_usage_only/get_cached_display/refresh_usage_snapshot / switch_account_and_restart_sync / resolve_cached_auto_switch_service_state / create_tray_menu） |
| unchanged-direct（本版直证-未变） | 64 | safe-skip：**1.0.5 binary 直证**（每条 `.c` status:decompiled、SHA 对齐 1.0.5），body-fp 与 1.0.4 一致 = 逻辑未变（account/session/settings 等稳定部分）；证据锚 `fullchain-105-direct/pseudocode/<cmd>.c`—— 见 `command-status.tsv`(104-105-fixed) safe-skip 桶逐行；REGISTRATION-TABLE-105 §safe-skip=64 |
| unchanged-direct-stable（本版直证-稳定） | 19 | stable：17 async 双闭包稳定体（export/import_accounts / preview_account_import / switch_account / remove_accounts / load_snapshot / load_sessions …，**close-105 ghidra 本版直证 0 misses**）+ 2 内联 `->bool` flag（custom_instructions_entry_enabled / recharge_entry_enabled，FE tauriInvoke 实调坐实）—— 见 STABLE-19-LOGIC |
| retired-from-1.0.4 | 5 | 演进表 §1「1.0.4 新增→1.0.5 移除 5」桶（1.0.4 短暂 async/中间态命令）—— **逐命令名待 evolution-matrix.tsv lifecycle 列核实**（§D，medium，未逐命令坐实，不在 1.0.5 的 120 内） |
| **1.0.5 合计** | **120** | NEW 1 + MODIFIED 36(14+22) + unchanged-direct 64 + unchanged-direct-stable 19 = 120（演进表口径；+logout=121，fin-105 命令名集漏登的全程在命令） |

**对账**：演进表 §0「1.0.4(119) ──+list_plugins──▶ 1.0.5(120/121)」与本表自洽：119 条 1.0.4 已注册命令在 1.0.5 **本版重逆直证**（64 未变 + 19 稳定 + 36 modified 的体改部分都是「1.0.4 已注册、1.0.5 本版直证」，**非继承**）+ 1 NEW = 120；logout 全程在但 fin-105 命令名集漏登实算 121；另演进表记 1.0.4 短暂 5 命令在 1.0.5 移除（§D，不计入 120）。

---

## E. hop 03 诚实小结

- **delta 层严格分桶**：NEW(1) / body+calltree(14) / body-only(22)。
- **主 delta 模式 bootstrap_cache 注入**逐命令标注：load_mcp_servers / load_installed_skills / load_usage_analytics 三者成功路径新增 `bootstrap_cache::update`；其余 load 类未注入。
- **去抖/重试 static**：schedule_full_runtime_refresh 新增 `LAST_FULL_RUNTIME_REFRESH_REQUEST_AT`(7s) / refresh_usage_snapshot_with_retry 用 1.2s sleep / register_hotspot_relayout_observers 用 `INSTALLED` 幂等 static。逐条标注。
- **诚实缺口**：D 段「1.0.4 新增→1.0.5 移除 5」未逐命令坐实（DELTA-LOGIC-105 不含已移除命令），标 medium，待回 FULL-CHAIN-104 / evolution-matrix 补全；不伪装成已完成。
- **client-only 边界**：全部客户端 binary 行为，无服务端主张。
