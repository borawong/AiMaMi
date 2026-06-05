# managed_state_registry — Interface

**Leaf**: managed_state_registry  **Binary SHA**: 1db044e8efab  **Platform**: macos  
**Produced**: 2026-06-02  Gate: no promotion.

## Registered State Summary

| State Type | Wrapper | Registration Site | Purpose |
|---|---|---|---|
| `PluginRegistry` | bare (no Mutex — internal sync) | `run()` @ `0x100314324` | Plugin list/config; persists to `plugins.json` |
| `Repository` | `Mutex<Repository>` | `run()` @ `0x100314324` | Account registry, settings, sessions, snapshots |
| `RelayManager` | bare (internal Arc/sync) | `run()` @ `0x100314324` | Relay providers, proxy, codex router config |

## State Acquisition Pattern

All IPC command handlers acquire state via:
1. `tauri::state::StateManager::try_get` @ `0x10034b0fc`
2. `tauri::state::State<T>::from_command::{{closure}}` @ `0x100d73fd8`

For `Repository`: Mutex is locked per command invocation; `MutexGuard<Repository>` dropped at command end.  
For `RelayManager`: acquired directly (no outer Mutex; RelayManager manages internal locking).  
For `PluginRegistry`: acquired directly; internal lock for write operations (Mutex-guarded plugin store).

## Side Effects at Boot

| State | Boot Side Effect | Path |
|---|---|---|
| `PluginRegistry` | Read + merge + write `plugins.json` | `PluginRegistry::new` → `save_store_static` |
| `Repository` | None at registration; lazy load per command | — |
| `RelayManager` | Full bootstrap: snapshot, cleanup, proxy, sync config | `RelayManager::bootstrap` @ `0x1001cfd70` |

## Error/Poison Paths

| Error string | VA | State |
|---|---|---|
| `"plugin store poisoned"` | `0x100eddcb1` | PluginRegistry internal Mutex |
| `"poisoned menu mutex"` | `0x100f2ff68` | Tauri tray/menu state |
| `"poisoned plugin store"` | `0x100f33505` | PluginRegistry (Tauri internal path) |
| `"relay state poisoned"` | `0x100ee0100` | RelayManager internal Mutex |
| `"state poisoned"` | `0x100ee3867` | Repository Mutex |
| `"Codex config still contains stale AiMaMi router/provider entries after repair"` | inline alloc in bootstrap | RelayManager::bootstrap error |

## Storage Paths

| State | Persistent File | Notes |
|---|---|---|
| `PluginRegistry` | `$CODEX_HOME/plugins.json` | Serialized `PluginStoreSchema` |
| `Repository` | Various in `$CODEX_HOME/` | registry, settings, snapshot, sessions |
| `RelayManager` | `~/.codex/config.toml` (relay providers) | Written via `apply_codex_state`, `sync_codex_config_with_outcome` |
