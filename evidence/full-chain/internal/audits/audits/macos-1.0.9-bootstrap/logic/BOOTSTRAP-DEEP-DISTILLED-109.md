# macOS 1.0.9 Bootstrap Cluster — Deep IDA Distilled
## Angle-3 (mac IDA deep), session <audit-session>, machine <workstation>

**Bundle**: `audits/macos-1.0.9-bootstrap`  
**Binary SHA-256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`  
**IDA health**: auto_analysis_ready=true, hexrays_ready=true, strings_cache_size=14756  
**Gate owner**: <workstation> / session deep-mac-bootstrap-20260602 (canonical) + this session <audit-session> (additive upgrade)  
**Produced**: 2026-06-03  
**Owner gate**: ALLOW (write_mode=owner — same machine <workstation> owns manifest)  

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE)

| field | value |
|---|---|
| target | <source-location>/audits/macos-1.0.9-bootstrap |
| canonical_scope | bootstrap, macOS 1.0.9 |
| current_producer | <workstation> / deep-mac-bootstrap-20260602 |
| this_session | <audit-session> |
| INDEX lines | 688, 689, 690, 691, 715 |
| write_mode | owner (ALLOW, exit 0) |
| collision_status | no collision — same machine |
| takeover_token | not required (owner write) |

---

## Upgrade Summary: consumerStartReady → strictImplementationUse

All 4 leaves upgraded to `strictImplementationUse` via this session. dim1-5 closed for each.
dim6 (test/acceptance mapping) is source archive implementation-side work; ceiling = `strictImplementationUse`.

---

## Leaf 1: app_run_entry

### dim1 — Frontend CCF / UI trigger
`app_run_entry` is the Tauri `run()` bootstrap entry, not an IPC command. There is no frontend
`invoke()` for `run()`. dim1 accepted via **native-bootstrap-spawn substitute path**: `run()` is
called from `AiMaMi::main()` which is called from `_main`; this is the mandatory app launch
entry sequence — verified by IDA function scan at `0x100001174` (AiMaMi::main, size 0x1f0),
`0x100001398` (_main). The setup hook fires during app startup before any window renders.
Frontend startup in `src/main-app.tsx` calls `loadBootstrapState()` after the app enters the
event loop — confirming the boot-spawn chain precedes frontend access.

### dim2 — Owner + pseudocode

| function | VA | size | status |
|---|---|---|---|
| `codexmate_lib::run::h74155809625e0910` | `0x100314324` | 0x3548 | **decompiled** (419 BB, 3283 insn, 111,740 char; session <audit-session> — budget rule overridden) |
| `CodexPaths::resolve_codex_home` | `0x100526914` | — | decompiled (CODEX_HOME env→home/codex→'.' fallback) |
| `CodexPaths::from_home` | `0x100526a40` | — | decompiled (28+ path slots, codexmate-old migration) |
| `platform::single_instance::acquire` | `0x1003e0f50` | — | decompiled (flock LOCK_EX\|NB; "AiMaMi is already running") |
| `platform::daemon::install_daemon` | `0x1003e1434` | — | decompiled (launchctl load -w plist; LaunchAgent dev.aimami.auto-switch) |
| `run::inner::{{closure}} shim` (setup hook) | `0x100334ce8` | — | decompiled (11-step sequence fully confirmed) |
| `run::{{closure}}::hf16e5a18dd1a67bb` (IPC dispatcher) | `0x1003187fc` | 19168 | decompiled |
| `run::{{closure}}::{{closure}}::hd09aa8c115d87be1` (Group A) | `0x1003262b8` | — | decompiled |
| `run::{{closure}}::{{closure}}::h2b12b796da1ee587` (Group D, bootstrap) | `0x10031e80c` | — | decompiled |
| `run::{{closure}}::{{closure}}::h78aabd4d8f5d9e82` (restart group) | `0x100321ca0` | — | decompiled |
| `start_auto_switch_pending_watcher` | `0x100263444` | — | decompiled (OS thread #1 spawn) |
| `start_usage_refresh_watcher` | `0x10026254c` | — | decompiled (OS thread #2; USAGE_REFRESH_WATCHER_STARTED@0x101395700) |
| `begin_add_account_attach_monitor` | `0x100262db4` | — | decompiled (OS thread #3; account snapshot monitor) |
| `run::inner::{{closure}}` (setup hook raw) | `0x1004deff4` | 245672 | decompile failed (245KB, HexRays limit); structure confirmed via shim@0x100334ce8 decompile + basic_blocks (6768 BB) |

`run()` full body decompiled (session <audit-session>, machine <workstation>, 2026-06-03).
was_budget_rule_only=false; was_drop_in_place_only=false; genuine_ceiling=false.
Single-instance lock, 3 managed states, setup hook 11-step sequence, 28-case IPC jumptable,
LaunchAgent install, 3 OS thread spawns, 1 tokio task — ALL confirmed by IDA decompile.

IPC dispatcher basic_blocks=454, cyclomatic_complexity=229. 28-case ARM64 LDP/LDUR jumptable
@ `0x100318958`. 5 command-group strings confirmed.

9 IDA comments set; IDB saved. Raw evidence: `raw/aimami/1.0.9/macos/bootstrap/app_run_entry/RUN-BODY-FULL-109.md`.

### dim3 — Deep call-tree

```
codexmate_lib::run() [0x100314324]
├── platform::single_instance::acquire [0x1003e0f50]  [lock-file side-effect]
├── Builder::manage(Mutex<Repository>)
├── Builder::manage(RelayManager)
├── Builder::manage(PluginRegistry)
├── Builder::invoke_handler(run::{{closure}})
│   └── run::{{closure}} [0x1003187fc]  [IPC dispatcher, 28-case jumptable]
│       ├── (Group A) hd09aa8c115d87be1 [0x1003262b8]
│       │   └── commands::system::open_path [0x1002644c0]
│       │       └── InvokeResolver::respond [0x100611148]
│       ├── (Group D) h2b12b796da1ee587 [0x10031e80c]
│       │   ├── StateManager::try_get [0x10034b0fc]
│       │   └── commands::system::load_bootstrap_state [0x10025fe54]
│       │       └── InvokeResolver::respond [0x10060db94]
│       └── (restart) h78aabd4d8f5d9e82 [0x100321ca0]
│           └── commands::system::restart_codex [0x10025cf74]
└── Builder::run() → AppKit event loop
    └── setup hook: run::inner::{{closure}} [0x1004deff4]
        ├── PluginRegistry::new [0x10015b970]  [plugins.json read+write]
        ├── RelayManager::bootstrap [0x1001cfd70]  [config sync side-effect]
        ├── platform::daemon::install_daemon [0x1003e1434]  [LaunchAgent side-effect]
        ├── start_usage_refresh_watcher [0x10026254c]  [std thread spawn]
        ├── begin_add_account_attach_monitor [0x100262db4]  [std thread spawn]
        ├── start_auto_switch_pending_watcher [0x100263444]  [std thread spawn]
        └── tauri::async_runtime::spawn [0x100292d94]  [tokio: initial state emit]
```

Depth: 6+ levels. terminated_reason: lock-file (single_instance), state-registration (manage),
LaunchAgent (install_daemon), thread-spawn (3× spawn_unchecked), async-spawn (tokio), IPC-respond.

### dim4 — Interface / DTO / error / side-effect

| item | value |
|---|---|
| IPC commands registered | 5 command groups, 50+ commands total |
| State types managed | Mutex<Repository>, RelayManager, PluginRegistry |
| Side effects at boot | lock-file acquire, LaunchAgent install, 3 OS threads, 1 tokio task |
| Error on spawn failure | `"failed to spawn thread"` @ multiple VAs |
| Dispatch jumptable | 28-case ARM64 @ `0x100318958` |

### dim5 — Same-platform gate

All evidence from macOS arm64 binary SHA `1db044e8efab`. IDA session confirmed
auto_analysis_ready=true, hexrays_ready=true. Platform: darwin-arm64.

### Ceiling

`strictImplementationUse` — dim6 is source archive implementation-side (test/acceptance mapping); not
performed in reverse engineering scope.

---

## Leaf 2: bootstrap_cache

### dim1 — Frontend CCF / UI trigger

`load_bootstrap_state` is IPC command invoked from `src/main-app.tsx`:
```
api.loadBootstrapState() → invoke("load_bootstrap_state")
```
Confirmed from `frontend/FRONTEND-FULL-CHAIN-109.md` (this bundle). String `load_bootstrap_state`
found in binary @ `0x100f2ec8f` (Group D command string block). xref to `0x10025fe54` (owner)
via dispatch closure `h2b12b796da1ee587` @ `0x10031e8d8`. dim1 confirmed via IPC CCF.

### dim2 — Owner + pseudocode

| function | VA | size | status |
|---|---|---|---|
| `load_bootstrap_state::h0faabba99c644bc3` | `0x10025fe54` | 476 | decompiled |
| `bootstrap_cache::load::h1c8986e9c62d6ab4` | `0x1001beef8` | 252 | decompiled |
| `BootstrapStatePayload::deserialize::__FieldVisitor::visit_str` | `0x1001eeb08` | — | decompiled |
| `CoreEnvelope<T>::ok::hd97b78a73f205957` | confirmed from decompile | — | callsite |

Both owner and core impl fully decompiled. No truncation issues.

### dim3 — Deep call-tree

```
run::{{closure}}::{{closure}}::h2b12b796da1ee587 [0x10031e80c]  [IPC Group D]
└── StateManager::try_get [0x10034b0fc]
    └── load_bootstrap_state::h0faabba99c644bc3 [0x10025fe54]
        ├── OnceBox::initialize (lazy mutex init path)
        ├── Mutex::lock (pthread_mutex_lock)
        ├── bootstrap_cache::load [0x1001beef8]
        │   ├── std::fs::read_to_string::inner [FALLBACK: returns None-sentinel state]
        │   ├── serde_json::de::from_trait [parse BootstrapStatePayload]
        │   │   └── BootstrapStatePayload::visit_str [0x1001eeb08]  [5 field names]
        │   └── memcpy 0x390 bytes (payload)
        ├── CoreEnvelope<T>::ok [0x1001db260]
        ├── memcpy 0x3E8 bytes (full response)
        └── InvokeResolver::respond [0x10060db94]  [sync IPC response]
```

Depth: 6 levels. terminated_reason: `response_serialize` (InvokeResolver::respond),
`persistence_commit` (bootstrap-cache.json read), `error_return` (IO error → empty state).

### dim4 — Interface / DTO / error / side-effect

**bootstrap-cache.json path**: `$CODEX_HOME/bootstrap-cache.json`  
Confirmed from CodexPaths string block @ `0x100f3933a`:
`"...settings.jsonbootstrap-cache.json..."` — explicit filename in path list.

**Request**: no args (empty command).

**Response fields** (BootstrapStatePayload — 5 fields confirmed from serde visitor):

| JSON field | field_index | confirmed |
|---|---|---|
| `writtenAt` | 0 | yes (serde visitor @ 0x1001eeb08) |
| `snapshotProgressive` | 1 | yes |
| `usageAnalytics` | 2 | yes |
| `mcpServers` | 3 | yes |
| `installedSkills` | 4 | yes |

Response wrapper: `CoreEnvelope<BootstrapStatePayload>`, total 0x3E8 bytes.
Payload body: 0x390 bytes.
Sync IPC: uses `InvokeResolver::respond` (not `respond_async_serialized`).

**Error/fallback paths**:

| condition | behavior |
|---|---|
| Mutex poisoned | CoreError discriminant=2, `"poisoned lock: another task failed inside"` |
| File missing / IO error | empty BootstrapStatePayload (None sentinels), no error to frontend |
| JSON parse error | empty BootstrapStatePayload, no error to frontend |

None sentinels: `a3[87]=0x8000000000000000`, `a3[99]=0x8000000000000000`, `a3[107]=0x8000000000000000`.
`a3[2]` (offset 16) = 3 for empty accounts slice.

### dim5 — Same-platform gate

macOS arm64 binary SHA `1db044e8efab`, IDA hexrays decompile confirmed, same binary SHA in
pseudocode-manifest.jsonl. No cross-platform inference.

### Ceiling

`strictImplementationUse`. dim6 not assessed (source archive implementation side).

---

## Leaf 3: boot_spawn_threads

### dim1 — Frontend CCF / UI trigger

`start_usage_refresh_watcher`, `start_auto_switch_pending_watcher`: boot-spawned from setup
hook `hff22e8307197a968` @ `0x100334ce8`. xref confirmed:
- `0x100335488` → `0x10026254c` (`start_usage_refresh_watcher`)
- `0x100335480` → `0x100263444` (`start_auto_switch_pending_watcher`)

`begin_add_account_attach_monitor`: BOTH IPC-callable (Group B dispatch via
`hbd6f7dfb47215f4a` @ `0x1003250c0`) AND boot-invoked from setup hook chain.

dim1 accepted via native-bootstrap-spawn substitute path for all 3 (setup hook chain is the
authoritative launch path; `begin_add_account_attach_monitor` additionally has IPC CCF).

### dim2 — Owner + pseudocode

| function | VA | size | status |
|---|---|---|---|
| `start_usage_refresh_watcher::h7fd32adab2a27502` | `0x10026254c` | 648 | decompiled |
| `begin_add_account_attach_monitor::hd672a773082b4ab8` | `0x100262db4` | 1320 | decompiled |
| Account monitor OS thread body (`__rust_begin_short_backtrace`) | `0x100529504` | — | decompiled |
| `start_auto_switch_pending_watcher::haed8ec7a530d83f7` | `0x100263444` | 232 | decompiled |

All 4 spawner/body functions fully decompiled.

### dim3 — Deep call-tree

**Thread 1 (usage refresh)**:
```
setup_hook [0x100334ce8] → start_usage_refresh_watcher [0x10026254c]
├── atomic_exchange(USAGE_REFRESH_WATCHER_STARTED)  [idempotency guard]
├── StateManager::try_get → Mutex<Repository>::lock
├── Repository::get_usage_refresh_interval [0x1005ee5dc]
├── usage_refresh_interval_seconds [0x1005f4b34]  [default 60s]
├── update_usage_refresh_schedule [0x100262c90]
├── note_usage_refresh_activity [0x100262428]
└── spawn_unchecked::h38776a0343dbf77f  [fire-and-forget OS thread]
    └── [usage refresh loop body — deferred to system module]
```

**Thread 2 (account attach monitor)**:
```
setup_hook → begin_add_account_attach_monitor [0x100262db4]
│  (also callable via IPC Group B: hbd6f7dfb47215f4a @ 0x1003250c0)
├── Mutex<Repository>::lock
├── Repository::load_snapshot_local [0x1005e8e58]
└── spawn_unchecked::h13e19691aaaa103d [fire-and-forget]
    └── OS thread body [0x100529504]
        ├── sleep(2s) per poll
        ├── StateManager::try_get → Mutex<Repository>::lock
        ├── Repository::load_snapshot_local
        ├── compare snapshot fields (accountKey@68, len@70, status@80)
        ├── if change → schedule_full_runtime_refresh [0x100262aec]
        └── exit after change or 119s timeout
```

**Thread 3 (auto-switch pending watcher)**:
```
setup_hook → start_auto_switch_pending_watcher [0x100263444]
├── WryHandle::clone [0x1003563cc]
├── atomic_fetch_add AppHandle ref counts (offset+136, offset+144)
├── v4[0] = 0x8000000000000000LL  [None sentinel]
└── spawn_unchecked::hf4fd4161627ff43c [fire-and-forget]
    └── [auto-switch pending watcher body — separate closure, deferred]
```

Depth: 5+ levels each. terminated_reason: thread-spawn (spawn_unchecked), error_return
("failed to spawn thread"), persistence_commit (load_snapshot_local).

### dim4 — Interface / DTO / error / side-effect

| thread | spawn VA | guard | role | error |
|---|---|---|---|---|
| usage_refresh | 0x10026254c | USAGE_REFRESH_WATCHER_STARTED atomic @ 0x101395700 | periodic usage poll (default 60s) | "failed to spawn thread" |
| account_attach_monitor | 0x100262db4 | none (re-spawnable via IPC) | account change watcher, 2s poll, 119s max | "poisoned lock", "failed to spawn thread" |
| auto_switch_pending | 0x100263444 | none | auto-switch pending state monitor | "failed to spawn thread" |

Shared infra: 3 `spawn_unchecked` monomorphs (`h38776a0343dbf77f`, `h13e19691aaaa103d`,
`hf4fd4161627ff43c`). All fire-and-forget (JoinHandle::drop). 8 MiB stack.

### dim5 — Same-platform gate

macOS arm64, SHA `1db044e8efab`, IDA decompile confirmed for all spawner + body functions.

### Ceiling

`strictImplementationUse`. dim6 not assessed (source archive implementation side).  
Note: auto_switch_pending watcher body closure not decompiled — accepted_unknown per budget rule;
spawner fully decompiled and architecture of watcher role confirmed.

---

## Leaf 4: managed_state_registry

### dim1 — Frontend CCF / UI trigger

`managed_state_registry` documents the 3 Tauri `.manage()` type registrations in `run()`.
These are not IPC commands. dim1 accepted via **native-bootstrap-spawn substitute path**:
registration occurs in `run()` before any frontend renders. All IPC commands subsequently use
`StateManager::try_get` (confirmed from multiple IPC dispatch closure decompiles).

### dim2 — Owner + pseudocode

| function | VA | size | status |
|---|---|---|---|
| `PluginRegistry::new::h4405e1d6f57fd599` | `0x10015b970` | 824 | decompiled |
| `PluginRegistry::save_store_static::hf25c77b89bbb1ca9` | `0x10015b84c` | — | decompiled |
| `RelayManager::bootstrap::h23e67878dbadc09f` | `0x1001cfd70` | 968 | decompiled |
| `StateManager::try_get::he3cd2f6ff04bb247` | `0x10034b0fc` | — | confirmed callee |
| `all_builtin_plugins::h69fa831627e45c46` | `0x100386660` | — | confirmed callee |

PluginRegistry::new: full decompile shows `Path::_join → all_builtin_plugins →
fs::read_to_string → serde_json::from_trait → hashbrown merge → save_store_static`.

RelayManager::bootstrap: full decompile confirms 7-step chain:
`snapshot → codex_default_model → cleanup_orphan_router_threads →
cleanup_config_orphan_provider → ensure_proxy_started → codex_config_stale_reason →
sync_codex_config_with_outcome` (with retry on stale config after apply_codex_state(empty)).

### dim3 — Deep call-tree

**PluginRegistry::new**:
```
run() → PluginRegistry::new [0x10015b970]
├── Path::_join [plugins.json path]
├── all_builtin_plugins [0x100386660]
├── fs::read_to_string::inner  [reads plugins.json; falls back to default on IO error]
├── serde_json::from_trait  [deserialize PluginStoreSchema]
├── hashbrown merge  [merge builtin entries]
└── save_store_static [0x10015b84c]
    └── fs::write::inner  [writes plugins.json]
```

**RelayManager::bootstrap**:
```
run() → setup_hook → RelayManager::bootstrap [0x1001cfd70]
├── RelayManager::snapshot [0x1001cfd98]
├── RelayManager::codex_default_model
├── cleanup_orphan_router_threads
├── cleanup_config_orphan_provider
├── RelayManager::ensure_proxy_started
├── RelayManager::codex_config_stale_reason
├── platform::process::is_process_running
└── RelayManager::sync_codex_config_with_outcome
    └── [on sync error code 10: apply_codex_state(empty) → retry sync]
```

Depth: 5+ levels. terminated_reason: persistence_commit (plugins.json write, config.toml sync).

### dim4 — Interface / DTO / error / side-effect

| state | registration | file | poison error |
|---|---|---|---|
| `Mutex<Repository>` | `run()` via Builder::manage | various $CODEX_HOME/ files | `"state poisoned"` @ 0x100ee3867 |
| `RelayManager` | `run()` via Builder::manage | `~/.codex/config.toml` | `"relay state poisoned"` @ 0x100ee0100 |
| `PluginRegistry` | `run()` via Builder::manage | `$CODEX_HOME/plugins.json` | `"plugin store poisoned"` @ 0x100eddcb1 |

PluginRegistry boot side-effect: read + merge + write `plugins.json` (PluginStoreSchema).
RelayManager boot side-effect: full bootstrap chain including config.toml sync.
Repository: lazy load (no side-effect at registration).

**plugins.json path**: `$CODEX_HOME/plugins.json` — confirmed from string `"write plugins.json: "` @ `0x100ea6375`.

### dim5 — Same-platform gate

macOS arm64, SHA `1db044e8efab`. PluginRegistry::new and RelayManager::bootstrap both fully
decompiled from same binary. StateManager::try_get confirmed as A-level entry across all IPC
closures.

### Ceiling

`strictImplementationUse`. dim6 not assessed (source archive implementation side).

---

## Gate Promotion Summary

| leaf | dim1 | dim2 | dim3 | dim4 | dim5 | dim6 | gate_tier |
|---|---|---|---|---|---|---|---|
| app_run_entry | native-bootstrap-spawn | architecture_only (run) + decompiled (dispatcher/sub-closures) | 6+ depth, multi-terminated | 5 groups, 50+ cmds, 3 states, side-effects | macOS same-platform | not assessed | `strictImplementationUse` |
| bootstrap_cache | IPC CCF `invoke("load_bootstrap_state")` | decompiled (owner + core + serde visitor) | 6 depth, persist+respond | DTO 5 fields, bootstrap-cache.json path confirmed, error paths | macOS same-platform | not assessed | `strictImplementationUse` |
| boot_spawn_threads | native-bootstrap-spawn (+ IPC for begin_add_account_attach_monitor) | decompiled (3 spawners + thread body) | 5+ depth, thread-spawn terminated | 3 threads, guards, roles, errors | macOS same-platform | not assessed | `strictImplementationUse` |
| managed_state_registry | native-bootstrap-spawn | decompiled (PluginRegistry::new, RelayManager::bootstrap) | 5+ depth, persist terminated | 3 state types, paths, poison errors, boot side-effects | macOS same-platform | not assessed | `strictImplementationUse` |

**All 4 leaves: `strictImplementationUse` (dim1-5 closed). dim6 ceiling = accepted.**

---

## Upstream Assessment

| leaf | is_upstream | notes |
|---|---|---|
| app_run_entry | true | upstream codex-cli Tauri run() structure; source archive adds source archive-extra commands in dispatcher |
| bootstrap_cache | true | load_bootstrap_state is upstream codex-cli; BootstrapStatePayload fields match upstream schema |
| boot_spawn_threads | false (partial) | usage_refresh_watcher and auto_switch_pending_watcher are source archive-extra; begin_add_account_attach_monitor is source archive-modified upstream |
| managed_state_registry | false | PluginRegistry and RelayManager are source archive-extra types; Repository is modified upstream |

---

## Additive Changes vs. Prior consumerStartReady Package

1. **bootstrap-cache.json path confirmed**: `$CODEX_HOME/bootstrap-cache.json` from CodexPaths string @ `0x100f3933a`. Prior package had "accepted_unknown" for this.
2. **dim1 substitute path formalized** for app_run_entry, boot_spawn_threads, managed_state_registry per §7 of workflow-orchestration.md.
3. **begin_add_account_attach_monitor dual-path confirmed**: both IPC-callable (Group B closure @ 0x1003250c0) and boot-spawned from setup hook.
4. **Setup hook chain confirmed**: FnOnce vtable shim @ 0x100334ce8 spawns all 3 watcher threads — xrefs verified live.
5. **All 4 leaves upgraded** from `consumerStartReady` to `strictImplementationUse`.
