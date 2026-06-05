# boot_spawn_threads — Interface

**Leaf**: boot_spawn_threads  **Binary SHA**: 1db044e8efab  **Platform**: macos  
**Produced**: 2026-06-02  Gate: no promotion.

## Thread Summary Table

| Thread | Spawner VA | Body VA | Type | Fire-and-forget | Daemon | Timeout |
|--------|-----------|---------|------|-----------------|--------|---------|
| usage_refresh_watcher | `0x10026254c` | spawn closure | std OS thread | Yes | No | No (runs until app exit) |
| account_attach_monitor | `0x100262db4` | `0x100529504` | std OS thread | Yes | No | Yes (~120s) |
| auto_switch_pending_watcher | `0x100263444` | separate closure | std OS thread | Yes | No | Unknown |
| hotspot_window | `0x100432244` (shim) | — | std OS thread | Unknown | No | Unknown |

## IPC Trigger vs Boot-Spawn

- `start_usage_refresh_watcher`: Named as IPC command (Group B), but also called at boot. Guarded by atomic to prevent double-spawn.
- `begin_add_account_attach_monitor`: Named as IPC command (Group B); callable from frontend AND boot.
- `start_auto_switch_pending_watcher`: Boot-only internal, not exposed as IPC command string to frontend.

## Side Effects

| Effect | Thread | Evidence |
|--------|--------|----------|
| Atomic `USAGE_REFRESH_WATCHER_STARTED` set to 1 | usage_refresh_watcher | Decompile @ `0x10026254c` |
| `update_usage_refresh_schedule` call | usage_refresh_watcher | Callee @ `0x100262c90` |
| `note_usage_refresh_activity` call | usage_refresh_watcher | Callee @ `0x100262428` |
| `Repository::load_snapshot_local` (fs read) | account_attach_monitor | Callee @ `0x1005e8e58` |
| `schedule_full_runtime_refresh` on account change | account_attach_monitor body | Callee @ `0x100262aec` |
| WryHandle ref-count increment | all threads | `atomic_fetch_add_explicit` in spawners |

## Error Paths

| Error string | VA | Thread |
|---|---|---|
| `"failed to spawn thread"` | `0x100ee46a9` | All three spawners |
| `"poisoned lock: another task failed inside"` | `0x100f305e9` | account_attach_monitor |
| CoreError on `load_snapshot_local` | inline | account_attach_monitor spawner |

## Polling/Timing

- **usage_refresh_watcher**: Interval from `Repository::get_usage_refresh_interval`; default 60 seconds; configurable
- **account_attach_monitor**: 2-second sleep per poll; total duration limit ~120 seconds (`0x77 ns` comparison: `Instant::elapsed <= 0x77` seconds = 119)
- **auto_switch_pending_watcher**: Interval unknown (body not decompiled); likely file-stat or short sleep
