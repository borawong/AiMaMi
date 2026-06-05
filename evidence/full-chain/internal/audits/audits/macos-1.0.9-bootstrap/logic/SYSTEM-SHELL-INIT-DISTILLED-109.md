# macOS 1.0.9 system-shell-init Cluster — Consumer Distilled
## Angle-3 (mac IDA deep), session <audit-session>, machine <workstation>

**Scope**: 启动后初始化闭环 — initialization that runs after the app shell opens and during
frontend rendering. Additive to macos-1.0.9-bootstrap bundle.

**Binary SHA-256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`  
**Raw evidence**: `raw/aimami/1.0.9/macos/bootstrap/system-shell-init/SYSTEM-SHELL-INIT-DEEP-109.md`

---

## Complete Init Closed Loop

```
app shell opens
  ↓ setup hook fires (bootstrap cluster: app_run_entry, boot_spawn_threads, managed_state_registry)
  ↓
frontend renders — useCoreSnapshot() in main-app.tsx
  ↓
[1] invoke("load_bootstrap_state") → sync → bootstrap-cache.json (bootstrap cluster, already documented)
  ↓
[2] invoke("load_snapshot", { localOnly: true }) → async (tokio)
    Mutex<Repository> → load_local_state_synced → sync_local_runtime_state + load_local_state
    → make_status_payload_with_service_state → CoreSnapshotPayload
    → respond_async_serialized
  ↓
[3] TanStack Query cache seeded from bootstrap payload + snapshot payload
  ↓
[4] Event listeners registered:
    - "runtime-state-updated"    ← backend: broadcast_runtime_snapshot @ 0x1001e3858
    - "auto-switch-pending"      ← backend: auto-switch watcher thread (bootstrap cluster)
    - "tray:navigate"            ← backend: tray system (separate cluster)
    - "usage:refreshed"          ← frontend-driven, backend: note_usage_refresh_activity @ 0x100262428
```

---

## load_snapshot — IPC Command

### field Facts

| item | value |
|---|---|
| dispatch | async — `tauri::async_runtime::spawn` @ 0x100318b3c (inside main dispatcher 0x1003187fc) |
| async inner closure | `load_snapshot::{{closure}}::{{closure}}` @ `0x10032d430` |
| param | `localOnly: bool` (confirmed in param string block `0x100edc37e`) |
| response type | `CoreEnvelope<CoreSnapshotPayload>` via `respond_async_serialized` @ `0x10060a708` |
| is_upstream | `true` (upstream codex-cli accounts command) |

### Call Chain

```
invoke("load_snapshot", {localOnly:true})
  → async_runtime::spawn [0x100292d94]
  → load_snapshot::{{closure}}::{{closure}} [0x10032d430]
      → StateManager::try_get [0x10034b0fc]  (Mutex<Repository>)
      → Mutex::lock (pthread_mutex_lock)
      → Repository::load_snapshot_local [0x1005e8e58]
          → Repository::load_local_state_synced [0x1005ea2c8]
              → Repository::sync_local_runtime_state [0x1005eae50]   ← step 1
              → Repository::load_local_state [0x1005e5940]            ← step 2
              → [daemon repair side-effect if flag set]
              → make_status_payload_with_service_state [0x1005f0944]
                  → check_daemon_state [0x1003e19f0]
                  → AccountSummary::clone / String::clone ×7
                  → hardcoded service label "dev.aimami.auto-switch" (22 bytes)
          → CoreEnvelope::ok_with_warnings [0x1001d8a48]
      → respond_async_serialized [0x10060a708]
```

### Response DTO

`CoreSnapshotPayload` (2 fields from struct metadata @ `0x100f3f68e`):
- `status`: `AppStatusPayload` (9 fields: `activeAccount`, `apiConnectivity`, `proxy`, `paths`, `lastScanAt`, `primaryWindow`, `secondaryWindow`, `tokenStatus`, service-state)
- accounts summary slice: `Vec<AccountSummary>` (19 fields per item)

Hardcoded service label in payload: `"dev.aimami.auto-switch"` @ runtime heap

### Error Paths

| condition | result |
|---|---|
| Mutex poisoned | CoreError discriminant=2, `"poisoned lock: another task failed inside"` |
| Daemon flag set + daemon not running | daemon repair attempt (install_daemon); on failure pushes `"AUTO_SWITCH_DAEMON_REPAIR_FAILED"` to warnings |
| IO/parse errors in load_local_state | graceful degrade (fallback to partial state) |

### Concurrency Note

`load_snapshot` acquires `Mutex<Repository>` from a tokio task, while `load_bootstrap_state`
acquires it synchronously. They can interleave — the mutex serializes all access.

---

## broadcast_runtime_snapshot — Event Emitter

| item | value |
|---|---|
| VA | `0x1001e3858` |
| event name | `runtime-state-updated` (string @ `0x100ee16ed`) |
| payload | `CoreSnapshotPayload` (same as load_snapshot response) |
| is_upstream | `true` |

**Side effects**:
1. Updates `DISPLAY_SNAPSHOT_CACHE` @ `0x101390058` (OnceLock, mutex-protected)
2. `refresh_tray_menu_with_snapshot` @ `0x1003348b4`
3. If arg[3] is 11 bytes == `"progressive"` → 
ote_usage_refresh_activity` @ `0x100262428`

Callers of `broadcast_runtime_snapshot` include account state change paths (outside this cluster's scope).

---

## auto-switch-pending Event

Backend string `"runtime-notify"` + `"auto-switch-pending"` @ `0x100f39315`.  
Emitter: auto-switch pending watcher thread body @ `0x10052aab4` (spawned by
`start_auto_switch_pending_watcher` @ `0x100263444` — documented in boot_spawn_threads leaf).  
Full watcher body: `accepted_unknown` (size 0x8a4, budget rule). Payload not assessed.  
`is_upstream: false` (source archive-extra).

---

## Gate Matrix

| leaf | consumer_tier | gate | dims_closed | ceiling |
|---|---|---|---|---|
| `load_snapshot` | `strictImplementationUse` | pass | dim1-5 | dim6 not assessed |
| `broadcast_runtime_snapshot` | `strictImplementationUse` | pass | dim1-5 | dim6 not assessed |
| `auto-switch-pending emitter` | `consumerStartReady` | pass (partial) | dim1,5 | body accepted_unknown |

**All cluster functions enumerated. Init loop closed at strict.**
