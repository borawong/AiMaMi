# Hop 05 — 1.0.6 → 1.0.8 逐链路差异阶梯

**2026-05-25** · 全量 41 must-reverse（5 added + 36 modified）+ 7 退役链路

## hop 概览

| 项 | 值 |
|---|---|
| 方向 | 1.0.6（122 注册）→ 1.0.8（≈120 注册），直系继承链末端 |
| 净命令变化 | **+5 新增**（perform_switch_payload_with_restart / reveal_main_window_inner / list_plugins / get_passthrough_audit_log / set_block_official_passthrough）；**−7 退役**（6 hotspot 旧接口 + system::confirm_pending_auto_switch_and_restart_sync） |
| delta 总数 | 41 must-reverse（5 added + 16 modified-body+calltree + 15 modified-body + 5 modified-calltree） |
| 四大横切变更 | (a) `Context<T>` → `WryHandle<T>`（Tauri runtime 升级）；(b) `sanitize_for_export` 提取（relay 脱敏独立化）；(c) MCP/Skill 数据结构指针层 5→7（嵌套加深）；(d) 账号切换原子化（新 perform_switch_payload_with_restart + 大扩展 capture_switch_rollback_state） |
| binary | 1.0.8 arm64 SHA（Ghidra computed）；prev 1.0.6 arm64 SHA `aa3ee8a3cb3a2954fe1e78228fe56c84580effdb1382b64ef95f4a3b77294ea7` |
| 主证据源 | `aimami-1.0.6-1.0.8-delta-20260525/logic/DELTA-LOGIC-108.md`（41 命令分支级）+ `REGISTRATION-TABLE-108.md` |
| 覆盖 | Ghidra 41/41 decompiled（0 misses）；diff 41 个 .diff 文件；safe-skip 61 body-fp 三层确认 unchanged；Win 1.0.8 字符串+Ghidra 跨平台确认 3/5 新命令 |

> 四件套：**链路名 ｜ 变更类型 ｜ 具体改了什么(分支/callee/IPC/前端) ｜ 证据锚**。pseudocode 用短名，confidence 不抬升。

---

## 横切变更摘要（跨命令重复出现）

| 横切模式 | 受影响命令 | 说明 |
|---|---|---|
| `Context<T>` → `WryHandle<T>` clone | `schedule_full_runtime_refresh`、`refresh_hotspot_on_main`、`register_hotspot_relayout_observers`、`create_hotspot_window`、`reveal_main_window_inner` | Tauri runtime 类型名升级；calltree 变更，业务逻辑不变 |
| `sanitize_for_export` 提取 | `load_relay_state`、`diagnose_codex_router`、`handle_tray_menu_event` | 内联 RelayState clone + 手动 0xd0 步长清零 → 独立 `core::relay::storage::sanitize_for_export(...)` 调用 |
| MCP/Skill 指针层 5→7 | `load_mcp_servers`、`remove_mcp_server`（MCP）+ `load_skill_backups`、`delete_skill_backup`、`restore_skill_backup`、`load_installed_skills`、`import_skill`、`remove_skill`（skill） | `undefined8 *****pppppuVar` → `undefined8 *******pppppppuVar`；栈帧约增 `0x50` 字节；暗示 `Vec<Vec<Resource>>` 或共享 `ResourceItem<T>` 类型引入 |
| anon 哈希变化 | 全体 41 命令 | `_anon_ace2ff7f...` → `_anon_223e8a95...` 系列；编译单元合并噪声，非业务 |
| `DAT_8000000000000000` → `SUB_8000000000000000` | relay、hotspot 多处 | Ghidra 符号名变化，同地址，非业务 |

---

## A. NEW Commands（新增 · 5 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `relay::get_passthrough_audit_log`（`0x10028e174`） | 新增 + 新增 IPC 入参 | **后端**：`CodexPaths::resolve_codex_home` + `from_home` → `core::relay::passthrough_audit::read_recent_entries(result, paths, limit)` 读最近 N 条审计条目（limit 默认 50）；`param_2 bit0=1` 时使用调用者传 limit，`bit0=0` 时默认 `0x32`。**入参**：`(limit?: u32)`。**返回**：`CoreEnvelope<Vec<PassthroughAuditEntry>>`（三槽 Vec：条目/时间戳/方向）。**持久化**：只读审计文件。**Win**：字符串确认 ✅。**前端**：relay 诊断/审计面板 invoke，无 preflight guard。 | PC `0003_…relay_get_passthrough_aud_aa5f7daa.c`；DELTA-LOGIC-108 §A1；**medium**（无 1.0.6 CCF 基线交叉） |
| `relay::set_block_official_passthrough`（`0x10028e63c`） | 新增 + 新增前端触发 + 新增 IPC 入参 + 新增持久化点 | **后端**：`RelayManager::set_block_official_passthrough(result)` 设置官方 passthrough 阻断标志；结果码 `== 10` → `CoreEnvelope::ok()`；否则 `CoreError` 路径（`*param_1 = 0x8000000000000000` 哨兵）。**入参**：`(block: bool)`。**持久化**：写 relay manager 内部状态（可能持久化到 relay config 文件或内存原子量）。**Win**：字符串确认 ✅。**前端**：relay 设置面板 toggle，flag 语义明确。 | PC `0004_…relay_set_block_official_d33a2a53.c`；DELTA-LOGIC-108 §A2；**medium** |
| `plugins::list_plugins`（`0x10028e760`） | 新增（1.0.5→1.0.6 删除后复活） | **后端**：`PluginRegistry::list(result)` 枚举所有注册 plugin → `CoreEnvelope<Vec<PluginEntry>>`；无 IO 错误路径（OOM abort only）。**入参**：无。**1.0.6 对比**：1.0.6 仅有 `toggle_plugin`/`get_plugin_config`/`update_plugin_config`，无 list 接口。**Win**：字符串确认 ✅。**前端**：plugins 管理页首屏加载 query。 | PC `0005_…plugins_list_plugins_ce7598eb.c`；DELTA-LOGIC-108 §A3；REGISTRATION-TABLE-108 §plugins；**medium** |
| `accounts::perform_switch_payload_with_restart`（`0x100294668`） | 新增 + 新增前端触发 + 新增 IPC 入参 + 新增持久化点 | **后端 6 步**：① `capture_switch_rollback_state(rollback, ctx)` 捕获回滚快照（失败→err）→ ② `StateManager::try_get` + `Mutex::lock` → ③ `Repository::confirm_pending_auto_switch(rollback, repo)` 提交自动切换（fail→err）→ ④ `relaunch_codex_after_success(buf)` 重启 Codex；重启成功→ `refresh_full_runtime_snapshot`（失败追加 `append_switch_warning`）；重启失败→ `FileRestoreState::restore` ×4 回滚四文件→再尝 relaunch→收集错误→`str::join_generic_copy`→err → ⑤ 结果写 `param_1` → ⑥ `drop_in_place<SwitchRollbackState>` 释放。**入参**：`SwitchPayload`（含 AppHandle `param_2+0x88`）。**持久化**：confirm_pending + relaunch（进程控制）+ FileRestoreState ×4（失败回滚）+ refresh_runtime。**Mac-only**（Win 1.0.8 无字符串匹配）。**前端**：与 `switch_account_and_restart_sync` 协同，先 capture rollback 再 perform。 | PC `0017_…accounts_perform_switch_p_44214c87.c`；DELTA-LOGIC-108 §A4；**medium-high**（4× FileRestoreState callee 链清晰） |
| `hotspot::reveal_main_window_inner`（`0x1005bbc7c`） | 新增（closure drop_in_place 入口） | **内部函数，非直接 IPC**。由 hotspot reveal 逻辑在独立线程中调用。**分支**：① `WryHandle<T>::clone(local_e0, param_1)` → ② Arc refcount 双重增量 → ③ alloc `0xa0` 字节 closure 结构（填充 `param_2` + vtable `_anon_968a410ab3837b829baadb3733b53b49_1012`）→ ④ `tauri_runtime_wry::send_user_message(result, param_1, local_e0)` 发送 `0x1c` 类型消息到 WryHandle。**持久化**：无文件 IO，fire-and-forget。**Mac-only**。**意义**：6 个旧 hotspot 主窗口命令（见 §E 退役）统一合并到此单入口。 | PC `0038_…hotspot_reveal_main_window_acffe4cc.c`；DELTA-LOGIC-108 §A5；**medium**（closure drop_in_place 包装，语义为 reveal_main_window 线程载体） |

---

## B. MODIFIED body+calltree（改 body + 改调用图 · 16 条）

### B1. Relay 脱敏层提取（3 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `relay::load_relay_state`（`0x10028bdc8`） | 改 callee（sanitize 提取） | **核心 calltree 变更**：1.0.6 在 `RelayManager::snapshot` 后内联 `RelayState::clone` + 手动 `0xd0` 步长 26 行展开循环清零 `sensitive-field` 等敏感字段 → 1.0.8 替换为单次 `core::relay::storage::sanitize_for_export(local_298, local_170)` 调用。4 个局部变量消失（清零循环变量）。anon 哈希 + 错误字符串裁剪（噪声）。**意义**：脱敏逻辑独立为可复用函数。 | PC `0001_…relay_load_relay_state_162d848f.c`；diff 78 lines；**high** |
| `relay::diagnose_codex_router`（`0x10028c758`） | 改 callee（sanitize 提取，最大 relay 类变更） | 同 B1 模式但更长：内联清零为 4 路展开 unroll（offset 0x58/0x128/0x1f8/0x2c8）→ `sanitize_for_export(apppuStack_6e8, local_4e0)`；局部 buffer 从 `undefined1 auStack_6e8[8]` → `undefined8 ***apppuStack_6e8[2]`；净减约 9 个局部变量。 | PC `0002_…relay_diagnose_codex_rout_26c4c9de.c`；diff 700 lines；**high** |
| `tray_menu::handle_tray_menu_event`（`0x100295d04`） | 改 callee（sanitize + WryHandle，函数大幅前移） | ① `sanitize_for_export` 同 B1 模式（relay state 展示路径）；② `Context<T>::clone` → `WryHandle<T>::clone`（横切 Tauri 升级）；③ 大量局部变量类型 `long ***` → `undefined8 uStack*`（Ghidra 类型传播变化，逻辑未变）。函数地址从 `0x1005dd41c` 前移至 `0x100295d04`（周边代码重组）。 | PC `0019_…tray_menu_handle_tray_men_f64cf106.c`；diff 1303 lines；**medium**（以类型/变量重排噪声为主） |

### B2. 账号切换原子化（2 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `accounts::capture_switch_rollback_state`（`0x100290ab8`） | 改 body+calltree（最大 diff：1699 lines） | 函数体约 600 行 → 约 1134 行（近翻倍）。新增大量 `FileRestoreState::restore` 类调用和多级 rollback 分支（配合新命令 A4）；新增 `bootstrap_cache::update` 调用 ×2（`param_2[0x3c]`、`param_2[0x3d]`）——切换时同步更新 bootstrap cache；新增 `bootstrap_cache::load` 调用路径。入参类型 `long *` → `size_t *`（调用约定微调）。Ghidra 警告 `/* WARNING: Type propagation algorithm not settling */`（函数极复杂）。**意义**：1.0.8 切换回滚状态捕获做重大扩展，引入 bootstrap cache 同步和更多文件级回滚点，支撑 A4 的原子化语义。 | PC `0012_…accounts_capture_switch_r_58b848e9.c`；diff 1699 lines；**high** |
| `tray_menu::append_codex_router_section`（`0x100297690`） | 改 body+calltree | 大量 `long ***ppplVar` / `undefined8 ***pppuVar` 互换（Ghidra 推导噪声）；函数地址大幅前移表明依赖函数重组；calltree 变化反映 relay section 状态获取路径更新（local_370/360/310/2e0/2d0 等类型精化）。 | PC `0020_…tray_menu_append_codex_ro_43ab549e.c`；diff 559 lines；**medium** |

### B3. Plugin registry（2 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `plugins::get_plugin_config`（`0x10028ecf8`） | 改 callee（参数 shape 变化） | `PluginRegistry::get_config(local_a8, param_2, lVar1, param_3[2])` — 1.0.8 多出参数 `param_3[2]`（可能为 plugin version/slot 字段）；局部变量重排为主（176 line diff 声明区 shuffling）。 | PC `0007_…plugins_get_plugin_config_9775d20f.c`；diff 176 lines；**medium** |
| `analytics::load_usage_analytics`（`0x1003004b8`） | 改 callee（错误字符串裁剪） | ① anon 哈希变化；② 错误字符串裁剪：1.0.6 poisoned lock 错误拼接了额外 serde 错误文本（`"no more values in next_value_seed…serialize_value called before serialize_key"`）→ 1.0.8 截短为纯 `"poisoned lock: another task failed inside"`；③ 变量重排（`lVar3/uVar4/iVar5/uVar6` → `uVar3/iVar4/uVar5/lVar6`，等价）。意义：依赖清理。 | PC `0025_…analytics_load_usage_anal_77ce8f70.c`；diff 199 lines；**high** |

### B4. MCP/Skill 结构嵌套加深（8 条）

> 以下 8 条均为 `modified-body+calltree`，共同模式：指针层 5→7 + Ghidra 状态从 `Globals '_' overlap` → `Type propagation not settling` + 栈帧约增 `0x50` 字节。

| 链路名 | Diff | Entry 1.0.8 | 具体改了什么 |
|---|---|---|---|
| `mcp::load_mcp_servers` | 454 lines | `0x1005b7af8` | 指针层 5→7；MCP server 枚举路径增中间层（暗示 `Vec<Vec<MCP>>` 嵌套） |
| `mcp::remove_mcp_server` | 426 lines | `0x1005b7f74` | 同 load_mcp_servers 模式；MCP 查找/删除路径更新 |
| `skills::load_skill_backups` | 390 lines | `0x1005ba158` | 同模式；枚举备份 |
| `skills::delete_skill_backup` | 330 lines | `0x1005ba4b8` | 同模式；删备份 |
| `skills::restore_skill_backup` | 257 lines | `0x1005ba848` | 同模式；恢复备份 |
| `skills::load_installed_skills` | 455 lines | `0x1005ba848` | 同模式；枚举已安装 skill |
| `skills::import_skill` | （§B10，同批） | — | 同模式；解压/拷贝到 `~/.codex/skills/`（路径穿越防线仍在） |
| `skills::remove_skill` | （§B10，同批） | — | 同模式；删技能目录含备份 |

**证据锚**：PC `0026_…mcp_load_mcp_servers_0ff7dff1.c`、`0027_…mcp_remove_mcp_server_3d6443f7.c`、`0030_…7c850130.c`、`0031_…ad56b3d3.c`、`0032_…0077a9db.c`、`0033_…065939a9.c`；DELTA-LOGIC-108 §B8-B10；**medium**

### B5. Hotspot 窗口创建简化（1 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `hotspot::create_hotspot_window`（`0x1005bb614`） | 改 callee（Tauri 升级 + 窗口参数精简） | 函数规模缩减（约 500 行 → 约 300 行，删除为主）；移除 18+ 个中间局部变量（`ppuVar2/ppuVar3/puVar4/pcVar5/lVar6/pppuVar9/auVar10` 等）+ 大量 `local_16*/local_13*/local_ff*` buffer（窗口创建参数简化）；`Context<T>::clone` → `WryHandle<T>::clone`（横切升级）；calltree 路径裁剪：取消若干中间参数构建步骤，直接传紧凑参数集。 | PC `0036_…hotspot_create_hotspot_wi_22ab5146.c`；diff 719 lines（删除为主）；**medium** |

---

## C. MODIFIED body only（仅改 body · 15 条）

### C1. Plugin body 微调（2 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `plugins::toggle_plugin`（`0x10028e878`） | 改 body | `PluginRegistry::set_enabled(local_180, param_2, plVar1, sVar2, param_5)` — 1.0.8 多出 `sVar2`（size/slot 参数，可能为 plugin 包大小或 slot index）；局部变量重排，逻辑等价。 | PC `0006_…plugins_toggle_plugin_8d8e03c8.c`；diff 133 lines；**medium** |
| `plugins::update_plugin_config`（`0x10028ecf8`） | 改 body | `PluginRegistry::update_settings` 调用参数 shape 微调；局部变量重排，等价。 | diff 104 lines；**medium** |

### C2. Accounts 模块 codegen 重组（8 条）

> 以下 8 条均为 `modified-body`，共同模式：局部指针层推导噪声 + anon 哈希 `_ace2ff7f` → `_223e8a95`（codegen 噪声）+ 函数地址从 `0x1001xxxx` → `0x1002xxxx` 区间（代码段重组）。

| 链路名 | Diff | Entry 1.0.8 | 特别说明 |
|---|---|---|---|
| `accounts::broadcast_runtime_snapshot` | 207 | `0x10028f9f4` | drop_in_place<MutexGuard<HashMap>> 锁路径调整；业务（emit 快照事件）不变 |
| `accounts::load_full_runtime_snapshot` | 750 | `0x10028fdd4` | 从 `Type propagation not settling` → `Globals '_' overlap`（Ghidra 分析模式变化）；局部 buffer 从扁平数组 → 紧凑指针（codegen 重组）；业务逻辑不变 |
| `accounts::get_cached_display_snapshot` | 92 | `0x1002907c0` | 体变（噪声） |
| `accounts::refresh_full_runtime_snapshot` | 74 | `0x100292f70` | removed panic_in_cleanup（等价重组） |
| `accounts::switch_account_and_restart_sync` | 508 | `0x10029313c` | **实质语义变化**：1.0.8 将原函数的「重启+等待」逻辑提取到新命令 A4（`perform_switch_payload_with_restart`），本命令现为协调入口；保留前置 validation（账号 ID 校验、权限检查），body 因提取而缩减 |
| `accounts::load_usage_only_runtime_snapshot` | 750 | `0x100293914` | 同 load_full_runtime_snapshot 模式（codegen 重组） |
| `accounts::refresh_usage_snapshot_with_retry` | 147 | `0x100294304` | removed panic_in_cleanup；等价重组 |
| `accounts::resolve_cached_auto_switch_service_state` | 258 | `0x100295164` | added drop_in_place<InstalledSkillSummary>；等价 |

**证据锚**：DELTA-LOGIC-108 §C3-C10；**medium**（C7 switch_account_and_restart_sync 有实质语义变化）

### C3. System 1 条

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `system::confirm_pending_auto_switch`（`0x1002fc618`） | 改 body | 局部指针层 `undefined8 ***pppuVar` → `undefined8 *****pppppuVar`（+2层）；新增约 9 个局部变量（`auStack_4a0[176]`、`local_3f0/3e8/3c8/3c0/3b0/3a8/390/388` 等）暗示确认逻辑新增额外状态暂存区；`Repository::confirm_pending_auto_switch` 核心调用参数不变。 | PC `0021_…system_confirm_pending_au_be1037b2.c`；diff 296 lines；**medium** |

### C4. Hotspot body 变（4 条）

| 链路名 | Diff | Entry 1.0.8 | 具体改了什么 |
|---|---|---|---|
| `hotspot::set_window_alpha`（`0x1005bado0`） | 22 | — | anon 哈希 + `DAT_8000000000000000` → `SUB_8000000000000000`（纯噪声）；alpha 写入 WryHandle message 不变 |
| `hotspot::get_hotspot_enabled`（`0x1005bae7c`） | 74 | — | 局部变量重排 + anon 哈希；`HotspotConfig::read()` 调用保留；返回 `CoreEnvelope<bool>` 不变 |
| `hotspot::apply_native_hotspot_properties`（`0x1005bbfdc`） | 22 | — | `DAT_8000000000000000` → `SUB_8000000000000000` + anon 哈希（纯噪声）；原生 hotspot 属性写入不变 |
| `hotspot::has_notch`（`0x1005bc2c8`） | 81 | — | **错误字符串大扩展**：新增 HTTP 方法（`GET/TRACE/PUT/PATCH/OPTIONS/DELETE/CONNECT`）、`"Cannot merge two MethodRouter"s`、新 Tauri window variants（`CreateWebview/CreateWindow/InvalidWindowLabel/FailedToSendMessage/WebviewRuntimeNotInstalled`）——强证 1.0.8 引入 axum-style HTTP routing 依赖（与 relay passthrough A1/A2 的 HTTP 层一致）；vtable ptr 从匿名哈希 → 具名 `PTR_drop_in_place<…has_notch::__closure__>_101250468`（Ghidra 符号解析改善） |

**证据锚**：DELTA-LOGIC-108 §C12-C15；set_window_alpha/apply_native_hotspot_properties **high**（纯噪声）；has_notch **high**（字符串为编译时常量）

---

## D. MODIFIED calltree only（仅改调用图 · 5 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `system::start_usage_refresh_watcher`（`0x1002fd78c`） | 改 callee | panic anon 哈希地址变化（`_anon_a1da9af29d8431721a48320121980a41_723/724` → `_anon_988940cd8e1de1805f89c17a7d399f5e_629/630`）；局部变量类型推导变化（`char ***` → `undefined8 ***`，无业务影响）；watcher loop 定时器设置+StateManager+mutex lock 路径不变。 | PC `0022_…system_start_usage_refres_359a1190.c`；diff 174 lines；**high** |
| `system::schedule_full_runtime_refresh`（`0x1002fdd2c`） | 改 callee（WryHandle 升级） | **核心**：`<tauri_runtime_wry::Context<T> as Clone>::clone(local_b8, param_1)` → `<tauri_runtime_wry::WryHandle<T> as Clone>::clone(local_b8, param_1)`；`SoftwareBreakpoint` 地址重定位。业务（节流 7s 窗口 + spawn async refresh）不变。 | PC `0023_…system_schedule_full_runt_ef5183c0.c`；diff 29 lines；**high** |
| `system::start_auto_switch_pending_watcher`（`0x1002fe5f8`） | 改 callee | 同 D1，panic 字符串 anon 哈希 + 地址重定位；watcher loop（pending auto-switch 轮询）不变。 | diff 38 lines；**high** |
| `hotspot::refresh_hotspot_on_main`（`0x1005bbb40`） | 改 callee（WryHandle 升级） | `Context<T>::clone` → `WryHandle<T>::clone`；vtable ptr `_anon_89eaa321f6a2cdf39286f62521de2f95_609` → `_anon_968a410ab3837b829baadb3733b53b49_904`；`SoftwareBreakpoint` 重定位；业务（hotspot refresh → send_user_message 0x1c）不变。 | PC `0037_…hotspot_refresh_hotspot_o_498aee9b.c`；diff 38 lines；**high** |
| `hotspot::register_hotspot_relayout_observers`（`0x1005bc150`） | 改 callee（WryHandle 升级） | 同 D4 模式；vtable `_anon_89eaa321f6a2cdf39286f62521de2f95_664` → `_anon_968a410ab3837b829baadb3733b53b49_1031`；业务（安装一次性 hotspot relayout observer）不变。 | PC `0040_…hotspot_register_hotspot_e138b758.c`；diff 38 lines；**high** |

---

## E. 退役链路（7 条）

| 链路名 | 变更类型 | 具体改了什么 | 证据锚 |
|---|---|---|---|
| `hotspot::bring_main_window_force_forward` | 退役 | Mac-only；Win 1.0.1/1.0.8 均无此命令。hotspot 主窗口管理 6 接口统一撤销，以 `reveal_main_window_inner`（A5）替代。1.0.8 invoke_handler 不再注册此命令。 | REGISTRATION-TABLE-108 §REMOVED；cmd-removed.txt；**high** |
| `hotspot::focus_main_window` | 退役（平台不对称） | **Mac 侧删除；Win 1.0.1→1.0.8 仍存在**（cross-platform asymmetry）。跨平台实现须分支处理（Mac 走 reveal_main_window_inner；Win 保留此命令）。 | REGISTRATION-TABLE-108 §REMOVED；Win 1.0.8 字符串分析；**high** |
| `hotspot::force_reveal_main_window` | 退役 | Mac-only；同上，统一撤销到 reveal_main_window_inner。 | cmd-removed.txt；**high** |
| `hotspot::install_native_hotspot_observers` | 退役 | Mac-only；功能归并。 | cmd-removed.txt；**high** |
| `hotspot::reveal_main_window` | 退役 | Mac-only；直接被 reveal_main_window_inner 替代。 | cmd-removed.txt；**high** |
| `hotspot::schedule_hotspot_relayout` | 退役 | Mac-only；Tauri WryHandle 升级后移除旧接口。 | cmd-removed.txt；**high** |
| `system::confirm_pending_auto_switch_and_restart_sync` | 退役 | 逻辑迁入新命令 `accounts::perform_switch_payload_with_restart`（A4）；无 `_and_restart_sync` 后缀的 `confirm_pending_auto_switch` 保留且 body 修改（§C3）。Mac-only（Win 从无该精确名）。 | REGISTRATION-TABLE-108 §REMOVED；DELTA-LOGIC-108 §A4；**high** |

---

## F. 全链路状态表（1.0.8 ≈120 注册）

> 口径：invoke_handler bare-symbol（102）+ async-stable（≈18），共 ≈120。状态：**ADDED**（5）/ **MODIFIED-body+calltree**（16）/ **MODIFIED-body**（15）/ **MODIFIED-calltree**（5）/ **unchanged-direct**（61，safe-skip）/ **async-stable**（≈18，继承 1.0.6，无 1.0.8 直证）/ **retired**（7，不在 1.0.8 注册集内）。

| 状态 | 计数 | 命令清单（或聚合说明） |
|---|---|---|
| ADDED | 5 | `relay::get_passthrough_audit_log` `relay::set_block_official_passthrough` `plugins::list_plugins` `accounts::perform_switch_payload_with_restart` `hotspot::reveal_main_window_inner` |
| MODIFIED-body+calltree | 16 | `relay::load_relay_state` / `relay::diagnose_codex_router` / `tray_menu::handle_tray_menu_event`（sanitize 提取 3）+ `accounts::capture_switch_rollback_state` / `tray_menu::append_codex_router_section`（切换原子化 2）+ `plugins::get_plugin_config` / `analytics::load_usage_analytics`（plugin/analytics 2）+ `mcp::load_mcp_servers` / `mcp::remove_mcp_server` / `skills::load_skill_backups` / `skills::delete_skill_backup` / `skills::restore_skill_backup` / `skills::load_installed_skills` / `skills::import_skill` / `skills::remove_skill`（MCP/Skill 结构嵌套 8）+ `hotspot::create_hotspot_window`（窗口简化 1） |
| MODIFIED-body | 15 | `plugins::toggle_plugin` / `plugins::update_plugin_config`（2）+ `accounts::broadcast_runtime_snapshot` / `accounts::load_full_runtime_snapshot` / `accounts::get_cached_display_snapshot` / `accounts::refresh_full_runtime_snapshot` / `accounts::switch_account_and_restart_sync` / `accounts::load_usage_only_runtime_snapshot` / `accounts::refresh_usage_snapshot_with_retry` / `accounts::resolve_cached_auto_switch_service_state`（8）+ `system::confirm_pending_auto_switch`（1）+ `hotspot::set_window_alpha` / `hotspot::get_hotspot_enabled` / `hotspot::apply_native_hotspot_properties` / `hotspot::has_notch`（4） |
| MODIFIED-calltree | 5 | `system::start_usage_refresh_watcher` / `system::schedule_full_runtime_refresh` / `system::start_auto_switch_pending_watcher` / `hotspot::refresh_hotspot_on_main` / `hotspot::register_hotspot_relayout_observers` |
| unchanged-direct（本版直证-未变） | 61 | safe-skip 61 条（body-fp 与 1.0.6 一致，三层 delta 确认 unchanged）；accounts 3 + analytics 5 + hotspot 4 + mcp 2 + relay 11 + sessions 1 + system 29 + tray_menu 5 + sessions 1 等；证据锚 `command-status.tsv`(106-108) safe-skip 桶 + REGISTRATION-TABLE-108 §unchanged |
| async-stable（≈18，继承，无 1.0.8 直证） | ≈18 | accounts 6（`load_snapshot / refresh_usage_snapshot / remove_accounts / switch_account / switch_account_and_restart_codex / logout`）+ relay 4 + system 3 + account_io 3 + sessions 1 + platform::update 1（`check_update_installability`）；全部继承 1.0.6 证据，实现须以 1.0.6 pseudocode 为准 |
| retired | 7 | §E 全 7 条（hotspot 6 旧接口 + system::confirm_pending_auto_switch_and_restart_sync）——不在 1.0.8 的 ≈120 内 |
| **1.0.8 合计（bare-symbol）** | **102** | ADDED 5 + MODIFIED 36(16+15+5) + unchanged-direct 61 = 102（演进表口径 §5 基准 ≈120） |

**对账**：1.0.6(122) − 7 retired + 5 ADDED = 120；102 bare-symbol + ≈18 async-stable = ≈120。36 modified 均在 bare-symbol 桶内。

---

## G. hop 05 诚实小结

- **delta 严格分桶**：ADDED(5) / body+calltree(16) / body-only(15) / calltree-only(5) 不混。`switch_account_and_restart_sync`（C2）有实质语义变化（A4 提取），单独标注。
- **横切变更逐命令标注归属**：sanitize 提取（3 条）/ WryHandle 升级（5 条）/ 指针层嵌套（8 条）/ 切换原子化（3 条）已逐条标注；codegen 噪声（anon 哈希/DAT→SUB）全体存在但不列为业务变化。
- **Win 跨平台**：3/5 new 命令 Win 字符串确认（`list_plugins`/`get_passthrough_audit_log`/`set_block_official_passthrough`）；`perform_switch_payload_with_restart`/`reveal_main_window_inner` = Mac-only。`focus_main_window` 退役不对称（Mac 删/Win 保留）——跨平台实现须分支。
- **async-stable 不可外推**：≈18 条无 1.0.8 直证，实现须以 1.0.6 pseudocode 为准。
- **axum/HTTP routing 引入**：`has_notch` 错误字符串（`MethodRouter`/HTTP 动词）是 1.0.8 新依赖的跨切编译时证据，与 relay passthrough 新命令 A1/A2 一致。
- **client-only 边界**：本 hop 全部为客户端 binary 行为，无服务端主张；`set_block_official_passthrough` 的 relay manager 内部持久化形式（内存原子量 vs 文件）未完全确认（confidence medium）。

### 各类变更证据等级

| 类别 | 主证据 | 粒度 | 已知缺口 |
|---|---|---|---|
| ADDED 5 | DELTA-LOGIC-108 §A + Ghidra pseudocode（41/41 decompiled） | 分支级 | `get_passthrough_audit_log` / `set_block_official_passthrough` / `list_plugins`：confidence medium（无 1.0.6 CCF 交叉基线）；`perform_switch_payload_with_restart`：Ghidra `Type propagation not settling`（函数极复杂）|
| MODIFIED body+calltree 16 | DELTA-LOGIC-108 §B + diffs | 分支级 | MCP/Skill 嵌套层变化的具体 Rust 类型待横向对比确认；`handle_tray_menu_event` diff 以噪声为主 |
| MODIFIED body 15 | DELTA-LOGIC-108 §C | 体变级 | `switch_account_and_restart_sync` 提取语义已确认（A4 关联）；其余 accounts 批量 codegen 重组，无业务影响 |
| MODIFIED calltree 5 | DELTA-LOGIC-108 §D | callee 变更级 | 全部 high；WryHandle 升级模式清晰 |
| unchanged-direct 61 | command-status.tsv safe-skip + 三层 delta | body-fp 三层确认 | 无缺口（三层确认 unchanged = safe-skip） |
| async-stable ≈18 | 1.0.6 REGISTRATION-TABLE §async-stable | 继承 | **无 1.0.8 直证**；实现须基于 1.0.6 |
| retired 7 | cmd-removed.txt + Win 字符串 | 注册集确认 | `focus_main_window` Win 侧保留需跨平台处理 |
