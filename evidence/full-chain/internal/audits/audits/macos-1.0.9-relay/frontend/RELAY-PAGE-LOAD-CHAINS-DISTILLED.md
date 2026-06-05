# Relay 中转设置页 — 前端加载链 DISTILLED

produced_by: <workstation>
session: <audit-session>
produced_at: 2026-06-03
scope: relay-page-load-chains-distilled
source_evidence:
  - <source-location>/audits/macos-1.0.9-relay/frontend/FRONTEND-FULL-CHAIN-109.md
  - <source-location>/audits/macos-1.0.9-relay/interfaces/relay-interface-map.md
  - <source-location>/audits/macos-1.0.9-relay/interfaces/AI.md
  - <source-location>/audits/macos-1.0.9-relay-core/AI.md
  - <source-location>/audits/macos-1.0.9-relay-core/frontend/FRONTEND-FULL-CHAIN-109.md
  - src/components/relay/relay-page.tsx (live source, 2605 lines, master branch)
  - src/components/relay/CLAUDE.md
  - src/main-app.tsx (route: relayModel)
authoritative: true
overwrite_policy: EXPLICIT_TAKEOVER or EXPLICIT_OVERWRITE_CANONICAL required

---

## 1. Mount Chain（路由挂载 → 组件加载）

```
src/main-app.tsx
  route field: "relayModel"
    └─ prefetch case "relayModel":
         import("@/components/relay/relay-page")   ← lazy prefetch，不挂载
    └─ render case "relayModel":
         <RelayPage />   ← lazy(() => import(...).then(m => m.RelayPage))
```

- `RelayPage` 是 `relay-page.tsx` 中唯一导出的入口组件（命名导出）。
- 路由切换到 `relayModel` 时，`main-app.tsx` 先触发 prefetch（`import()` 仅加载模块），
  再在 render 路径实例化 `<RelayPage />`。
- Tray 可通过 `tray:navigate` 事件请求 `relayModel`，触发相同的路由分支。

---

## 2. 默认加载链（`<RelayPage />` 挂载时自动触发）

### 2.1 唯一自动 invoke：`load_relay_state`

```
RelayPage 挂载
  └─ useQuery({ queryKey: ["relay-state"], staleTime: 30_000 })
       └─ queryFn: api.loadRelayState()
            └─ invoke("load_relay_state")   ← 无参数
                 → 后端: RelayStatePayload
```

**前端 DTO（response）`RelayStatePayload`：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `providers` | `RelayProvider[]` | 所有 provider（apiKey 字段已清零，不含明文） |
| `active` | `string \| null` | 遗留单 IDE 活跃 provider ID |
| `activeByIde` | `Record<string, string[]>` | 多 IDE 活跃 map，field = ide 标识（"codex"） |
| `grants` | `GrantEntry[]` | 授权条目 |
| `proxyStatus` | `ProxyStatus` | 本地代理运行状态 |
| `schemaVersion` | `u32` | relay.json schema 版本 |
| `codexRouterEnabled` | `bool` | 智能路由开关（优先）|
| `enabled` | `bool` | 遗留 relay enabled 开关（fallback） |
| `blockOfficialPassthrough` | `bool` | 官方直连是否屏蔽 |

`ProxyStatus`：`{ active: bool, port: u16, hostStr: string, portStr: string }`

**后端侧效应（`load_relay_state` 命令）：**
- proxy auto-start（若代理未运行则启动本地 HTTP 转发进程）
- relay.json atomic write（若状态为新初始化）

**错误分支：**
- proxy start IO error → `CoreEnvelope` 错误包裹返回，前端 `relayStateQuery.isError` 为真
- atomic_write fail → 同上

### 2.2 共享 queryClient cache 读取（无额外 invoke）

```
RelayPage 挂载时同步读取（不发 invoke）:
  queryClient.getQueryData(["runtime-state", "display"])
    └─ hasActiveAccountInCache() 判断当前是否有 active Codex account
         ← 用于 router enable 前置门控，数据由其他页面/查询填充
```

- field 为 `["runtime-state", "display"]`（常量 `RUNTIME_SNAPSHOT_QUERY_KEY`）
- **只读缓存，不触发 fetch**；若缓存为空，`hasActiveAccountInCache()` 返回 false

---

## 3. 用户交互触发链（invoke 顺序 + 前端 DTO）

### 3.1 Provider 增删改

#### 新建/编辑 provider — `upsert_relay_provider`

触发条件：用户点击「保存」或「保存并启用」

```
用户点击保存 / 保存并启用
  └─ upsertMutation.mutateAsync(params)
       └─ api.upsertRelayProvider({ ...params, ide: "codex" })
            └─ invoke("upsert_relay_provider", { input: UpsertRelayProviderInput })
```

**前端 DTO（args）`UpsertRelayProviderInput`：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `providerId` | `string?` | 编辑时传已有 ID；新建时省略 |
| `url` | `string` | Base URL（trim 后） |
| `transport` | `string` | `openai-chat` / `openai-responses` / `anthropic` |
| `command` | `string?` | stdio transport 命令 |
| `headers` | `string?` | 原始 JSON 字符串（不是 map；敏感值为 `"********"` 时后端忽略更新） |
| `environment` | `string?` | 环境变量 JSON |
| `sensitive-field` | `string?` | API field（空或未填时省略） |
| `blocked` | `bool?` | 是否屏蔽 |
| `enabled` | `u8` | 0=inactive / 1=active / 2=force-active |
| 
ame` | `string?` | provider 名称 |
| `ide` | `string` | 固定 `"codex"` |

**后端 response：** `RelayProvider`（288 bytes struct）

**后端侧效应：** macOS Keychain write（apiKey）、relay.json atomic write、config.toml mutation、tray refresh

**错误分支：** keychain write fail / persist IO fail / sync_codex fail / Mutex poisoned

**「保存并启用」附加链（upsert 成功后）：**

```
upsert 成功
  └─ api.activateRelayProvider(provider.id)
       └─ invoke("activate_relay_provider", { providerId, ide: "codex" })
            → CoreEnvelope<RelayState>
  成功后:
    invalidate(["relay-state"])
    api.restartCodex()   ← 仅当 router 已启用时调用（应用中转目录变更）
      失败 → warning toast，不回滚已完成 upsert/activate
```

#### 删除 provider — `delete_relay_provider`

触发条件：用户点击删除确认

```
用户确认删除
  └─ deleteMutation.mutateAsync(providerId)
       └─ api.deleteRelayProvider(providerId)
            └─ invoke("delete_relay_provider", { providerId: string })
                 → unit
  成功后:
    invalidate(["relay-state"])
    if activeIds.includes(deletedId):
      api.restartCodex()   ← 应用变更
        失败 → warning toast，不回滚删除
```

**错误分支（5 种 CoreError(9)）：**
- router migration target（该 provider 是路由迁移目标）
- sole active grant member（唯一活跃授权成员）
- provider not found
- active sessions（post-commit session guard）

#### 切换活跃状态 — `activate_relay_provider` / `deactivate_relay_provider`

触发条件：provider 行 toggle 开关

```
用户切换 toggle
  └─ toggleProviderMutation.mutateAsync({ providerId, active })
       └─ active
            ? api.activateRelayProvider(providerId)
                 → invoke("activate_relay_provider", { providerId: string })
                      → CoreEnvelope<RelayState>
            : api.deactivateRelayProvider(providerId)
                 → invoke("deactivate_relay_provider", { providerId: string })
                      → CoreEnvelope<RelayState>
  成功后:
    invalidate(["relay-state"])
    if routerEnabled:
      api.restartCodex()   ← 应用中转目录变更
```

**deactivate 错误（特殊）：**
- `CoreError(9)` message len=123 = `"Provider still active in other IDE"` → 多 IDE 冲突提示

**source archive 实现差异：** upstream 用 `RelayActiveByIde` 多 IDE tracking；source archive 当前是全局单 activation，activate/deactivate 参数仅 `providerId`（无 `ide` 字段）。

#### 切换网络模式 — `set_relay_provider_network`

触发条件：provider 行网络按钮 → 网络模式弹窗确认

```
用户打开网络弹窗 → 选择 direct/system → 点击保存
  └─ networkMutation.mutateAsync({ providerId, network })
       └─ api.setRelayProviderNetwork(providerId, network)
            └─ invoke("set_relay_provider_network", { providerId: string, network: u8 })
                 → RelayProvider (updated)
  成功后:
    invalidate(["relay-state"])
    同步更新当前编辑表单的 network 字段
```

**注意：** router enabled 时由 `lockedToast()` 拦截，不打开弹窗；取消不调 invoke。

---

### 3.2 Provider 测试

#### 已保存 provider 测试 — `test_relay_provider`

触发条件：provider 行测试按钮（`formDirty === false`）

```
用户点击行测试（已保存且无脏变更）
  └─ testMutation.mutateAsync(providerId)
       └─ api.testRelayProvider(providerId)
            └─ invoke("test_relay_provider", { providerId: string })
                 → RelayTestResult
  成功后: showRelayTestResult(response.data)
  失败后: destructive toast
```

#### 草稿测试 — `test_relay_draft`

触发条件：表单内测试按钮（`formDirty === true` 或新建模式）

```
用户点击表单测试
  └─ draftTestMutation.mutateAsync(buildDraftInput())
       └─ api.testRelayDraft(input)
            └─ invoke("test_relay_draft", { input: RelayDraftTestInput })
                 → RelayTestResult
  注意：不刷新列表，不写状态
```

**前端 DTO（args）`RelayDraftTestInput`：**

| 字段 | 类型 |
|---|---|
| `providerId` | `string?`（编辑时有值） |
| `ide` | `"codex"` |
| 
ame` | `string` |
| `baseUrl` | `string` |
| `apiKey` | `string`（可空） |
| `model` | `string` |
| `wireApi` | `RelayWireApi` |
| `extraHeaders` | `string`（原始 JSON string，不是 map） |
| 
etwork` | `RelayNetworkMode` |

**后端 `RelayTestResult` DTO（B 级置信，serde string table 来源）：**

| 字段 | 类型 |
|---|---|
| `ok` | `bool` |
| `errorMessage` | `Option<String>` |
| `modelsSample` | `Option<String>` |
| `healthScore` | `i64` |
| `latencyMs` | `i64` |

**后端侧效应：** HTTP POST /v1/messages 或 /v1/chat/completions（无状态写入）

#### 拉取模型列表 — `fetch_relay_models_draft`

触发条件：表单内点击「拉取模型」

```
用户点击拉取模型
  └─ api.fetchRelayModelsDraft({ providerId, baseUrl, apiKey, wireApi, extraHeaders, network })
       └─ invoke("fetch_relay_models_draft", { input: FetchModelsInput })
            → Vec<String> (model ID 列表)
```

**前端 DTO（args）`FetchModelsInput`：**

| 字段 | 类型 |
|---|---|
| `url` | `string` |
| `api_key` | `string` |
| `extraHeaders?` | `string` |

**后端侧效应：** HTTP GET /v1/models；无状态写入

---

### 3.3 智能路由开关

触发条件：页面顶部 Router 开关 toggle

```
用户拨动 Router 开关（requestRouterToggle(enabled)）
  ├─ enabled=true, !hasActiveCodexProvider
  │    → setProviderUnavailableOpen(true)   ← 对话框："请先添加并激活中转商"；不调 invoke
  ├─ enabled=true, !hasActiveAccountInCache(queryClient)
  │    → setNeedLoginOpen(true)             ← 对话框："请先登录"；不调 invoke
  ├─ enabled=true, 前置条件满足
  │    → setEnableConfirmOpen(true)         ← 开启确认弹窗
  │         用户确认 → performRouterToggle(true)
  └─ enabled=false
       → setDisableConfirmOpen(true)        ← 关闭确认弹窗（两个路径：关闭/重启）
            用户确认 → performRouterToggle(false, relaunch?)
```

**`performRouterToggle(enabled, relaunch)` 执行链：**

```
1. listenTauriEvent("codex-router-toggle-progress", handler)
     └─ 期间接收进度 payload，setRouterProgress() 更新 UI
2. routerMutation.mutateAsync({ enabled, relaunch })
     └─ api.setCodexRouterEnabled(enabled, relaunch)
          └─ invoke("set_codex_router_enabled", { enabled: bool, relaunch?: bool })
               → CodexRouterTogglePayload { enabled: bool, relaunch: bool }
3. 成功后（enabled=true 分支）:
     invalidate(["relay-state"])
     api.diagnoseCodexRouter()
       └─ invoke("diagnose_codex_router")
            → DiagnosticsResult
     if !diagnosticsResult.configTomlHasRouter:
       destructive toast（profile 冲突警告）
4. 成功后（两种分支）:
     success toast
     if response.data.codexLaunchError:
       warning toast（Codex 启动失败警告）
5. 失败分支:
     message.includes("CODEX_APP_RUNNING" | "CODEX_APP_QUIT_TIMEOUT" | "CODEX_WRITER_RUNNING")
       → toast "请先关闭 Codex"
     其他 → destructive toast
6. finally:
     unlisten()
     setRouterProgress(null), setRouterActionPending(null)
     setEnableConfirmOpen(false), setDisableConfirmOpen(false)
```

**`set_codex_router_enabled` 后端侧效应：**
config.toml `[router]` block write、Tauri event `codex-router-toggle-progress`、tray refresh、可选 Codex relaunch

**source archive 实现差异（已知）：**
- upstream 异步发 Tauri 进度事件；source archive 当前为同步 stop/start（无进度事件实现）

---

### 3.4 官方直连屏蔽 — `set_block_official_passthrough`

触发条件：页面内「屏蔽官方直连」开关

```
用户切换屏蔽开关
  └─ blockOfficialPassthroughMutation.mutateAsync(blocked)
       └─ api.setBlockOfficialPassthrough(blocked)
            └─ invoke("set_block_official_passthrough", { blocked: bool })
                 → unit CoreEnvelope<()>
  成功后: invalidate(["relay-state"])
```

**后端侧效应：** relay.json write（`blockedOfficialPassthrough` 字段）
**source archive 实现 gap：** source archive `commands/relay.rs` 尚无 `set_block_official_passthrough` 命令，需新增。

---

### 3.5 导入/导出

#### 导出 — `export_relay_config`

触发条件：RelayConfigMenu → 导出按钮 → 文件选择 → 确认是否含 API field

```
用户点击导出 → Tauri save dialog → 用户确认是否含 API field → 点击导出
  └─ exportMutation.mutateAsync({ includeApiKeys, filePath })
       └─ api.exportRelayConfig(includeApiKeys, filePath)
            └─ invoke("export_relay_config", { filePath: string, includeApiKeys: bool })
                 → { filePath, rewritten_to, providers_count, include_api_key }
```

**后端侧效应：** atomic file write（`.aimami-relay.json`）、可选 Keychain reads、可选 chmod 0600；**无 relay.json 改动**

#### 导入 — `import_relay_config`

触发条件：RelayConfigMenu → 导入按钮 → 文件选择

```
用户点击导入 → Tauri open dialog → 选择文件
  └─ importMutation.mutateAsync(filePath)
       └─ api.importRelayConfig(filePath)
            └─ invoke("import_relay_config", { filePath: string })
                 → { filePath, rewritten_to }
  成功后: invalidate(["relay-state"])
```

**后端侧效应：** relay.json write、可选 config.toml、tray refresh

---

### 3.6 审计日志 — `get_passthrough_audit_log`

触发条件：用户点击「查看 Passthrough 审计日志」（页面内审计 UI）

```
用户打开审计日志
  └─ api.getPassthroughAuditLog(limit?)
       └─ invoke("get_passthrough_audit_log", { limit?: u64 })
            → Vec<AuditEntry>   ← schema accepted_unknown
```

**default limit = 50**；file-not-found → `Ok([])`（不报错）
**source archive 实现 gap：** source archive `commands/relay.rs` 尚无 `get_passthrough_audit_log` 命令，需新增。

---

### 3.7 诊断与修复

#### 诊断 — `diagnose_codex_router`

触发条件：（1）router enable 成功后自动调用；（2）用户手动触发诊断（若有诊断入口）

```
invoke("diagnose_codex_router")   ← 无参数
  → DiagnosticsResult
     known fields: { configTomlHasRouter: bool, ... }
     known diag keys: auth_integrity / config_stale / config_profile_conflict /
                      db_orphan_providers / config_third_party / config_omit_syntax /
                      catalog_path_validity
```

**后端命令名称：** 后端 IDA 证据为 `run_codex_router_diagnostics`；source archive 已实现的命令名为 `diagnose_codex_router`（divergence 已知）。

#### 修复 — `fix_codex_router_issue`

触发条件：用户在诊断结果中点击修复（Maintenance DiagnosticModal 归属，不在 RelayPage 自动暴露）

```
invoke("fix_codex_router_issue", { itemId: string })
  → Vec<FixResult>
     itemId: "all" | "config_stale" | "auth_integrity" | "config_third_party" |
             "config_omit_syntax" | "db_orphan_providers" | "catalog_path_validity" |
             "config_profile_conflict"
```

---

## 4. invoke 顺序汇总（按触发时序）

| 时序 | invoke 命令 | 触发方式 | 参数摘要 | 响应 DTO |
|---|---|---|---|---|
| ① 挂载 | `load_relay_state` | 自动（useQuery） | 无 | `RelayStatePayload` |
| ② 交互 | `upsert_relay_provider` | 保存/保存并启用 | `UpsertRelayProviderInput` | `RelayProvider` |
| ③ 交互 | `activate_relay_provider` | 保存并启用 / toggle on | `{ providerId }` | `CoreEnvelope<RelayState>` |
| ③ 交互 | `deactivate_relay_provider` | toggle off | `{ providerId }` | `CoreEnvelope<RelayState>` |
| ④ 交互 | `delete_relay_provider` | 删除确认 | `{ providerId }` | `unit` |
| ⑤ 交互 | `set_relay_provider_network` | 网络弹窗确认 | `{ providerId, network }` | `RelayProvider` |
| ⑥ 交互 | `test_relay_provider` | 行测试（已保存） | `{ providerId }` | `RelayTestResult` |
| ⑥ 交互 | `test_relay_draft` | 表单/弹窗测试 | `RelayDraftTestInput` | `RelayTestResult` |
| ⑦ 交互 | `fetch_relay_models_draft` | 拉取模型 | `FetchModelsInput` | `Vec<String>` |
| ⑧ 交互 | `set_codex_router_enabled` | Router 开关确认 | `{ enabled, relaunch? }` | `CodexRouterTogglePayload` |
| ⑧ 后续 | `diagnose_codex_router` | Router enable 成功后自动 | 无 | `DiagnosticsResult` |
| ⑨ 交互 | `set_block_official_passthrough` | 屏蔽开关 | `{ blocked }` | `unit` |
| ⑩ 交互 | `export_relay_config` | 导出确认 | `{ filePath, includeApiKeys }` | export result |
| ⑩ 交互 | `import_relay_config` | 导入文件选择 | `{ filePath }` | import result |
| ⑪ 交互 | `get_passthrough_audit_log` | 审计日志入口 | `{ limit? }` | `Vec<AuditEntry>` |
| ⑫ 交互 | `fix_codex_router_issue` | 诊断修复（Maintenance） | `{ itemId }` | `Vec<FixResult>` |

---

## 5. source archive 实现 Gap / Divergence 快查

| 项目 | 类型 | 说明 |
|---|---|---|
| `set_block_official_passthrough` | **Gap** | source archive commands/relay.rs 无此命令，需新增 |
| `get_passthrough_audit_log` | **Gap** | source archive commands/relay.rs 无此命令，需新增 |
| `activate/deactivate` IDE 参数 | Divergence | upstream 多 IDE tracking，source archive 全局单 activation |
| `set_codex_router_enabled` 进度事件 | Divergence | upstream 异步进度事件，source archive 同步 stop/start |
| `export_relay_config` atomic write | Divergence | upstream atomic + chmod 0600，source archive std::fs::write |
| `run_codex_router_diagnostics` 命令名 | Divergence | source archive 实现名为 `diagnose_codex_router` |
| `fix_codex_router_issue` item_id / issue_id | Divergence | source archive 接受两个字段，upstream 只 itemId |
| `delete_relay_provider` post-commit guard | Divergence | source archive 可能未实现 session 补偿 |

---

## 6. 页面级 Tauri 事件监听

| 事件名 | 常量 | 监听时机 | 用途 |
|---|---|---|---|
| `codex-router-toggle-progress` | `ROUTER_TOGGLE_PROGRESS_EVENT` | Router toggle 执行期间 | 实时进度 label（`RouterToggleProgress` 组件） |

---

## 7. 核心 Query field 索引

| queryKey | staleTime | invoke | 触发方式 |
|---|---|---|---|
| `["relay-state"]` | 30s | `load_relay_state` | 挂载 + mutation 成功后 invalidate |
| `["runtime-state", "display"]` | （外部管理） | 无（只读缓存） | 挂载时 `hasActiveAccountInCache()` |
