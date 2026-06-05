# Diagnose Cluster — macOS arm64 1.0.9 Distilled Consumer Bundle

**Session**: <audit-session>
**Machine**: <workstation>
**SHA**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482 (full) / 1db044e8efab (sha12)  
**Produced**: 2026-06-03  
**Scope**: macOS arm64 — system module, diagnose cluster (2 leaves)  
**Bundle**: `<source-location>/audits/macos-1.0.9-system/`  
**Raw evidence**: `raw/aimami/1.0.9/macos/system/diagnose_codex_router/` + `raw/aimami/1.0.9/macos/system/diagnose/`

---

## Cluster Summary

| leaf | VA | is_upstream | gate_tier | dim1 | dim2 | dim3 | dim4 | dim5 |
|---|---|---|---|---|---|---|---|---|
| diagnose_codex_router | 0x1001e0d70 | false (source archive-extra) | strictImplementationUse | ✓ CCF relay-page | ✓ A-level | ✓ depth≥5 | ✓ DTO closed | ✓ macOS |
| diagnose | 0x1002641c0 | true (upstream) | strictImplementationUse | ✓ wrapper confirmed | ✓ A-level | ✓ depth≥4 | ✓ DTO closed | ✓ macOS |

**ceiling**: strictImplementationUse (dim6 is source archive implementation acceptance; not reverse scope)

---

## Leaf 1: diagnose_codex_router

### IPC contract
- **Command field**: `"diagnose_codex_router"`  
- **Params**: none  
- **Module**: `codexmate_lib::commands::relay` (not system; dispatched from relay-page)  
- **IPC registration**: cmd table `0x100f2ecf6`; dispatcher closure `0x100329e34`  

### Frontend trigger (dim1)
- `relay-page-CljGSoid.js` L32:44819 — direct `invoke("diagnose_codex_router")` during codex router toggle flow
- Guard: `if (i) { ... }` — active only when relay page condition met
- Response fields consumed: `mt.data.config_toml_has_router`, `mt.data.config_toml_has_catalog`, `mt.data.summary`

### Backend logic (dim2/dim3)
1. `RelayManager::snapshot@0x1001cfc44` → live RelayState clone (provider list, codexRouterEnabled, etc.)
2. `CodexRouteDiagnostic::clone` if present
3. `codex_config_stale_reason@0x1001cb514` → reads config.toml; checks model_server_addr path, relay field, profile name, aimami-relay prefix, codex-router-catalog.json; returns Option<String> stale reason
4. `has_router_thread_migration@0x1005682a8` → checks `~/.codex/router/thread_migration.lock` via fs::metadata
5. `CodexPaths::resolve_codex_home + from_home` → get all codex home paths
6. `read_to_string(config.toml)` → parse; `read_top_level_string_value` for "model_server_addr" (14), "model" (18), "server" (15), "relay" (7), "aimami-relay"
7. `user_top_level_profile@0x1004b0d48` → reads active profile name
8. `fs::metadata` check on config.toml path
9. Assembles result: bool flags + summary string + port + provider count

### Return DTO (dim4)
`DiagnoseCodexRouterResult` (at output +72, 0x140B):
```
summary: Option<String>              // human-readable stale reason or None
config_toml_has_router: bool         // model_server_addr path matches /codex/router
config_toml_has_catalog: bool        // active profile has catalog match  
config_toml_has_relay_profile: bool  // profile name = "aimami" + relay field set
has_router_thread_migration: bool    // migration lock file exists
relay_providers_count: usize         // provider list size from RelayManager::snapshot
user_profile_path_matches_router: bool // active model path == router path
// + port u16, model addr string, config fields
```
IPC ok header at output+392/+396

**Error path**: read failures → stale_reason = None (fallback strings used); function does NOT return Err — always returns Ok with diagnostic struct  
**Side effects**: read-only (no writes, no process spawn, no notifications)

### codex_config_stale_reason detail
Reads config.toml and checks (any match → stale):
1. config.toml name contains "aimami-relay" → "aimami-relay config file detected" (47B literal)
2. model_server_addr not set AND relay field not set → "no relay configured" (71B)
3. relay profile set AND profile name contains "aimami-relay-router" → profile/router conflict (82B)
4. model_server_addr set but is_active_account_in_relay=false → account mismatch (84B)
5. relay not in profiles BUT contains "aimami-relay" → stale profile (81B)
6. relay in profiles BUT does not match active → mismatch (86B: "og_json router catalog")
7. model starts with "aimami_relay_i" → stale model reference (80B ×2 variants)

---

## Leaf 2: diagnose

### IPC contract
- **Command field**: `"diagnose"`  
- **Params**: none  
- **Module**: `codexmate_lib::commands::system`  
- **IPC registration**: cmd table `0x100f30748`; dispatcher closure `0x1003236d0`  

### Frontend trigger (dim1)
- `index-CL22l5v8.js` L86:25575 — `We.diagnose:()=>G("diagnose")` wrapper
- No dedicated CCF trigger entry; wrapper part of `We` API object (accessible programmatically)
- Upstream command per codex-cli conventions

### Backend logic (dim2/dim3)
1. `Mutex<Repository>` lock via OnceLock init → `atomic_load_explicit` + `Mutex::lock`
2. Poison check: `*(_BYTE *)(a1 + 8)` — if poisoned, error with "poisoned lock: another task failed inside"
3. `Repository::diagnose@0x1005f222c` → calls `load_local_state_synced@0x1005ea2c8`
4. `load_local_state_synced` = sync + load + daemon state (full Codex state snapshot)
5. On Ok: assembles DiagnoseResult (0x1A0B) from state; builds model strings ("api9"/"ains"/"code"); calls `CoreEnvelope::ok@0x1001d9f80`
6. `memcpy(a2, __src, 0x1A0)` → write to IPC output
7. `Mutex::unlock`

### Return DTO (dim4)
`DiagnoseResult` (0x1A0 bytes):
- Contains full local Codex state snapshot: accounts, registry items, settings, plugins, sessions context
- RegistryItem stride = 360B; AccountSummary stride = 336B; plugin entry stride = 168B
- Fields: active account info, settings values, config state, status strings
- `CoreEnvelope<T>` ok envelope

**Error path**: `Repository::diagnose` returns `Err(CoreError)` → CoreError Display fmt → CoreEnvelope error path at a2  
**Side effects**: read-only (load_local_state_synced = read state; no writes, no spawns)

---

## Platform Notes

Both leaves are macOS arm64 only in this analysis.  
- `diagnose_codex_router`: uses RelayManager (OnceLock tokio runtime per IPC state); no Windows equivalent expected (source archive-extra)  
- `diagnose`: upstream command; Windows equivalent expected to exist separately (not analyzed this session)

---

## Implementation Notes for source archive

**diagnose_codex_router** (source archive implementation):
- Returns a diagnostic struct with relay config state flags
- field decision fields: `config_toml_has_router`, `config_toml_has_catalog`, `summary`
- Used in relay-page to gate migration prompts and warn dialogs
- Read-only; safe to call at any time

**diagnose** (source archive implementation):
- Returns full Codex state snapshot
- Upstream behavior: load Repository state via mutex
- Output: 0x1A0 byte struct with accounts/registry/settings/plugins
- Read-only; used for debug/diagnostic display

---

## Evidence Pointers

| artifact | path |
|---|---|
| Raw leaf diagnose_codex_router | `raw/aimami/1.0.9/macos/system/diagnose_codex_router/DIAGNOSE-CODEX-ROUTER-MAC-109.md` |
| Raw leaf diagnose | `raw/aimami/1.0.9/macos/system/diagnose/DIAGNOSE-MAC-109.md` |
| Frontend CCF dir | `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/` |
| System CCF doc | `raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md` |
| IDB | `raw/binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64` |
