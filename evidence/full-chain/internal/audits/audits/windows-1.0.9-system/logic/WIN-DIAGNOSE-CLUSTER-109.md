# diagnose cluster — Windows x64 1.0.9 Distilled Consumer Bundle

**Session**: <audit-session>
**Machine**: <workstation>
**SHA12**: a5822387fa3f  
**Produced**: 2026-06-03  
**Scope**: Windows x64 — system module, diagnose cluster (2 leaves)  
**Bundle**: `<source-location>/audits/windows-1.0.9-system/`  
**Raw evidence**:
- `raw/aimami/1.0.9/windows/system/diagnose_codex_router/evidence.md`
- `raw/aimami/1.0.9/windows/system/diagnose/evidence.md`

---

## Cluster Summary

| leaf | VA (win) | is_upstream | gate_tier | dim1 | dim2 | dim3 | dim4 | dim5 | dim6 |
|---|---|---|---|---|---|---|---|---|---|
| diagnose_codex_router | 0x14026C800 (standalone fn) | false (source archive-extra) | strictImplementationUse | ✓ shared CCF relay-page | ✓ A-level | ✓ depth≥5 | ✓ DTO closed | ✓ Win | — ceiling |
| diagnose | dispatcher case 8@0x140267349 | true (upstream) | strictImplementationUse | ✓ shared CCF wrapper | ✓ full chain traced | ✓ depth≥5 | ✓ DTO closed | ✓ Win | — ceiling |
| run_codex_router_diagnostics | 0x140440130 (dispatcher case@0x14026853D) | true (upstream) | strictImplementationUse | ✓ dispatcher string+relay-page CCF | ✓ A-level owner+A-level engine | ✓ depth≥5+1708 BB engine | ✓ DTO 5-category Vec<DiagnosticEntry> | ✓ Win+RegOpenKeyExW | — ceiling |

**ceiling**: strictImplementationUse (dim6 = source archive implementation acceptance; not reverse scope)

**G1 naming conflict resolved**: `run_codex_router_diagnostics` (is_upstream=true, dispatcher@0x140440130) and `diagnose_codex_router` (is_upstream=false, standalone@0x14026C800) are separate IPC commands. Session <audit-session> confirms via separate string xrefs: `0x1412690AA` → dispatcher; `0x141269095` → standalone.

---

## Leaf 1: diagnose_codex_router

### IPC contract
- **Command field**: `"diagnose_codex_router"` (21 chars @ `0x141269095`)  
- **Params**: none  
- **Module pattern**: Relay / source archive-extra (not in system dispatcher; standalone function)  
- **Handler VA**: `diagnose_codex_router_cmd_owner_sys@0x14026C800` (A-level, IDB renamed)  
- **Handler range**: 0x14026C800–0x14026CB8F  

### Frontend trigger (dim1)
- Shared JS bundle: `relay-page-CljGSoid.js` L32:44819 → `invoke("diagnose_codex_router")`
- Guard: relay page active condition `if (i)`
- Response fields consumed: `mt.data.config_toml_has_router`, `mt.data.config_toml_has_catalog`, `mt.data.summary`
- **dim1**: Accepted (shared bundle cross-platform)

### Backend logic (dim2/dim3)
```
diagnose_codex_router_cmd_owner_sys@0x14026C800 (A-level standalone fn)
  ├─ sub_1400DA320 — managed state init check
  ├─ sub_1411CE640 — RelayManager Arc extraction (tag: "manager", len=7)
  ├─ relay_health_check_core_sys@0x14043CA80 (B-level)
  │    ├─ relay_models_relay_active_by_ide_update_inplace_sys@0x1401BDED0
  │    ├─ forward_codex_router_responses_internal_bridge_sys@0x14014C610
  │    ├─ codex_paths_build_from_env_sys@0x140476200
  │    ├─ codex_paths_join_all_subpaths@0x140476350
  │    ├─ migration_cache_read_sys@0x1403DA340
  │    ├─ sub_14042C1C0 (TOML field compare: codex_router_catalog.json)
  │    └─ sub_1404291C0 (async state resolve)
  ├─ sub_140070A10 — response envelope builder
  └─ tauri_ipc_resolve_sys@0x140062230 — terminal
```
- **dim2**: Accepted (A-level decompile; full body; standalone fn)
- **dim3**: Accepted (depth ≥ 5; relay_health_check_core_sys leads to fs/http/TOML leaves)

### Return DTO (dim4)
```rust
DiagnoseCodexRouterResult {
    // 4 diagnostic states (from Chinese string literals):
    // "已启用但 ~/.codex/config.toml 未写入 model_catalog_json..." (153B)
    // "已启用但 ~/.codex/config.toml 未写入 model_provider router..." (148B)
    // "已启用但当前没有任何已启用的中转 Provider..." (143B)
    // 101B error (router not started)
    // 71B error
    // codex_router_catalog_match: bool  // "aimami" XOR check on catalog JSON
    // provider_active: bool             // RelayProvider *(a2+206) discriminant
    // migration_cache: bool             // migration_cache_read_sys result
    // summary: Option<String>           // human-readable state
    // config_toml_has_router: bool      // model_server_addr router path check
    // config_toml_has_catalog: bool     // profile catalog match
}
// Error: 0x8000000000000000 sentinel
```
Reads: `codex_router_catalog.json`, `config.toml`, relay migration cache.  
Side effects: **read-only** (no writes, no spawns, no notifications).  
- **dim4**: Accepted

### Platform note
- Windows has standalone fn at `0x14026C800` (NOT in multiplex dispatcher, unlike most Win commands)
- macOS has dispatcher closure entry; same semantic contract
- `is_upstream=false`: source archive-extra; string "diagnose_codex_router" not in upstream codex-cli; macOS analysis confirms

---

## Leaf 2: diagnose

### IPC contract
- **Command field**: `"diagnose"` (8 chars @ `0x141268DC7`)  
- **Params**: none  
- **Module**: `commands::system` (upstream)  
- **Dispatcher**: `auto_switch_multiplex_dispatcher_sys@0x1402663E0` case 8  
- **Dispatcher entry**: `loc_140267349`; string guard `[rcx] == 0x65736F6E67616964`  

### Frontend trigger (dim1)
- Shared JS bundle: `index-CL22l5v8.js` L86:25575 → `We.diagnose:()=>G("diagnose")` wrapper
- Button trigger in maintenance-page diagnostic flow → `api.diagnose()` → `invoke("diagnose")`
- **dim1**: Accepted (shared bundle; upstream wrapper confirmed)

### Backend logic (dim2/dim3)
```
auto_switch_multiplex_dispatcher_sys@0x1402663E0 [case 8, loc_140267349]
  ├─ sub_1400FA5F0@0x140267430 — managed state extractor (repo, tag="repo"/len=4)
  ├─ sub_1400AE5D0@0x1400AE5D0 — Mutex lock executor (InterlockedCmpXchg8 + WakeByAddressSingle)
  │    └─ sub_1405699B0@0x1405699B0 — Mutex guard executor
  │         └─ sub_14055CFC0@0x14055CFC0 — diagnose wrapper
  │              └─ repository_diagnose_core_impl_sys@0x14055DEA0 (B-level, 225BB, cyclomatic=108)
  │                   ├─ sub_14055DEA0: sub_140563AA0/sub_1405707F0 (state readers)
  │                   ├─ sub_1404014E0 (registry item iterator)
  │                   ├─ sub_140550BD0 (path/string processing)
  │                   └─ memcpy / alloc / drop helpers
  ├─ sub_14029CBB0 — Arc copy helper
  ├─ sub_140067820@0x14026A450 — IPC result wrapper → sub_140446530
  └─ tauri_ipc_resolve_sys@0x140062230 — terminal
```
- **dim2**: Accepted (full chain traced; dispatcher case 8; core impl at 0x14055DEA0 confirmed)
- **dim3**: Accepted (depth ≥ 5; repository_diagnose_core_impl_sys = 225 BB)

### Return DTO (dim4)
```rust
DiagnoseResult {
    // ~0x1A0 bytes total (same as macOS)
    // Ok discriminant = 2
    // Contains full local Codex state snapshot:
    // RegistryItem[]      — stride 360B
    // AccountSummary[]    — stride 336B  
    // plugin_entries[]    — stride 168B
    // active account info
    // settings values (config.toml fields)
    // codex paths
    // model strings ("api9"/5B, "ains"/7B, "code"/6B allocations)
}
CoreEnvelope<DiagnoseResult>
// Error: 0x8000000000000000 sentinel
// Poisoned lock: "poisoned lock: another task failed inside" (41B)
```
Side effects: **read-only** (Repository Mutex acquired+released; no writes, no spawns).  
- **dim4**: Accepted

### Platform divergence from macOS
| aspect | macOS arm64 | Windows x64 |
|---|---|---|
| Handler pattern | standalone fn @0x1002641c0 | dispatcher case 8 @0x140267349 |
| Core impl VA | 0x1005f222c (Repository::diagnose) | repository_diagnose_core_impl_sys@0x14055DEA0 |
| Result size | 0x1A0B | 0x1A0 (same) |
| Behavioral contract | read-only state snapshot | read-only state snapshot (same) |

- **dim5**: windows_confirmed (PE x64; evidence from Windows IDA only; not derived from macOS)

---

## dim6 — Not assessed (ceiling)

dim6 = source archive test/acceptance mapping. Ceiling = strictImplementationUse. Consumer-side implementation work, not reverse scope.

---

---

## Leaf 3: run_codex_router_diagnostics (Added session <audit-session> 2026-06-03)

### IPC contract
- **Command field**: `"run_codex_router_diagnostics"` (28 chars @ `0x1412690AA`)
- **Params**: none
- **Module**: `commands::system` (upstream codex-cli)
- **Handler VA**: `run_codex_router_diagnostics_cmd_owner_sys@0x140440130` (A-level, IDB named)
- **Dispatcher entry**: `auto_switch_multiplex_dispatcher_sys@0x1402663E0` — string loaded at `0x14026853D`, dispatch call at `0x1402685C1`

### Frontend trigger (dim1)
- IPC field string `"run_codex_router_diagnostics"` confirmed in binary
- Shared JS bundle: relay-page (maintenance-page DiagnosticDialog + relay-page performRouterToggle confirmed from dispatch task context)
- Guard: relay page active condition
- **dim1**: Accepted (dispatcher string + shared bundle CCF)

### Backend logic (dim2/dim3)
```
run_codex_router_diagnostics_cmd_owner_sys@0x140440130 (A-level owner)
  ├─ codex_paths_build_from_env_sys@0x140476200    — resolve ~/.codex paths
  ├─ codex_paths_join_all_subpaths@0x140476350     — join all sub-path segments
  ├─ sub_140153300                                  — manager state extractor from IPC ctx
  └─ relay_diagnostic_engine_core_sys@0x1403A6B60 (A-level, 1708 BB, 53,463 bytes)
       ├─ sub_1403CD880  — diagnostic entry builder (auth_integrity path)
       ├─ sub_1403BFE10  — api_key_integrity: relay_keychain_get_api_key_sys + RegOpenKeyExW
       ├─ sub_1403C3BF0  — catalog_integrity: codex_router_catalog.json + TOML block check
       ├─ sub_1403C37A0  — db_orphan_providers: SQLite integrity_check scan
       ├─ sub_1403C3D20  — rollout_orphan_providers: thread orphan registry scan
       ├─ sub_1403C4500  — diagnostic result assembler
       ├─ sub_1404114A0  — result serializer → Vec<DiagnosticEntry>
       └─ (terminal via CoreEnvelope → tauri_ipc_resolve_sys@0x140062230)
```
- **dim2**: Accepted (A-level decompile; full chain; dispatcher case confirmed by string xref)
- **dim3**: Accepted (depth ≥ 5; 1708 BB engine with sqlite/registry/keychain/catalog terminal leaves)

### Return DTO (dim4)
```rust
// Output: CoreEnvelope<Vec<DiagnosticEntry>>
struct DiagnosticEntry {
    field: String,          // "auth_integrity" | "catalog_integrity" | "api_key_integrity"
                            // | "db_orphan_providers" | "rollout_orphan_providers"
    status: String,         // "ok" | "error" | "conflict"
    detail: Option<String>, // Human-readable diagnostic detail; None on success
}

// String field addrs:
//   "auth_integrity"           @ 0x14127531D
//   "catalog_integrity"        @ 0x141275B08
//   "api_key_integrity"        @ 0x141275C1E
//   "db_orphan_providers"      @ 0x141276171
//   "rollout_orphan_providers" @ 0x141276E44
```

TOML managed block markers used in catalog/config integrity checks:
- `"# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)"` @ `0x1412644A4`
- `"# <<< aimami-relay codex-router top end"` @ `0x141265D0A`

Reads: HKCU registry (RegOpenKeyExW), keychain, `codex_router_catalog.json`, `config.toml` TOML blocks, SQLite relay DB.
Side effects: **read-only** (diagnostic only; no writes, no spawns).
Error sentinel: `0x8000000000000000`.

- **dim4**: Accepted

### Platform note
- Windows uses `RegOpenKeyExW` (HKCU) for auth_integrity and api_key_integrity checks — Windows-specific registry path absent on macOS
- macOS equivalent not yet reversed for this command (not in macOS cluster)
- **dim5**: windows_confirmed (PE x64; evidence from Windows IDA only)

### dim6 — Not assessed (ceiling)
dim6 = source archive test/acceptance mapping. ceiling = strictImplementationUse.

### real_body_found / genuine_ceiling
| field | value |
|---|---|
| real_body_found | true |
| was_drop_in_place_only | false |
| was_budget_rule_only | false |
| genuine_ceiling | false |
| caller_disambiguation_tried | true |
| recovery_attempts | String xref 0x1412690AA → dispatch site 0x14026853D → call 0x140440130; true owner confirmed; no ICF fold |

---

## Ceiling-Crack Supplement — repository_diagnose_core_impl_sys@0x14055DEA0

**Session**: <audit-session>
**Date**: 2026-06-03  
**Machine**: <workstation>
**SHA12**: a5822387fa3f  

### Ceiling-crack verdict

| field | value |
|---|---|
| real_body_found | true |
| was_drop_in_place_only | false |
| was_budget_rule_only | false |
| genuine_ceiling | false |
| caller_disambiguation_tried | true |
| ceiling_reason | N/A — no ceiling; body fully decompiled |

Prior session (<audit-session>) labeled this function B-level with note "225BB cyclomatic=108". This session block-decompiled the full body to confirm it is the true implementation, not a destructor or ICF-folded glue.

### Body structure (full decompile confirmed)

The function signature is:
```c
__int64 __fastcall repository_diagnose_core_impl_sys(__int64 a1, _QWORD *a2)
```
- `a1` = output result pointer (set to `*a1=10` = Ok discriminant on success)
- `a2` = Repository managed-state pointer (stride ~0x1A0+ bytes)

**Phase 1 — PluginRegistry read** (`sub_140563AA0@0x140563AA0`):
- Reads PluginRegistry items from `a2[5..6]` range
- Iterates items; on error returns `*Dst=2` (Err discriminant)

**Phase 2 — AccountSummary read** (`sub_140553180@0x140553180`):
- Reads AccountSummary slice from `a2+296` / `a2+304` (ptr+len)
- Calls `sub_14104DEE0` (path read) + `sub_140261D00` (list build)
- Returns `*a1=10` (Ok) or `*a1=3` (Err)

**Phase 3 — plugin_entries read** (`sub_1405707F0@0x1405707F0`):
- Reads plugin entries from `a2[69..70]`
- Returns count (min 1) + max_version int field

**Phase 4 — path existence validation** (`sub_1404760A0@0x1404760A0`):
- Checks 9 offsets in `a2`: `[33..34]`, `[41..42]`, `[45..46]`, `[49..50]`, `[57..58]`, `[61..62]`, `[113..114]`, `[117..118]`, `[97..98]`
- Each check via `sub_14103DA30` = path component parser/validator (no disk IO in error path, returns 0 on missing)

**Phase 5 — string normalization** (`sub_140550BD0@0x140550BD0`):
- Takes path string from `a2[41..42]` (same offsets as AccountSummary)
- Three-pass character substitution: `@`→`_`, `/`→`_`, `:`→`_` (SIMD vectorized)
- Builds sanitized field string; calls `sub_141035180` (path join — read-only)

**Phase 6 — RegistryItem diff loop** (inline in main body):
- Iterates `Dst[]` (RegistryItem array, stride=360B, count=`v142.m256i_i64[0]`)
- For each item compares ~15 string fields at offsets +136/144/152/160/168/176/184/192/224/232/240/248/256/264/272/280/288/296/304/312/320/328/336
- On field mismatch: calls `sub_14105D540` (string clone) + updates item in-place + sets dirty flag `v19=1`
- `sub_140570350@0x140570350` = quota snapshot comparer (finds matching item by name field, updates string fields in-place if changed, returns bool changed)
- `sub_140570930@0x140570930` = quota snapshot JSON serializer + writer to `a2[account_key]` (in-memory; calls `sub_1403362B0` = in-mem buffer writer)

**Phase 7 — DiagnoseResult serialize** (`sub_140558110@0x140558110`):
- Serializes full state snapshot to JSON in-memory buffer
- Fields: `updatedAt` + `activeAccountKey` + `items[]`
- Calls `sub_140336350` (in-mem JSON writer at `a2+36` range)
- Returns `*a1=10` (Ok) on success

**Phase 8 — Error tag collection** (inline):
- Two diagnostic tag strings pushed into `Vec<DiagError>` (`v148` buffer, stride=48B):
  - `"CURRENT_AUTH_SYNC_FAILED"` (24B) — pushed when auth.json sync check fails (string `"Failed to sync current auth.json into the AiMaMi registry: "` at `0x141285B67`)
  - `"LEGACY_QUOTA_MIGRATION_FAILED"` (29B) — pushed when quota migration fails (string `".Failed to migrate legacy account quota cache: "` at `0x141285BC2`)
- These are diagnostic error tags written to output result, NOT side-effecting writes or network calls

**Phase 9 — cleanup** (`sub_1404014E0@0x1404014E0`):
- Destructor for PluginRegistry items read in Phase 1 (calls `sub_140001370` = Rust deallocator for 5 string pairs)

### Callee inventory (32 callees, all type=internal)

| callee VA | role | evidence |
|---|---|---|
| `0x140563AA0` | PluginRegistry items reader | decompiled; reads a2[5..6] |
| `0x140553180` | AccountSummary slice reader | decompiled; reads a2+296..304 |
| `0x141036690` | GetCurrentThreadId (time source) | syscall wrapper |
| `0x141036640` | FILETIME epoch converter | time arithmetic |
| `0x1405850F0` | Drop/free for Option<String> | Rust drop glue |
| `0x1405707F0` | plugin_entries reader | decompiled; reads a2[69..70] |
| `0x1404760A0` | Path existence checker (9 offsets) | decompiled; no disk IO in fast path |
| `0x140550BD0` | String char normalizer (@→_/→_:→_) | decompiled; SIMD vectorized |
| `0x141050240` | fmt::Display panic check | panic path only |
| `0x141047370` | Option<String> clone helper | no IO |
| `0x140177DE0` | Drop Arc<T> | Rust drop glue |
| `0x14105D150` | format! macro helper | string formatting |
| `0x14105B6B0` | String clone to output buf | no IO |
| `0x140001370` | Rust deallocator (GlobalAlloc::dealloc) | alloc |
| `0x1411CD210` | memcmp | stdlib |
| `0x14105D540` | String clone for RegistryItem field | no IO |
| `0x14104E180` | String equality check | no IO |
| `0x1411CE480` | Vec<DiagError> grow (realloc) | alloc only |
| `0x1411CCB90` | memcpy | stdlib |
| `0x140558110` | DiagnoseResult JSON serializer (in-mem) | decompiled; no disk |
| `0x14104E390` | String concat helper | no IO |
| `0x1400013A0` | nullsub_1 (inlined nop) | nop |
| `0x140001360` | Rust allocator (GlobalAlloc::alloc) | alloc |
| `0x1411CDE60` | Vec grow (realloc) | alloc only |
| `0x140570350` | Quota snapshot comparer | decompiled; in-mem compare+update |
| `0x140570930` | Quota snapshot JSON serializer | decompiled; in-mem write |
| `0x1400CA760` | RegistryItem drop | Rust drop glue |
| `0x1404014E0` | PluginRegistry string fields drop | decompiled; deallocator only |
| `0x1412085B0` | fmt::Display error panic | panic path only |
| `0x14049E080` | Vec sort/trim helper | no IO |
| `0x14120829B` | OOM abort | alloc failure |
| `0x1404029B0` | Arc clone helper | no IO |

### Side-effect boundary confirmation

| category | verdict |
|---|---|
| HTTP / network | NONE — zero external callees |
| Disk write | NONE — all JSON serialize to in-mem buffer |
| Disk read | NONE — path validation only checks string fields already in Repository state |
| Process spawn | NONE |
| Mutex lock | YES — inherited from caller chain (sub_1400AE5D0→sub_1405699B0); Repository Mutex already held on entry |
| Emit / event | NONE |
| Side effects on Repository | YES — updates RegistryItem string fields in-place (quota snapshot diff); marks dirty flag for caller to decide persistence |

The `dirty` flag (`LOBYTE(v19)=1`) is returned to the caller chain (`sub_140558110`), which decides whether to call `sub_140336350` for in-memory JSON serialization only. No disk persistence occurs inside this function.

### Gate impact

Prior gate: `strictImplementationUse` (dim6 missing — unchanged, dim6 is source archive implementation scope).  
This ceiling-crack does **not** change the gate tier — `strictImplementationUse` is maintained.  
dim1-5 remain closed. dim6 remains not assessed (source archive implementation acceptance, not reverse scope).

**IDA comment set** at `0x14055DEA0`; IDB saved session <audit-session>

---

## Evidence paths

| artifact | path |
|---|---|
| Raw leaf diagnose_codex_router | `raw/aimami/1.0.9/windows/system/diagnose_codex_router/evidence.md` |
| Raw leaf diagnose | `raw/aimami/1.0.9/windows/system/diagnose/evidence.md` |
| IDB (Win) | `raw/binary/AiMaM 1.0.9 win64.exe.i64` |
| macOS cross-ref | `<source-location>/audits/macos-1.0.9-system/logic/DIAGNOSE-CLUSTER-DISTILLED-109.md` |
| Frontend CCF | `raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md` |
| Ceiling-crack IDA comment | IDB `0x14055DEA0` func comment; session <audit-session> |
