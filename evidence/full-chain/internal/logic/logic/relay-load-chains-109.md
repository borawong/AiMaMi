# DISTILLED: Relay (中转设置) Page Load Chains — AiMaMi 1.0.9

**session:** <audit-session>  
**machine:** <workstation>  
**produced:** 2026-06-03  
**angle:** 2+4 frontend — no IDA; pure TypeScript source read (has full source, no minified bundle needed)  
**source files:**
- `src/components/relay/relay-page.tsx` (2606 lines, authoritative)
- `src/lib/api.ts` (invoke wrapper, authoritative)
- `src/types/index.ts` (DTO shapes, authoritative)
- `src/components/relay/CLAUDE.md` (module red-lines)

**scope boundary:** relay/中转设置页 (route: `relay`) — 1.0.9 only. Excludes accounts module.

---

## Owner Matrix

| Field | Value |
|---|---|
| target | `logic/relay-load-chains-109.md` (new file) |
| canonical scope | relay frontend load chains, 1.0.9 |
| current producer | <workstation> / <audit-session> |
| INDEX row | not yet in INDEX (new document) |
| allowed write mode | authorized — no existing owner, logic/*.md allowed per AGENTS.md |
| collision status | CLEAR |
| takeover sensitive-field | N/A |

---

## 1. Mount (Default) Load Chain

On navigation to the `relay` route, `RelayPage` component mounts and fires **one** useQuery:

### 1.1 `load_relay_state`

| Attribute | Value |
|---|---|
| api wrapper | `api.loadRelayState()` |
| tauri command | `load_relay_state` |
| query field | `["relay-state"]` |
| staleTime | 30 000 ms |
| invocation | useQuery — fires on mount unconditionally |
| args | (none) |
| return type | `CoreEnvelope<RelayStatePayload>` |

**DTO — RelayStatePayload:**
```typescript
{
  schemaVersion?: number;
  providers: RelayProvider[];           // all providers across all IDEs
  activeByIde?: Record<string, string[]>; // e.g. { "codex": ["provider-id-1"] }
  proxy?: RelayProxyStatus;
  codexRouterEnabled?: boolean;
  blockOfficialPassthrough?: boolean;
  lastCodexRoute?: unknown;
  enabled: boolean;
  activeProviderId: string | null;
  proxyStatus: RelayProxyStatus;        // always present (non-optional)
  sourcePath: string;
}
```

**RelayProxyStatus** (embedded):
```typescript
{
  running: boolean;
  port: number | null;
  baseUrl?: string | null;
  codexBaseUrl: string | null;
  lastError?: string | null;
}
```

**RelayProvider** (array element):
```typescript
{
  id: string;
  ide?: RelayIde | null;       // "codex" or null (old data)
  name: string;
  baseUrl: string;
  apiKey?: string | null;      // transient, usually absent from responses
  model: string;
  wireApi: RelayWireApi;       // "openai-chat" | "openai-responses" | "anthropic"
  extraHeaders: Record<string, string>;
  network: RelayNetworkMode;   // "system" | "direct"
  apiKeyStored: boolean;
  healthScore: number | null;
  latencyMs: number | null;
  lastTestedAt: number | null;
  updatedAt: number | null;
  lastError: string | null;
  errorMessage: string | null;
  modelsSample: string[];
}
```

**Error branch:** `relayStateQuery.isError` — `ProxyStatusBadge` renders warning tone; no providers shown (empty state).  
**Loading branch:** `relayStateQuery.isPending && !state` — `ProxyStatusBadge` renders "loading" label.

**No secondary mount invoke for models-draft.** The recon hint `api.fetchRelayModelsDraft()` is NOT a mount invoke — it is user-triggered only (see §2.6 below). The recon data item `api.fetchRelayModelsDraft()` listed as `mount_invokes` in the task prompt is incorrect; the source confirms it is triggered only when user clicks the "获取模型列表" button inside `ProviderFormFields`.

**No `get_relay_active` or `get_relay_proxy_status` on mount.** These exist in `api.ts` but are not called by `RelayPage` on mount. They are available as standalone commands but not wired to any useQuery in this page.

---

## 2. User-Triggered Invoke Chains

### 2.1 Codex Router Toggle (Switch `onCheckedChange`)

**Element:** `Switch checked={routerEnabled} onCheckedChange={requestRouterToggle}`

**Guard chain:**
1. `requestRouterToggle(enabled: boolean)` called
2. If `enabled && !hasActiveCodexProvider` → opens `providerUnavailableOpen` dialog; no invoke
3. If `enabled && !hasActiveAccountInCache(queryClient)` → opens 
eedLoginOpen` dialog; no invoke  
   (reads `["runtime-state","display"]` cache — NOT `["snapshot","display"]` or `["accounts"]`)
4. If `enabled` → opens `enableConfirmOpen` dialog
5. If `!enabled` → opens `disableConfirmOpen` dialog
6. User confirms in dialog → `performRouterToggle(enabled, relaunch?)`

**Invoke:** `set_codex_router_enabled`

| Attribute | Value |
|---|---|
| api wrapper | `api.setCodexRouterEnabled(enabled: boolean, relaunch = true)` |
| tauri command | `set_codex_router_enabled` |
| args | `{ enabled: boolean, relaunch: boolean }` |
| return type | `CoreEnvelope<RelayActivationPayload>` |

**Post-invoke (enabled=true only):** after mutation success → calls `api.diagnoseCodexRouter()` to check `configTomlHasRouter`; if false, shows destructive toast about profile conflict. Failure of this secondary call is swallowed (console.warn only).

**Side-event:** listens to Tauri event `codex-router-toggle-progress` (type `RouterToggleProgressPayload`) during operation to show progress bar.

**Error codes:**  
- `CODEX_APP_RUNNING` / `CODEX_APP_QUIT_TIMEOUT` / `CODEX_WRITER_RUNNING` → special toast "请先关闭 Codex"  
- Other → generic "切换失败" toast

**RelayActivationPayload** (return DTO):
```typescript
{
  schemaVersion?: number;
  activeByIde?: Record<string, string[]>;
  proxy?: RelayProxyStatus;
  codexRouterEnabled?: boolean;
  lastCodexRoute?: unknown;
  codexLaunchError?: string | null;
  enabled: boolean;
  activeProviderId: string | null;
  proxyStatus: RelayProxyStatus;
  migration: ThreadRouterMigrationManifest;
  finalStage: RelayLifecycleStage;
  state?: RelayStatePayload;
}
```

**ThreadRouterMigrationManifest** (embedded in activation payload):
```typescript
{
  migratedCount: number;
  rolledBackCount: number;
  skippedCount: number;
  pendingCount: number;
  targetProvider: string | null;
  targetModel: string | null;
  manifestPath: string;
}
```

---

### 2.2 Save Provider (Button `onClick` → `saveProvider(enable: boolean)`)

**Guard chain:**
1. `providerSavePending` check — idempotent lock
2. `routerEnabled` → `lockedToast()`, abort
3. `headersError` (JSON validation) → destructive toast, abort
4. `flushSync(() => setProviderSavePending(true))` + double rAF paint flush

**Step A — Upsert:** `upsert_relay_provider`

| Attribute | Value |
|---|---|
| api wrapper | `api.upsertRelayProvider(params)` |
| tauri command | `upsert_relay_provider` |
| args | `{ input: RelayUpsertInput }` |
| return type | `CoreEnvelope<RelayProvider>` |

**RelayUpsertInput** (sent as `{ input: <this> }`):
```typescript
{
  id?: string | null;
  name: string;          // trimmed
  baseUrl: string;       // trimmed
  apiKey?: string | null; // trimmed; empty string sent as-is
  model: string;         // trimmed
  wireApi: RelayWireApi;
  extraHeaders: string;  // raw JSON string (NOT a map) after sensitive-header stripping
  network: RelayNetworkMode;
  ide?: RelayIde;        // always "codex" in this page
}
```

**Step B (only when `enable=true`) — Activate:** `activate_relay_provider`

| Attribute | Value |
|---|---|
| api wrapper | `api.activateRelayProvider(providerId: string, ide = "codex")` |
| tauri command | `activate_relay_provider` |
| args | `{ providerId: string, ide: string }` |
| return type | `CoreEnvelope<RelayActivationPayload>` |

**Step C (conditional restart):** if `routerEnabled && enable`, calls `api.restartCodex()` (`restart_codex`, no args). Failure logged as warning; does NOT roll back the provider change.

---

### 2.3 Toggle Provider Active State (Switch in `ProviderRow`)

**Element:** `Switch onCheckedChange={(active) => onToggle(active)}` in each provider row  
**Guard:** `routerEnabled` → `lockedToast()`, abort; `providerTogglePendingId === provider.id` → idempotent lock

**Activate path:** `activate_relay_provider`  
**Deactivate path:** `deactivate_relay_provider`

| Attribute | Value |
|---|---|
| api wrapper (deactivate) | `api.deactivateRelayProvider(providerId: string, ide = "codex")` |
| tauri command | `deactivate_relay_provider` |
| args | `{ providerId: string, ide: string }` |
| return type | `CoreEnvelope<RelayActivationPayload>` |

Post-mutation: if `routerEnabled`, calls `api.restartCodex()` (same fallback pattern as §2.2).

---

### 2.4 Delete Provider (Trash button + AlertDialog confirm)

**Guard:** `routerEnabled` → `lockedToast()`; `deleteBusy` idempotent lock; confirmation dialog required

**Invoke:** `delete_relay_provider`

| Attribute | Value |
|---|---|
| api wrapper | `api.deleteRelayProvider(providerId: string)` |
| tauri command | `delete_relay_provider` |
| args | `{ providerId: string }` |
| return type | `CoreEnvelope<RelayStatePayload>` |

Post-delete: if deleted provider was active (`activeIds.includes(providerId)`), calls `api.restartCodex()`.

---

### 2.5 Test Provider (Stored or Draft)

**Test stored:** `test_relay_provider` — used when `editingProvider && !formDirty` in form context, or when test button clicked from `ProviderRow`.

| Attribute | Value |
|---|---|
| api wrapper | `api.testRelayProvider(providerId: string)` |
| tauri command | `test_relay_provider` |
| args | `{ providerId: string }` |
| return type | `CoreEnvelope<RelayTestResult>` |

**Test draft:** `test_relay_draft` — used when form is dirty or no existing provider, or from Dialog's test button.

| Attribute | Value |
|---|---|
| api wrapper | `api.testRelayDraft(input: RelayDraftTestInput)` |
| tauri command | `test_relay_draft` |
| args | `{ input: RelayDraftTestInput }` |
| return type | `CoreEnvelope<RelayTestResult>` |

**RelayDraftTestInput:**
```typescript
{
  providerId?: string | null;
  name: string;
  baseUrl: string;
  apiKey?: string | null;
  model: string;
  wireApi: RelayWireApi;
  extraHeaders: string;    // raw JSON string
  network: RelayNetworkMode;
  ide?: RelayIde;
}
```

**RelayTestResult:**
```typescript
{
  ok: boolean;
  health: RelayHealth;     // "ok" | "highLatency" | "unreachable" | "misConfigured" | "unknown"
  latencyMs: number;
  statusCode: number | null;
  message: string;
  modelsSample: string[];
}
```

Both test paths enforce 600ms minimum busy state via `keepRelayBusyFor(startedAt)`.

---

### 2.6 Fetch Model List (Button in `ProviderFormFields`)

**Not a mount invoke.** User-triggered only — clicking the model-fetch button in the provider form.

**Guard:** `!form.baseUrl.trim()` → no-op; `fetchingModels` → idempotent lock

| Attribute | Value |
|---|---|
| api wrapper | `api.fetchRelayModelsDraft(input: RelayFetchModelsInput)` |
| tauri command | `fetch_relay_models_draft` |
| args | `{ input: RelayFetchModelsInput }` |
| return type | `CoreEnvelope<string[]>` |

**RelayFetchModelsInput:**
```typescript
{
  providerId?: string | null;
  baseUrl: string;          // trimmed
  apiKey?: string | null;   // trimmed
  wireApi: RelayWireApi;
  extraHeaders: string;     // raw JSON string (trimmed)
  network: RelayNetworkMode;
  ide?: RelayIde;
}
```

Note: model fetch button is NOT disabled on `headersError` — backend parses and validates the raw string.

---

### 2.7 Set Network Mode (RelayNetworkDialog save)

**Guard:** `routerEnabled` → provider row guard blocks dialog from opening; 
etworkSavePendingProviderId === providerId` → idempotent lock; `!changed` → save button disabled

| Attribute | Value |
|---|---|
| api wrapper | `api.setRelayProviderNetwork(providerId: string, network: RelayNetworkMode)` |
| tauri command | `set_relay_provider_network` |
| args | `{ providerId: string, network: "system" \| "direct" }` |
| return type | `CoreEnvelope<RelayProvider>` |

Post-success: `invalidate()` + syncs current edit form's 
etwork` field if editing same provider.

---

### 2.8 Block Official Passthrough Toggle (Switch shown only when `routerEnabled`)

**Element:** secondary Switch in router card, visible only when `routerEnabled === true`  
**Guard:** `officialPassthroughBusy` → idempotent lock

| Attribute | Value |
|---|---|
| api wrapper | `api.setBlockOfficialPassthrough(blocked: boolean)` |
| tauri command | `set_block_official_passthrough` |
| args | `{ blocked: boolean }` |
| return type | `CoreEnvelope<RelayStatePayload>` |

---

### 2.9 Diagnose Router (post-router-enable only; no standalone button in relay page)

Called only inside `performRouterToggle(true)` post-success, NOT as a standalone user action.

| Attribute | Value |
|---|---|
| api wrapper | `api.diagnoseCodexRouter()` |
| tauri command | `diagnose_codex_router` |
| args | (none) |
| return type | `CoreEnvelope<CodexRouterDiagnostics>` |

**CodexRouterDiagnostics:**
```typescript
{
  codexProviderCount: number;
  catalogPath: string;
  catalogExists: boolean;
  configTomlHasRouter: boolean;
  configTomlHasCatalog: boolean;
  userTopLevelProfile: string | null;
  configStaleReason: string | null;
  threadMigrationExists: boolean;
  routerEnabled: boolean;
  issues: RelayDiagnosticIssue[];
  hasIssues: boolean;
  items: RelayDiagnosticItem[];
}
```

---

### 2.10 Export / Import Relay Config (`RelayConfigMenu`)

Both paths go through Tauri file dialog — path is chosen before invoke.

**Export:**

| Attribute | Value |
|---|---|
| api wrapper | `api.exportRelayConfig(includeApiKeys: boolean, filePath: string)` |
| tauri command | `export_relay_config` |
| args | `{ filePath: string, includeApiKeys: boolean }` |
| return type | `CoreEnvelope<RelayExportFile>` |

**Guard:** export dialog with `includeApiKeys` toggle required; `providerCount <= 0` disables export menu item.

**Import:**

| Attribute | Value |
|---|---|
| api wrapper | `api.importRelayConfig(filePath: string)` |
| tauri command | `import_relay_config` |
| args | `{ filePath: string }` |
| return type | `CoreEnvelope<RelayImportPayload>` |

**RelayImportPayload:**
```typescript
{
  importedCount: number;
  skippedCount: number;
  total: number;
}
```

Error `message === "CANCELLED"` (from file-dialog dismiss) is silently swallowed — no toast.

---

### 2.11 Fix Router Issue (`fix_codex_router_issue`)

Present in `api.ts` as `api.fixCodexRouterIssue(itemId: string)`. Per `CLAUDE.md` note: "1.0.8 前端 leaf 归属 Maintenance DiagnosticModal，不在本 Relay 页自动暴露". This command is NOT invoked from `relay-page.tsx` in 1.0.9 — it belongs to the Maintenance module's DiagnosticModal leaf. Not in this page's load chain.

---

## 3. Cache Invalidation Pattern

After every mutation that modifies state, the page calls:
```typescript
queryClient.invalidateQueries({ queryKey: ["relay-state"] })
```
This triggers a re-fetch of `load_relay_state`. Some mutations also do optimistic cache updates before invalidation:
- `upsertRelayProviderInCache(provider)` — merges upserted provider into cache
- `removeRelayProviderFromCache(providerId)` — removes provider from cache
- `updateRelayActivationInCache(payload)` — merges activation state into relay-state cache

---

## 4. Command Summary Table

| Command | Tauri name | Mount? | User trigger |
|---|---|---|---|
| `load_relay_state` | `load_relay_state` | YES | — |
| `set_codex_router_enabled` | `set_codex_router_enabled` | no | Switch confirm dialog |
| `diagnose_codex_router` | `diagnose_codex_router` | no | Post router-enable (internal) |
| `upsert_relay_provider` | `upsert_relay_provider` | no | Save / Save+Enable button |
| `activate_relay_provider` | `activate_relay_provider` | no | Save+Enable, provider row toggle |
| `deactivate_relay_provider` | `deactivate_relay_provider` | no | Provider row toggle |
| `delete_relay_provider` | `delete_relay_provider` | no | Delete confirm button |
| `test_relay_provider` | `test_relay_provider` | no | Test button (stored, !formDirty) |
| `test_relay_draft` | `test_relay_draft` | no | Test button (draft or formDirty) |
| `fetch_relay_models_draft` | `fetch_relay_models_draft` | no | Fetch model list button |
| `set_relay_provider_network` | `set_relay_provider_network` | no | Network dialog save |
| `set_block_official_passthrough` | `set_block_official_passthrough` | no | Passthrough Switch |
| `export_relay_config` | `export_relay_config` | no | Export confirm button |
| `import_relay_config` | `import_relay_config` | no | Import menu item |
| `restart_codex` | `restart_codex` | no | Post catalog change (internal) |
| `fix_codex_router_issue` | `fix_codex_router_issue` | no | NOT in relay page (Maintenance only) |
| `get_relay_active` | `get_relay_active` | no | Not wired to any UI in this page |
| `get_relay_proxy_status` | `get_relay_proxy_status` | no | Not wired to any UI in this page |

---

## 5. Notes on Recon Data Discrepancy

The task prompt listed `api.fetchRelayModelsDraft()` as a `mount_invoke`. This is **incorrect** per source inspection. `fetchRelayModelsDraft` is called only inside `fetchModelOptions()` in `ProviderFormFields`, which is triggered by a user clicking the model-fetch button — it has explicit guards (`!form.baseUrl.trim()` → no-op, `fetchingModels` idempotent lock). It is never called from `useQuery` or `useEffect` at mount time.

The only mount invoke for the relay page is `load_relay_state` (1 command).

---

_evidence_path: `<source-location>/logic/relay-load-chains-109.md`_
