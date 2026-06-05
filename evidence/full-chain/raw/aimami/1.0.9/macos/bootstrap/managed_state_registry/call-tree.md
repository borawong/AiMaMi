# managed_state_registry — Call Tree

**Leaf**: managed_state_registry  **Binary SHA**: 1db044e8efab  **Platform**: macos  
**Produced**: 2026-06-02  Gate: no promotion.

```
run() [0x100314324]
├── PluginRegistry::new [0x10015b970]                [state init side-effect]
│   ├── Path::_join → "plugins.json" path
│   ├── all_builtin_plugins [0x100386660]            → built-in plugin defs
│   ├── std::fs::read_to_string                     [fs read side-effect]
│   ├── serde_json::from_trait                       → PluginStoreSchema parse
│   ├── hashbrown::HashMap::rustc_entry              → merge built-ins
│   └── PluginRegistry::save_store_static [0x10015b84c] [fs write side-effect]
│       ├── PluginStoreSchema::serialize             → JSON bytes
│       └── std::fs::write::inner                   [persistence leaf]
│           └── terminated_reason: persistence_commit
├── Mutex::new(Repository)                           [state registration]
│   └── Repository state (30+ methods; loaded lazily per command)
├── RelayManager (constructed before .manage())
│   └── tauri::Builder::manage(RelayManager)
└── [setup hook fires after .run()]
    └── RelayManager::bootstrap [0x1001cfd70]        [bootstrap side-effect]
        ├── RelayManager::snapshot [0x1001cfc44]
        ├── RelayManager::codex_default_model [0x1001c8ab8]
        ├── cleanup_orphan_router_threads [0x10056bdd8]
        ├── cleanup_config_orphan_provider [0x10055d81c]
        ├── RelayManager::ensure_proxy_started [0x1001c91c0]
        ├── RelayManager::codex_config_stale_reason [0x1001cb514]
        ├── platform::process::is_process_running [0x100674aec]
        ├── RelayManager::sync_codex_config_with_outcome [0x1001cc828]
        └── relay::codex_writer::apply_codex_state [0x1004aef60] [config write leaf]
            └── terminated_reason: persistence_commit
```

**Depth**: 6+ levels.  **terminated_reason**: persistence_commit (plugins.json write, relay config write), external_call_recorded (is_process_running).  
**Call-tree evidence**: fully evidenced for dim3.
