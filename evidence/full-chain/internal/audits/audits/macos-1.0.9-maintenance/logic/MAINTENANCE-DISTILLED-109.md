# Maintenance Cluster — macOS 1.0.9 Distilled
**Bundle**: macos-1.0.9-maintenance | **Gate**: strictImplementationUse (dim1-5 closed, dim6 missing = ceiling)
**Session**: <audit-session>
**is_upstream**: true for all 3 leaves (confirmed upstream codex-cli commands)

---

## Leaf 1: clean

### IPC
```typescript
// invoke signature
invoke('clean')  // no parameters

// return type
interface CleanResult {
  deleted_sessions: number;      // u32 — files removed from sessions dir
  deleted_intermediate: number;  // u32 — files removed from intermediate dir
  registry_delta: number;        // i32 — registry items pruned (original - retained)
}
```

### Behaviour
1. Acquires `Repository` Mutex (OnceLock<Mutex> pattern)
2. `load_registry()` → Vec<RegistryItem>
3. `Vec::retain` — keeps only items where `last_seen_ts >= now_secs - 604800` (7 days)
4. `read_dir(sessions_path)` → `remove_file` each entry; count = `deleted_sessions`
5. `read_dir(intermediate_path)` → `remove_file` each entry; count = `deleted_intermediate`
6. `persist_registry` (writes updated registry.json with pruned items + updated last_clean_ts)
7. `quota_store::load` → `Vec::retain` by retained field set → `quota_store::save` if changed

### Error cases
| Condition | Response |
|---|---|
| Mutex poisoned | CoreError "poisoned lock: another task failed inside" |
| `load_registry` error | Early Err(CoreError) |
| `persist_registry` error | Err(CoreError) |
| `quota_store::save` error | Err(CoreError) |

### Side-effects
- **Deletes** all files in `~/.codex/sessions/` and `~/.codex/intermediate/`
- **Writes** updated `~/.codex/registry.json` (7d pruned)
- **Writes** updated quota snapshot if keys removed

### Owner VAs
| Function | VA |
|---|---|
| `commands::system::clean` | 0x100263ebc |
| `core::repository::Repository::clean` | 0x1005f1140 |

---

## Leaf 2: rebuild_registry

### IPC
```typescript
// invoke signature
invoke('rebuild_registry')  // no parameters

// return type (CoreEnvelope<RegistryPayload>)
interface RegistryPayload {
  items: RegistryItem[];     // freshly rebuilt from disk scan
  current_account_key: string;
  snapshot_dir: string;
  // (additional status fields, 112-byte struct)
}
interface RegistryItem {
  // size: 360 bytes
  account_key: string;
  // ... auth/plan/timestamp fields
}
```

> **[RE-VERIFY 2026-06-04 <audit-session>, opus] — RESPONSE DTO CORRECTION (byte-confirmed).**
> Live-IDB re-decompile (SHA 1db044e8efab) corrects the inferred `RegistryPayload` above. The real IPC response type is
> `codexmate_lib::core::models::RebuildRegistryPayload` (serializer `0x1001d5d08`), a **flat 3-field summary — NOT a struct
> embedding the items Vec**:
> ```typescript
> interface RebuildRegistryPayload {
>   activeAccountKey: string;  // @payload+0,  serde field bytes 61..4B (16B)
>   accountCount: number;      // @payload+24, serde field bytes 61..74 (12B)  — count of rebuilt items
>   registryUpdated: boolean;  // @payload+28, serde field bytes 72..64 (15B)
> }
> // wrapped in CoreEnvelope::ok@0x1001d9474: status="ok"(0x6B6F) + message="success"(7B) — byte-confirmed
> ```
> The rebuilt `Vec<RegistryItem>` (360B each) is **persisted to disk (registry.json via persist_registry@0x1005e6460 →
> std::fs::write@0x10038f318), NOT returned** in the response. registry.json on-disk top-level keys byte-confirmed:
> `schemaVersion`(13B) + `updatedAt`(9B) + `activeAccountKey`(16B) + accounts[].
> Async EXCLUDED by positive proof: `func_query(rebuild_registry poll|async_fn_env|closure)=EMPTY`, owner 25-BB sync CFG,
> owner→core direct BL. gate_tier=strictImplementationUse UNCHANGED. Full evidence:
> `<source-location>/intermediate/aimami/1.0.9/macos-arm64/maintenance-rebuild-registry/DEEP-DISTILLED-109-wf-fullsurface-audit.md`.

### Behaviour
1. Acquires Repository Mutex
2. `CodexPaths::ensure_directories()` — mkdir -p any missing dirs
3. `load_registry()` → existing items (used only for carry-over of existing state)
4. `load_auth_file(auth_path)` for active account → `make_auth_snapshot` → build RegistryItem:
   - `make_snapshot_path` → `fs::copy(auth_path, snapshot_path)`
   - Format account field (lowercase)
   - `carry_over_registry_state` from existing item if found
   - Append to items Vec
5. `read_dir(snapshots_dir)` → for each `*.json` file:
   - `load_auth_file` → `make_auth_snapshot` → `carry_over_registry_state`
   - Skip if account field already in Vec (dedup)
   - Append new RegistryItem
6. Sort items (insertion_sort N<21; driftsort N≥21)
7. `persist_registry(items, snapshot_dir_flag=1)`

### Error cases
| Condition | Response |
|---|---|
| Mutex poisoned | CoreError "poisoned lock..." |
| `ensure_directories` error | Early Err, code=2 |
| `load_auth_file` error | Propagated CoreError |
| `make_auth_snapshot` error | Propagated CoreError |
| `persist_registry` error | Err(CoreError) |

### Side-effects
- **Creates** missing `~/.codex/` subdirectories
- **Copies** `~/.codex/auth.json` → `~/.codex/snapshots/<field>.json`
- **Writes** rebuilt `~/.codex/registry.json`

### Owner VAs
| Function | VA |
|---|---|
| `commands::system::rebuild_registry` | 0x10025eb00 |
| `core::repository::Repository::rebuild_registry` | 0x1005e7334 |

---

## Leaf 3: load_snapshot

### IPC
```typescript
// invoke signature
invoke('load_snapshot', { localOnly: boolean })

// return type: CoreEnvelope<AppStatusPayload> with warnings
interface AppStatusPayload {
  // size: 0x2F8 bytes (760 bytes)
  registry_items: RegistryItem[];
  account_summary: AccountSummary;
  app_path_state: AppPathState;   // all resolved CodexPaths
  settings: CodexMateSettings;
  service_state: ServiceState;    // relay + daemon status (mode=4 = full)
}
interface Warning {
  code: string;    // e.g. "AUTO_SWITCH_DAEMON_REPAIR_FAILED"
  message: string; // human-readable details
}
```

### Module placement note
`commands::accounts::load_snapshot` — placed in accounts module despite being in the maintenance cluster scope. Not `commands::system`.

### Behaviour
1. `StateManager::try_get` → Repository Arc<Mutex<Repository>> (panics if not managed)
2. Acquires Repository Mutex
3. `Repository::load_snapshot_local`:
   a. `load_local_state_synced` = `sync_local_runtime_state` + `load_local_state`
   b. (conditional): if daemon_needed flag set in state:
      - `check_daemon_state` → if failed: `install_daemon` OR append `AUTO_SWITCH_DAEMON_REPAIR_FAILED` warning
   c. `make_status_payload_with_service_state(repo, local_state, warnings, mode=4)`
   d. `CoreEnvelope::ok_with_warnings(payload, warnings)`

### `localOnly` parameter effect
- Controls which Tokio poll wrapper calls this closure (3 variants: h7820c437/hae94c44f/hd28fdcd6)
- localOnly=true → skips relay/network sync in `sync_local_runtime_state`
- Core `load_snapshot_local` body identical either way

### Error cases
| Condition | Response |
|---|---|
| `StateManager::try_get` null | panic (not recoverable) |
| Mutex poisoned | CoreError "poisoned lock..." |
| `load_local_state_synced` error (disc=2) | Err(CoreError), output disc=3 |
| `sync_local_runtime_state` error | Propagated |
| `load_local_state` error | Propagated |

### Side-effects
- **Read-only** on happy path (reads disk state, builds payload, no writes)
- **Conditional write**: daemon repair path may write LaunchAgent plist + launchctl load
- `sync_local_runtime_state` may update in-memory ephemeral fields (no disk write on happy path)

### Owner VAs
| Function | VA |
|---|---|
| `commands::accounts::load_snapshot::{{closure}}::{{closure}}` | 0x10032d430 |
| `core::repository::Repository::load_snapshot_local` | 0x1005e8e58 |
| `core::repository::Repository::load_local_state_synced` | 0x1005ea2c8 |

---

## Gate Summary

| Leaf | dim1 | dim2 | dim3 | dim4 | dim5 | dim6 | gate_tier |
|---|---|---|---|---|---|---|---|
| clean | pass (string@0x100f2eb8f + run xref) | pass (full decompile) | pass (depth 4, OS terminal) | pass (no-arg, CleanResult, side-effects) | pass | missing (ceiling) | **strictImplementationUse** |
| rebuild_registry | pass (string@0x100ee9460 + run closure) | pass (full decompile) | pass (depth 4, persist_registry terminal) | pass (no-arg, RegistryPayload, side-effects) | pass | missing (ceiling) | **strictImplementationUse** |
| load_snapshot | pass (string@0x100edc37e + Tokio poll xrefs) | pass (full closure decompile) | pass (depth 5, load_local_state OS reads) | pass (localOnly param, AppStatusPayload + warnings) | pass | missing (ceiling) | **strictImplementationUse** |

**Cluster ceiling**: strictImplementationUse (dim6 is source archive implementation side, not reversible from binary)

---

## Raw Evidence Paths
```
<source-location>/raw/aimami/1.0.9/macos/maintenance/clean/leaf.md
<source-location>/raw/aimami/1.0.9/macos/maintenance/rebuild_registry/leaf.md
<source-location>/raw/aimami/1.0.9/macos/maintenance/load_snapshot/leaf.md
```
