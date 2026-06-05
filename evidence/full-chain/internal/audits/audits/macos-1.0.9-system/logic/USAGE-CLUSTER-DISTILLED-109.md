# Usage Cluster — Distilled Evidence (macOS 1.0.9)

**Cluster**: refresh_usage_snapshot + get_usage_refresh_interval + set_usage_refresh_interval  
**Platform**: macOS arm64  
**Binary SHA12**: 1db044e8efab  
**Session**: <audit-session>
**Machine**: <workstation>
**Produced**: 2026-06-03  
**is_upstream**: true (all 3 leaves — confirmed in upstream codex-cli command set)  
**gate_tier**: strictImplementationUse — dim1-5 closed; dim6 ceiling (not assessed, source archive-side work)

---

## Owner Matrix

| leaf | owner_va | symbol (abbreviated) | gate |
|---|---|---|---|
| refresh_usage_snapshot | 0x1001e7eec | `commands::accounts::refresh_usage_snapshot_with_retry` | strictImplementationUse |
| get_usage_refresh_interval | 0x100260c10 | `commands::system::get_usage_refresh_interval` | strictImplementationUse |
| set_usage_refresh_interval | 0x100260e24 | `commands::system::set_usage_refresh_interval` | strictImplementationUse |

---

## refresh_usage_snapshot

### IPC Contract
```
invoke('refresh_usage_snapshot', { upstream: bool })
→ CoreEnvelope<CoreSnapshotPayload>  (0x2A8 bytes)
```

### Behavior
1. Get Repository Mutex from Tauri state (`StateManager::try_get`)
2. Get `auto_switch_state` bool via `resolve_cached_auto_switch_service_state`
3. `load_usage_only_runtime_snapshot(repo, auto_switch)`:
   - `load_local_state_synced` (fs read)
   - `enrich_active_account_usage_via_api`: for each account in registry, ensure_fresh_token → fetch_usage_snapshot (HTTP) → apply_usage_result
   - `persist_progressive_state` (fs write)
   - `make_status_payload_with_service_state` + `store_bootstrap_snapshot_progressive`
   - returns `CoreEnvelope<CoreSnapshotPayload>` with `ok_with_warnings`
4. On Ok: `broadcast_runtime_snapshot(app, snapshot, "load_snapshot", 11)` — emits Tauri event
5. If `upstream==true` AND `snapshot.status==2` (Refreshing): sleep 200ms, retry steps 3-4 once
6. Return final envelope

### Side Effects
- HTTP calls to usage API (one per account with subscription)
- fs write: `persist_progressive_state`
- Tauri event: `"load_snapshot"` broadcast
- quota_store update: `upsert_item`
- 200ms sleep + retry when upstream=true and status=Refreshing

### Error Path
- StateManager null → panic
- Mutex poisoned → panic
- load_local_state_synced Err → propagated in envelope
- HTTP error → stored in api_context, state updated gracefully; no propagation to caller

### Call-tree terminal leaves
- `reqwest::Client` (HTTP terminal)
- fs persist (config + snapshot)
- Tauri event emit

---

## get_usage_refresh_interval

### IPC Contract
```
invoke('get_usage_refresh_interval')
→ Result<String, CoreError>
```

### Behavior
1. Lock Repository Mutex
2. `Repository::get_usage_refresh_interval` → `load_settings` (config.toml fs read)
3. Read `usageRefreshInterval` field, return as String
4. Default when field missing or unrecognized: `"1m"`
5. Unlock Mutex

### Return Values
| String | Seconds | Notes |
|---|---|---|
| `"1m"` | 60 | default |
| `"3m"` | 180 | |
| `"5m"` | 300 | |
| `"30s"` | 30 | |

### Side Effects: none (read-only)

### Error Path
- Mutex poisoned → Err("poisoned lock: another task failed inside")

---

## set_usage_refresh_interval

### IPC Contract
```
invoke('set_usage_refresh_interval', { interval: String })
→ Result<String, CoreError>
  // Ok: saved interval string (echo back)
  // Err: invalid value or fs error
```

### Behavior
1. Lock Repository Mutex (a2)
2. `Repository::set_usage_refresh_interval(repo, interval_str, interval_len)`:
   - Validate: must be one of `"1m"`, `"3m"`, `"5m"`, `"30s"` — else Err
   - `load_settings` (fs read)
   - Update `usageRefreshInterval` field in `CodexMateSettings`
   - `save_settings` (fs write to config.toml)
   - Return new interval string on Ok (tag=10)
3. On Err from set: format error message, return Err envelope
4. On Ok:
   - Unlock Mutex
   - `StateManager::try_get` → get second Repository reference
   - Lock second Mutex
   - `Repository::get_usage_refresh_interval` → read back saved value
   - `usage_refresh_interval_seconds(saved_str)` → convert to u64
   - Unlock second Mutex
   - `update_usage_refresh_schedule(seconds)`:
     - Lock `usage_refresh_watcher_state::STATE@0x101390358`
     - Write `qword_101390368 = seconds`
     - `Condvar::notify_all(&unk_101390378)` — wake watcher thread
5. Return Ok envelope with saved interval string

### Validation
Only these 4 values accepted: `"1m"` | `"3m"` | `"5m"` | `"30s"`. Any other value returns CoreError.

### Side Effects
1. **fs write**: `config.toml` updated with new `usageRefreshInterval` value
2. **watcher signal**: `qword_101390368` updated + `Condvar::notify_all` on `unk_101390378`
   - This immediately wakes the usage refresh watcher thread to apply new schedule

### Watcher State Addresses
```
usage_refresh_watcher_state::STATE@0x101390358  OnceLock<Mutex<WatcherState>>
qword_101390388@0x101390388                      OnceLock initialized check
byte_101390360@0x101390360                       Mutex poisoned flag
qword_101390368@0x101390368                      current interval_seconds (u64)
unk_101390378@0x101390378                        Condvar (shared with note_usage_refresh_activity)
```

The Condvar `unk_101390378` is the **same** condvar used by 
ote_usage_refresh_activity` — confirmed by prior system evidence. So `set_usage_refresh_interval` and 
ote_usage_refresh_activity` share the same wakeup mechanism.

### Error Path
- Invalid interval string → Err with `"Invalid interval: ..."` (error tag=8)
- Mutex poisoned → panic (poisoned lock)
- `save_settings` fs error → Err from `Repository::set_usage_refresh_interval`

---

## Interval Enum Encoding (bswap analysis)

The 4 valid values are encoded as byte slices compared via 16-bit LE short tags:

| Value | len | LE u16 | bswap32>>16 | Seconds |
|---|---|---|---|---|
| `"1m"` | 2 | 0x6D31 (27953) | — | 60 |
| `"3m"` | 2 | 0x6D33 (27955) | — | 180 |
| `"5m"` | 2 | — | 0x356D (13677) | 300 |
| `"30s"` | 3 | first_u16=0x3033(12339), +2=0x73(115='s') | — | 30 |

Ref: `usage_refresh_interval_seconds@0x1005f4b34`, `Repository::get_usage_refresh_interval@0x1005ee5dc`, `Repository::set_usage_refresh_interval@0x1005ee944`.

---

## Evidence Paths

Raw evidence:
- `<source-location>/raw/aimami/1.0.9/macos/system/refresh_usage_snapshot/evidence.md`
- `<source-location>/raw/aimami/1.0.9/macos/system/get_usage_refresh_interval/evidence.md`
- `<source-location>/raw/aimami/1.0.9/macos/system/set_usage_refresh_interval/evidence.md`

IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`  
IDA comments written at: 0x1001e7eec, 0x100260c10, 0x100260e24

---

## Gate Summary

| leaf | dim1 | dim2 | dim3 | dim4 | dim5 | dim6 | gate_tier |
|---|---|---|---|---|---|---|---|
| refresh_usage_snapshot | ✅ IPC cmd table + xref | ✅ A-level decompile | ✅ depth≥6, HTTP+fs+event terminal | ✅ DTO/error/side-effect closed | ✅ macOS only | ⬜ source archive-side | strictImplementationUse |
| get_usage_refresh_interval | ✅ IPC cmd table + run::closure xref | ✅ A-level decompile | ✅ depth=3, fs read terminal | ✅ return type+enum closed | ✅ macOS only | ⬜ source archive-side | strictImplementationUse |
| set_usage_refresh_interval | ✅ IPC cmd table + run::closure xref | ✅ A-level decompile | ✅ depth=4, fs write+condvar terminal | ✅ validation+DTO+side-effects closed | ✅ macOS only | ⬜ source archive-side | strictImplementationUse |

**ceiling**: strictImplementationUse — dim6 is source archive implementation-side acceptance mapping, not upstream reverse work. All 3 leaves are upstream (in upstream codex-cli command set per command string evidence).
