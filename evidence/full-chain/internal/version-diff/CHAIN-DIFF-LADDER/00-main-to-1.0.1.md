# Hop 00 — 我方当前仓（main）→ 1.0.1 上游 逐链路差异阶梯

**task#2 · opus-diff · 2026-05-24** · 复刻基线对齐（前后端分支级）

## hop 概览

| 项 | 值 |
|---|---|
| 方向 | source archive 当前仓（src-tauri + src）↔ AiMaMi 1.0.1 上游真实实现 |
| 命令集对账 | 我方注册 **124**；上游 1.0.1 真实 Tauri 命令 **111**（118 IPC contracts − 7 个 UI 路由伪命令）；common **111**；ours-only **13**；theirs-only **0**（上游真实命令我方全覆盖） |
| 偏离性质 | 命令集无 gap，但**链路层有仿写偏离**：3 高优先（busy_timeout / ide 丢弃 / 响应体类型）+ 4 低优先（删除顺序 / 同步vs async / 刷新语义 / retry 词表） |
| 主证据源 | parity-freeze 包 `references-from-tmp/PARITY-AUDIT-1.0.1-vs-ours.md`（8 链路对照块 A–H + 偏离汇总）+ `reports/1.0.1/full-1.0.1-vs-current-repo-parity-gap-20260522.md`（逐命令 request-shape join 矩阵） |
| 边界 | 上游为 closed-source binary，client-only：可证 request shaping / 本地 config/proxy/sensitive-field / 本地 response 解析；**不证** provider/server 侧 model list / billing 语义。confidence 不抬升（medium/low 不升 high）。 |

> 与 02/03/04 hop 不同：本 hop 是「我方实现 vs 上游真实」的**对齐 diff**（不是版本演进 delta）。变更类型用：**仿写偏离-高 / 仿写偏离-低 / 我方多做 / 待确认 / 一致（无需改）/ ours-only（自扩展）**。
> 四件套：**链路名 ｜ 变更类型 ｜ 具体改了什么(上游链路 vs 我方链路，分支/callee/IPC/前端) ｜ 证据锚**。

---

## A. 高优先仿写偏离（可能行为不一致，需对齐 · 3 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `delete_sessions` | 仿写偏离-高（H1） | **上游**：`commands::sessions::delete_sessions`(locks repo)→ `core::sessions::delete_sessions` → `build_rollout_index` → **`open_codex_db`(read_write, **显式 busy_timeout**)** → for id: `DELETE FROM thread_spawn_edges`; `DELETE FROM threads`（**edges 先删**）→ remove_file 失败 → CoreError → payload{deletedIds}。**我方**（`core/sessions.rs:736-813`）：无 CODEX_APP_RUNNING 守卫(正确)→ 先收集 rollout_paths(canonicalize+sessions_dir 边界检查，**我方多做更安全**)→ **`open_readwrite`(无显式 busy_timeout)** → DELETE threads; DELETE thread_spawn_edges（**threads 先删，顺序相反**）→ remove_file 失败 → CoreError(已修正)→ payload{deleted_ids}。**偏离点**：① busy_timeout 缺失（竞争时直接 SQLITE_BUSY 而非等待，**用户并发删除失败率更高**）；② 删除顺序 edges/threads 相反（FK 无约束时无功能差异，低）。**前端**：上游成功后 `refetchQueries(["usage-analytics"],type:"active")`，我方 invalidate（多刷一次，低）。 | PARITY-AUDIT §E + 偏离汇总 H1/L1/L3；`reports/session-delete-deep-pseudocode-20260519.md` pc `0002`；我方 `core/sessions.rs:736-813`；**P0 修复**：`open_readwrite` 加 `conn.busy_timeout(5000ms)` |
| `activate_relay_provider` / `deactivate_relay_provider` | 仿写偏离-高（H2，待确认） | **上游 activate**：`RelayManager::activate` → 停 Codex(graceful)→ ensure 无 writer 进程 → **`migrate_threads_for_router_with_scope`**（迁移 state_5.sqlite threads.model_provider，**带 scope**）→ 注入 config.toml [provider] 块 → 启动本地代理 → 拉起 Codex(失败写 codex_launch_error warning)。**我方**（`relay.rs:147-184`）：**`let _ = ide;`（丢弃 ide 参数）**→ `prepare_codex_router_edit`(stop_codex 8s + ensure_no_writer)→ `relay::activate_provider`(migrate+inject+proxy)→ `launch_codex_after_router_edit` → `refresh_tray_menu`。`deactivate` 中 **`let _ = provider_id;`（也丢弃）**。**偏离点**：ide 参数被丢弃——若上游用 ide 区分 VSCode/Cursor 工作区限定 `migrate_threads_..._with_scope` 的 scope，我方**全量迁移/全量回滚可能误迁其它 IDE 的 session**。 | PARITY-AUDIT §D + H2；`reports/relay-restoration-implementation-20260519.md`；我方 `relay.rs:147-184`；**P1**：确认 ide 是否影响迁移 scope（查 RelayManager::activate ide 流向）；**待确认**（未坐实 ide 用途） |
| `switch_account_and_restart_codex` | 仿写偏离-高（H3） | **上游**：`switch_account_and_restart_sync`(**spawn_blocking async**)→ `capture_switch_rollback_state` → `Repository::switch_account`(写 auth.json+registry)→ `relaunch_codex_after_success` → 重启失败 → `FileRestoreState::restore` → **`CoreEnvelope<SwitchPayload>`**。**我方**（`accounts.rs:99-111`）：**同步 `pub fn`(非 async)** → `AccountManager::switch_account_and_restart_with`（内部 capture→switch→restart→on-failure restore）→ **`CoreEnvelope<AccountMutationPayload>`**。**偏离点**：① 响应体类型 SwitchPayload vs AccountMutationPayload（**字段集需核对，前端依赖的 snapshot/accounts 字段可能缺失**）；② 上游 async+spawn_blocking、我方同步（restart 阻塞场景行为等价，低）。rollback 机制已验证对齐。 | PARITY-AUDIT §A + H3/L2；`reports/account-switch-deep-pseudocode-20260519.md` pc `0071/0074/0069/0236`；我方 `accounts.rs:98-111`；**P1**：核对 SwitchPayload 字段集（accounts/affected_account_key/snapshot 嵌套） |

---

## B. 待确认偏离（证据不足，需深证 · 2 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `test_relay_provider`（relay 健康检查） | 待确认（L4） | **上游**：`spawn_blocking` → `relay::health_check::test_provider_async` → `post_openai_endpoint_async` → `interpret_response_async`（流/非流）→ **
eeds_stream_retry` 判断 → 可能重建 stream=true 请求** → **`should_retry_test` 分类 → 最多 N 次重试** → 写持久化健康状态。**我方**（`relay.rs:209-225`）：async spawn_blocking → `relay::test_provider` → 读 provider 配置 → HTTP 发送 → 解析 → 持久化测试态。**偏离点**：① stream retry 路径是否实现待核（
eeds_stream_retry` 词表："stream mode is required"/"stream must be true"/"must enable stream"/"streaming required"/"only stream"）；② retry 分类器词表完整性（`should_retry_test`："request failed"/timeout/connection 变体/"no response data"/"stream read failed"）。健康状态持久化已验证一致。 | PARITY-AUDIT §C + L4；`reports/relay-deep-pseudocode-20260519.md` pc `0001-0008`；我方 `relay.rs:209-225`；**P1**：对齐 stream retry 词表；**待确认** |
| `upsert_mcp_server`（request-shape） | 仿写偏离-高（确认 mismatch） | **上游 1.0.1 frontend evidence**：top-level `{ args, headers, environment }`（primary args=args/headers/environment）。**我方**：rust fields `input: UpsertMcpServerInput`；frontend keys `args, environment, headers, input`。**偏离点**：**confirmed request-shape mismatch**——上游平铺 args/headers/environment，我方包了一层 input。除非兼容性有意设计且已测，否则是 parity blocker。 | parity-gap §请求 shape + 逐命令 join 矩阵 `upsert_mcp_server` 行(`confirmed_request_shape_mismatch`)；**P0**：解决 envelope drift（加兼容或记为有意 current-only） |

---

## C. 我方多做 / 自扩展（ours-only · 13 条 + 兼容别名）

> 命令集 theirs-only=0，但我方有 13 个上游真实 IPC 集外的命令（均有合理来源）。变更类型=**ours-only**（复刻 1.0.1 时不必删，但需知其非 1.0.1 前端 IPC target）。

| 链路名 | 变更类型 | 具体改了什么（来源） | 证据锚 |
|---|---|---|---|
| `diagnose_codex_router` | ours-only | 上游 symbols 有符号(`0x10037c888`)但 1.0.1 IPC contracts 未见前端调用；我方暴露为独立命令。[1.0.1 内部有，前端未绑定] | PARITY-AUDIT 表1；parity-gap current-only |
| `run_codex_router_diagnostics` | ours-only（别名） | 与 diagnose_codex_router 功能等价，我方提供两个别名；上游可能只注册一个。 | PARITY-AUDIT 表1 |
| `fix_codex_router_issue` | ours-only（待确认） | 上游 IPC contracts 无、symbols 无直接证据；我方扩展。 | PARITY-AUDIT 表1 |
| `graceful_restart_for_update` | ours-only | 上游 pseudocode 有 `0097_…graceful_restart_for_update.c`、symbols 有，但 1.0.1 IPC contracts 无。[内部有，前端未绑定] | PARITY-AUDIT 表1 |
| `handle_tray_menu_event` | ours-only | 上游 symbols 有 `tray_menu::handle_tray_menu_event`、call-tree 确认；IPC contracts 无前端直接调用（托盘事件经原生回调）。[存在，调用方式不同] | PARITY-AUDIT 表1 |
| `set_tray_locale` | ours-only | 上游 IPC contracts 无；我方自扩展语言切换。 | PARITY-AUDIT 表1 |
| `hide_voice_search_overlay` | ours-only（待确认） | 上游有 `show_voice_search_overlay` 无 hide；symbols 有 voice_runtime 符号。[可能上游用事件隐藏] | PARITY-AUDIT 表1（将随 voice 退役） |
| `mark_voice_overlay_ready` | ours-only | 上游 IPC contracts 无；我方扩展 overlay 就绪握手。[将随 voice 退役] | PARITY-AUDIT 表1 |
| `open_macos_privacy_pane` | ours-only（待确认） | 上游 IPC contracts 无，但前端 voice-page.js 有对应逻辑；symbols 有 request_accessibility_permission。[可能上游嵌入 request_accessibility_permission 内] | PARITY-AUDIT 表1 |
| `list_accounts` | ours-only | 上游 symbols 确认存在；1.0.1 IPC contracts 未见单独前端调用（上游走 load_snapshot 主路径）。[内部有，前端未绑定为主路径] | PARITY-AUDIT 表1 |
| `refresh_full_runtime_snapshot` | ours-only | 上游 symbols 确认(`0070_…refresh_full_runtime_snapshot.c`)；1.0.1 IPC contracts 无前端直接调用。[内部有，前端未绑定] | PARITY-AUDIT 表1 |
| `get_or_create_remote_device_secret` | ours-only | 上游 IPC contracts 无、symbols 无；我方订阅/远程设备本地密钥扩展。 | PARITY-AUDIT 表1 |
| `import_remote_device_secret_if_empty` | ours-only | 同上，我方扩展。 | PARITY-AUDIT 表1 |
| （兼容别名：activate/deactivate/delete_relay_provider/test_relay_provider/set_relay_provider_network 接受 `id`+`providerId`+`provider_id` 三别名；switch_account 接受 accountKey+account_key；export/import 接受 camel+snake） | 我方多做 | request-shape 向后兼容（我方接受更多 field 别名），非偏离风险，记录在案。 | parity-gap 逐命令 join 矩阵 `request_shape_compatible_or_no_arg` 行 |

---

## D. surface-scope 偏差（非缺实现，是 surface map 漏算 · 2 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `load_custom_instruction_state` | 一致（surface-scope 偏差） | 我方已注册 `lib.rs:120` + API `loadCustomInstructionState`，但 current included surface 把整个 custom-instruction 模块连同 write 命令一起排除了——**是 surface-scope mismatch，非 missing implementation**。 | parity-gap §漏掉的 in-scope targets + 关键发现 2；**P0**：未来 surface map 只排除已确认 write/remove/rollback，重纳本命令 + 加 E2E mock |
| `preview_custom_instruction_apply` | 一致（surface-scope 偏差） | 同上，已注册 `lib.rs:121` + API `previewCustomInstructionApply`，nonwrite read/preview 命令被误排除。 | parity-gap §漏掉的 in-scope targets；**P0**：重纳 + E2E mock |

---

## E. 已验证一致链路（无需改 · 摘录，详见 PARITY-AUDIT §B/F/G/H）

| 链路名 | 变更类型 | 具体（已验证对齐点） | 证据锚 |
|---|---|---|---|
| `load_snapshot` | 一致 | 上游 `Repository::load_snapshot_local`(localOnly)或网络刷新路径 → `CoreEnvelope<CoreSnapshotPayload>`；我方 `commands::system::load_snapshot` 同链同响应。上游 `accounts` 伪命令实为导航 UI 路由，`load_snapshot` 才是真数据加载。 | PARITY-AUDIT §B；ipc-contracts 第 1 行 + pc `0243/0268` |
| `refresh_usage_snapshot` / `load_quota_history` | 一致 | 上游 main-app timer 60s 默认 + `start_usage_refresh_watcher` 读 interval；我方 `usage_refresh_daemon` + `run_daemon_once` CLI 入口。配额按 accountKey 精确过滤；持久化 `quota-history.jsonl` 一致。 | PARITY-AUDIT §F；`reports/quota-account-refresh-restoration-20260519.md` |
| `load_mcp_servers` / `upsert_mcp_server`(链路) | 一致 | 上游 load → `bootstrap_cache::update` + `core::mcp::load_mcp_servers`；upsert 先读后写。我方等价，持久化 `~/.codex/config.toml` MCP 块。（注：upsert 的 **request-shape** 另见 B 段 mismatch） | PARITY-AUDIT §G；`call-trees/command-core-direct.jsonl:6-9` |
| `import_skill` / `restore_skill_backup` / `delete_skill_backup` | 一致 | 上游 `core::skills::*` 按 id 删/恢复备份；我方等价，持久化 `~/.codex/skills/`。import_skill 上游收 `{path}`、我方 `src/lib/api.ts:171` 同发 `{path}`。 | PARITY-AUDIT §H；`interface-map.md` pc `0040/0287` |

---

## E2. hop 00 全链路状态表（我方 124 注册 ↔ 1.0.1 上游真实 111）

> 本 hop 是「我方实现 ↔ 上游真实」的**对齐 diff**（非版本演进），状态表用 common / ours-only / 偏离分级口径，覆盖两侧命令集。状态枚举：**偏离-高**（行为可能不一致，需对齐）/ **偏离-低/待确认**（需深证）/ **surface-scope 偏差**（非缺实现）/ **一致**（已验证对齐）/ **ours-only**（我方自扩展，上游真实 IPC 集外）/ **theirs-only**（上游有我方无）。

| 状态 | 计数 | 命令清单（或聚合说明） |
|---|---|---|
| 偏离-高（需对齐） | 3 | `delete_sessions`（busy_timeout 缺失 + 删除顺序）/ `activate_relay_provider`+`deactivate_relay_provider`（ide 参数丢弃，迁移 scope 风险）/ `switch_account_and_restart_codex`（响应体 SwitchPayload vs AccountMutationPayload 字段集）（§A） |
| 偏离-高（确认 mismatch） | 1 | `upsert_mcp_server`（request-shape：上游平铺 args/headers/environment，我方包 input 一层）（§B，P0 envelope drift） |
| 待确认偏离 | 1 | `test_relay_provider`（stream retry 词表 + retry 分类器完整性待核）（§B） |
| ours-only（自扩展） | 13 | `diagnose_codex_router` `run_codex_router_diagnostics` `fix_codex_router_issue` `graceful_restart_for_update` `handle_tray_menu_event` `set_tray_locale` `hide_voice_search_overlay` `mark_voice_overlay_ready` `open_macos_privacy_pane` `list_accounts` `refresh_full_runtime_snapshot` `get_or_create_remote_device_secret` `import_remote_device_secret_if_empty`（§C，上游真实 IPC 集外） |
| 兼容别名（我方多做） | — | activate/deactivate/delete_relay_provider/test_relay_provider/set_relay_provider_network 接受 id+providerId+provider_id 三别名；switch_account 接受 accountKey+account_key；export/import camel+snake（§C，向后兼容非偏离风险） |
| surface-scope 偏差 | 2 | `load_custom_instruction_state` `preview_custom_instruction_apply`（已注册但被 surface map 误排除——非 missing implementation，§D，P0 重纳 + E2E mock） |
| 一致（无需改） | 部分摘录 | `load_snapshot` / `refresh_usage_snapshot`+`load_quota_history` / `load_mcp_servers`(链路) / `import_skill`+`restore/delete_skill_backup`（§E；完整一致清单见 PARITY-AUDIT §B/F/G/H） |
| theirs-only（上游有我方无） | 0 | 上游真实 111 命令我方全覆盖（命令集无 gap，偏离仅在链路层） |
| **命令集口径** | 我方 124 / 上游真实 111 / common 111 / ours-only 13 / theirs-only 0 | 上游 1.0.1：118 IPC contracts − 7 UI 路由伪命令(accounts/overview/mapping/hotword/rebuild/restart/new) = 111 真实 Tauri 命令；我方 124 = 111 common + 13 ours-only。**注**：1.0.1 binary 注册集口径为 146（含 voice/CI 全盛 + helper），与此 111「上游真实前端 IPC target」是不同切片——146 是 backend invoke_handler 全集，111 是前端实际绑定的 IPC contract，差额含 voice 子系统未全在前端单独绑定 + helper（见演进表 §6 口径 reconcile）。 |

> **诚实口径分层**：本表「上游 111」是**前端 IPC contract 切片**（hop 00 对齐复刻的对象），与 hop 02/03/04 用的「1.0.1 binary 注册集 146」是不同分母——前者问「我方该实现哪些前端可调命令」，后者问「1.0.1 backend 注册了多少」。两者均如实标注，不混用。

---

## F. hop 00 诚实小结

- **命令集 vs 链路两层分开**：命令集 theirs-only=0（我方全覆盖上游真实 111），但链路层有 7 处仿写偏离（3 高 + 4 低/待确认）。不把「命令都在」当成「链路都对齐」。
- **偏离优先级如实分级**：P0(busy_timeout / upsert_mcp_server shape / custom-instruction surface-scope) / P1(ide 参数 / SwitchPayload 字段 / stream retry 词表) / P2-P3(删除顺序 / 同步vs async / 刷新语义)。
- **待确认不伪装成已坐实**：ide 参数用途、stream retry 词表完整性、fix_codex_router_issue 来源均标「待确认」。
- **我方多做也记录**：13 个 ours-only + 兼容别名，非缺口但需知非 1.0.1 IPC target。
- **client-only 边界**：上游 closed-source binary，只证 client 行为；provider/server model list / billing 仍 Unknown。confidence 不抬升。
- **7 个 UI 路由伪命令**（accounts/overview/mapping/hotword/rebuild/restart/new）= 前端 
avigate(route)` 信号，非真 IPC，不计入命令 gap。
