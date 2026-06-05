# WIN-FRONTEND-CCF DISTILLED — AiMaMi 1.0.9 windows-x64 dim1 收口

**Session**: <audit-session>

**Scope**: 消费侧 dim1 闭合判定 — 用第一方 win-PE 前端 CCF dump（field `win-frontend-ccf-extract`, INDEX line 1462）把 win 后端 28 命令面里"卡在 dim1=frontend_lane_gap / not_closed_windows"的命令做 dim1 收口；判定哪些升 readyToImplement、哪些停 strictImplementationUse、哪些真 unclosed。

**Owner-gate**: gate-report `windows-owner-closeout-gate-report.json` 既有 owner = `<audit-session> (<workstation>)。本轮**不覆盖** canonical leaf 结论 —— 只**追加** `dim1_win_first_party_ccf` 平行字段（既有 `dim1_shared_ccf_link` 保持不变），反映本机 lane 自产证据，属消费侧结论更新。WIN-FRONTEND-CCF DISTILLED = 首写（无碰撞）。REVERSE-STATUS / INDEX = append-only。

---

## 1. 证据来源（全第一方 win，零外推，零逆向痕迹）

| artifact | 路径（source archive 绝对） | 量 | 校验 |
|---|---|---|---|
| win ipc-contracts | `raw/aimami/1.0.9/windows-x64/frontend/tauri-dumped/frontend/ipc-contracts.jsonl` | 127 unique cmd | grounded 复核 |
| win frontend CCF | `raw/aimami/1.0.9/windows-x64/frontend/tauri-dumped/frontend/frontend-control-flow.jsonl` | 97 rows / 79 unique cmd / 45 JSX trigger / 15 guard | grounded 复核 |
| win api-map | `raw/aimami/1.0.9/windows-x64/frontend/tauri-dumped/frontend/api-map.json` | wrapper→{cmd,argKeys} | grounded |
| 抽取出处 | `raw/aimami/1.0.9/windows-x64/frontend/EXTRACTION-PROVENANCE.json` | — | grounded |

**抽取关键事实**：`AiMaM 1.0.9 win64.exe` 是 Tauri 单文件 PE32+（base 0x140000000，SHA a5822387fa3f），**不是 NSIS**。前端资产嵌 PE `.rdata`，用 tauri-dumper 直接对安装包 PE 本体 dump（7zz 只得 PE section，无 NSIS overlay）。无需 IDA（frontend lane）。

**diff vs mac 127**：win == mac（同一 React/Vite build）—— 30/30 JS+CSS 字节级 SHA256 一致；命令集合 127/127 共有（0 win-only / 0 mac-only）；argKeys 0 处不一致；index.html 仅 CRLF/LF 行尾差。**因此 win 前端 invoke 清单是第一方 win 证据（从 win PE 本体 dump），不是 mac 外推。**

---

## 2. dim1 闭合判定（28 win 后端命令面）

### 2.1 升级机制总结（核心结论）

- **dim1 从"声明"→"字节证据"**：之前 `<audit-session> **mac thin 抽的 shared bundle**（127 cmd, SHA aa52b5）"声明式"给 13 个命令闭 dim1。本轮用 **win-PE 本体直接 dump**（字节级证明 win==mac bundle）把那 13 条依据从"声明"坐实成第一方 win 证据。
- **dim1 闭了 ≠ 升 readyToImplement**：这些命令 dims 2-5 早已闭，dim1 现在真闭，但 **readyToImplement 还要 dim6（source archive acceptance/test mapping）**。dim6 是 source archive 实现侧的活，不在逆向范围（GATE-SPEC §DIM1-6 明确 dim6 = source archive 实现侧验收）。dim1 闭后这些命令统一停 **strictImplementationUse**。
- **唯一 tier 升级点**：relay 的 3 个 HTTP-terminal 命令，dim1 是它们声明的最后一道门（dim2-6 全闭，HTTP-terminal 天花板已 lift），本轮 dim1 用真 win CCF 闭 → 应升 **readyToImplement**。

### 2.2 逐命令 dim1 收口表

| 命令 (owner / ipc) | 之前 dim1 状态 | win ipc-contracts | win CCF 触发链 | dim1 闭合判定 | tier 变化 |
|---|---|---|---|---|---|
| get_system_info | 已闭(1-6) | YES | YES `$x()heartbeat` | 早已闭 | **已是 readyToImplement** |
| apply_codex_state_handler (upsert_mcp_server) | 已闭(1-6) | YES | YES | 早已闭 | **已是 readyToImplement** |
| get_hotspot_enabled | closed | YES | YES | 已闭 | 停 strict（dim6 缺，source archive 侧） |
| set_usage_refresh_interval | api_ts_211 | YES | YES | 已闭 | 停 strict（dim6 缺） |
| dismiss_pending_auto_switch | native_callback | YES | YES | 已闭 | 停 strict（dim6 缺） |
| diagnose_codex_router | ipc_string_in_body | YES | YES | win CCF 闭 | 停 strict（dim6 缺） |
| clean | no_frontend_ccf | YES `wrapper=clean` | invoke(无JSX) | **win CCF 闭 (invoke wrapper)** | 停 strict（dim6 缺） |
| rebuild_registry | no_frontend_ccf | YES `rebuildRegistry` | invoke | **win CCF 闭** | 停 strict（dim6 缺） |
| run_daemon_once | no_frontend_ccf | YES `runDaemonOnce` | invoke | **win CCF 闭** | 停 strict（dim6 缺） |
| set_hotspot_enabled | no_frontend_ccf | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| hotspot_ready | no_frontend_ccf | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| tauri_cmd_reset_codex_config_handler (reset_codex_config) | partial_ipc_string | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| focus_main_window | no_frontend_ccf | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| load_bootstrap_state | no_frontend_ccf | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| confirm_pending_auto_switch | frontend_lane_gap | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| set_api_proxy_config | rodata_va_frontend_lane_gap | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| relay_image_compat_get (get_image_compat) | command_va_frontend_lane_gap | YES | YES | **win CCF 闭** | 停 strict（dim6 缺；mac 侧 dim6 也 open=product decision） |
| relay_image_compat_set (set_image_compat) | command_va_frontend_lane_gap | YES | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| restart_codex_cmd_wrapper (restart_codex) | no_dim1_entry | YES (2 sites) | YES | **win CCF 闭** | 停 strict（dim6 缺） |
| cmd_set_theme | shared_bundle_ccf | — | — | 见 §3 theme 复核 | 停 strict |
| cmd_set_app_theme_coroutine | js_invoke_setTheme | **NO** (set_app_theme/set_theme 0 hits) | — | **dim1 依据在 win 第一方站不住** → 复核 | 停 strict |
| migrate_threads_for_router_with_scope | confirmed_via_shared_bundle | (mac shared) | — | 既有 dims1-4 | 停 strict |
| **test_relay_provider** | **not_closed_windows** | YES | **YES useMutation.mutationFn @ use-relay-providers-BNphfsn5.js wrapper=i({providerId})** | **win CCF 真闭** | **strict → readyToImplement** ✅ |
| **test_relay_draft** | **not_closed_windows** | YES | **YES useMutation.mutationFn @ use-relay-providers-BNphfsn5.js wrapper=i({input})** | **win CCF 真闭** | **strict → readyToImplement** ✅ |
| **fetch_relay_models_draft** | **not_closed_windows** | YES | **relay-page-CljGSoid.js wrapper=Le({input}) + i18n relay.form.fetchModels.failed/empty/success** | **win CCF 闭（invoke+组件+i18n；trigger onClick 未解析但 surface 坐实）** | **strict → readyToImplement** ✅（证据略弱于上两个） |
| rollback_threads_for_router | ipc_string_confirmed | **NO (0 hits)** | — | true_backend_orphan（设计无前端调用） | 停 strict（终态） |
| execute_proxy_tools | windows_binary_lane | **NO (0 hits)** | — | true_backend_orphan | 停 strict（终态） |

### 2.3 relay 3 HTTP-terminal —— 唯一应升 readyToImplement 的命令簇（详证）

relay 18 命令 tier-matrix（`audits/windows-1.0.9-relay/data/tier-matrix.json`）里，这 3 个是 18 个里唯一停 strictImplementationUse 的，且 `dim1_frontend_ccf: "not_closed_windows"`（**纯 not_closed，非 product_decision**）。三者 
ot_ready_reason` 白纸黑字：

> "dim4 now closed (cap-fill)... **Remaining ceiling to readyToImplement is dim1 frontend CCF (not_closed_windows)** — needs **real frontend UI-trigger CCF closure**, not HTTP-terminal-related; **doNotInferWindowsFromMacOS**."

即 dim2-6 全闭、HTTP-terminal 天花板已 lift（<audit-session> 2026-06-03 三者 owner body GENUINE recovered，shared HTTP core `health_check_test_provider_async_core_sys@0x140825280` 逆完），**唯一拦路 = win 前端 UI-trigger CCF，且禁用 mac CCF 顶替**。

本轮第一方 win CCF 正好给出 win UI-trigger 链：

| cmd | win CCF 证据（第一方 win-PE dump） | 强度 |
|---|---|---|
| test_relay_provider | `{trigger:{type:useMutation.mutationFn, element:hook}, terminal_call:{kind:wrapperCall, command:test_relay_provider, wrapper:i, argKeys:[providerId]}}` @ use-relay-providers-BNphfsn5.js | 最硬（明确 useMutation 触发 + argKeys） |
| test_relay_draft | `{trigger:{type:useMutation.mutationFn, element:hook}, terminal_call:{kind:wrapperCall, command:test_relay_draft, wrapper:i, argKeys:[input]}}` @ use-relay-providers-BNphfsn5.js | 最硬 |
| fetch_relay_models_draft | `{trigger:{type:null}, i18n_keys:[relay.form.fetchModels.failed/empty/success], terminal_call:{kind:wrapperCall, command:fetch_relay_models_draft, wrapper:Le, argKeys:[input]}}` @ relay-page-CljGSoid.js | 略弱（onClick trigger 未解析到，但 invoke wrapper + 组件 + 3 个错误/成功 i18n 三项齐全，UI surface 坐实） |

→ **这 3 个 dim1=not_closed_windows 现用真 win CCF 闭合，满足各自声明的"唯一升级前提"，应升 readyToImplement。** test_relay_provider / test_relay_draft 证据最硬（明确 useMutation 触发）；fetch_relay_models_draft 略弱但 invoke+组件+i18n 足够闭 dim1。

relay 另 15 个本就标 
ot_closed_windows_product_decision` / `accepted_unknown_product_decision`，已是 readyToImplement（dim1 当 product_decision 接受）；win CCF 对它们是证据加固，不改 tier。

---

## 3. theme dim1 第一方复核（发现 SoT 偏差）

gate-report 标 `cmd_set_app_theme_coroutine` dim1=`js_invoke_setTheme_confirmed`、`cmd_set_theme` dim1=`shared_bundle_ccf`。但本轮在 win 前端 dump 里 **grep `set_app_theme` / `set_theme` 均 0 hits**（win ipc-contracts 无 theme ipc string）。

**判定**：这两条 dim1 依据在 win 第一方证据里**站不住**。可能性：theme 由 source archive 自己前端处理（非 upstream invoke），或 theme 走非 snake_case ipc 名 / 动态分发（CCF 抽取器对 computed field 不可恢复）。**建议复核**，不阻断（两命令 dims 2-5 闭，停 strictImplementationUse 不受影响；dim1 标 `win_first_party_unconfirmed`）。

---

## 4. backend-orphan 第一方复核（6 个确认 win 真无前端调用）

`<audit-session> 列 6 个 true_backend_orphan，本轮用 win 第一方 ipc-contracts(127)/CCF 逐个复核确认它们确实不在 win 前端 invoke 面（grep 0 hits）：

| orphan | win ipc-contracts | 性质 |
|---|---|---|
| execute_proxy_tools | 0 hits | relay proxy 执行，windows_binary_lane 内部，无前端 invoke |
| rollback_threads_for_router | 0 hits | relay 迁移 housekeeping，内部 dispatch |
| data_store_identifiers | 0 hits | 后端 data-store 查询；内部 relay toolchain |
| data_store_remove | 0 hits | 后端 data-store housekeeping |
| append_assistant_and_tool_results | 0 hits | relay SSE dispatcher，无 IPC 绑定（dim1=not_applicable） |
| mystery_unlock | 0 hits | grants 流走 get/merge_mystery_unlock_grants；无 invoke(mystery_unlock) |

这 6 个 dim1 永远不会有前端 CCF（设计无前端调用），停 strictImplementationUse 是正确终态，win CCF 不改判定。

---

## 5. 真剩缺口

- **真 dim1 缺口（前端有 invoke、后端没逆）= 0**：win 后端 28 命令面全逆完（`<audit-session> genuine_ceiling=false / accepted_unknown=false），无 truly_undone。
- **本轮 dim1 从"声明"升"字节证据"的命令 ≈ 20 个**（13 个原 shared-ccf-link + relay 簇 + diagnose/api_proxy/image_compat/reset/bootstrap/focus 等）。
- **本轮唯一应触发 tier 升级（strict→readyToImplement）= relay 3 个 HTTP-terminal**（test_relay_provider / test_relay_draft / fetch_relay_models_draft）。
- **其余 ≈ 20 个 dim1-闭合命令仍停 strictImplementationUse**：差 dim6（source archive acceptance/test mapping），source archive 实现侧的活，逆向范围外，非 dim1 能解。
- **backend-orphan 6 个 + theme 2 条 dim1 win-unconfirmed**：终态/复核项，非 dim1 product gap。

---

## 6. verdict

**win dim1 product gap 清掉。** win 前端 CCF 第一方 dump 后：
- 之前反复标的 `dim1=frontend_lane_gap` / 
o_frontend_ccf` / 
ot_closed_windows` 这一**逆向侧 dim1 缺口已闭**（≈20 命令用第一方 win 证据闭 dim1，零外推）。
- relay 3 HTTP-terminal 这一**唯一真 dim1 product gap**（not_closed_windows，非 product_decision）已闭 → 应升 readyToImplement。
- 残余停 strictImplementationUse 的命令，卡的是 **dim6（source archive 实现侧验收）**，**不是 dim1，不是逆向 product gap**。
- backend-orphan 6 个无前端 CCF 是设计正确终态。

**逆向侧 win dim1 闭合完成。后续 win readyToImplement 的进一步推进取决于 source archive dim6 落地（实现侧），与逆向无关。**
