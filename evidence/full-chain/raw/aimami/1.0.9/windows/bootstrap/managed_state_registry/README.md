# managed_state_registry — AiMaMi 1.0.9 Windows x64

同步时间: 2026-06-02
范围: bootstrap structural leaf — Tauri .manage() registered state types and registration VAs
产出级别: partial (pseudocode blocked — IDA MCP offline)

## 最终结论

Three managed states confirmed with A-level string evidence from THREAD-MODEL.md.
Registration helper sub_141208810 confirmed as universal registration endpoint.
State-manager handle unk_14126AC16 confirmed as Tauri AppState handle.
Pseudocode (sub_141208810, guard fns) blocked by IDA MCP offline.
Repository allocation: 976 bytes, align 8.

---

## 证据索引

- THREAD-MODEL.md §2: managed state type strings + VAs
- Binary SOT: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

---

## Per-target Result Matrix

| State Type | Type String | Guard VA | Registration VA | Alloc | Gate |
|-----------|-------------|---------|-----------------|-------|------|
| Repository | std::sync::poison::mutex::Mutex<codexmate_lib::core::repository::Repository> | 0x1400D93D0 | 0x141208810 | 976B align8 | partial |
| RelayManager | codexmate_lib::core::relay::manager::RelayManager | 0x1400D8020 | 0x141208810 | unknown | partial |
| PluginRegistry | codexmate_lib::core::plugins::registry::PluginRegistry | 0x1400D9820 | 0x141208810 | unknown | partial |

---

## Backend Control Flow / Call-tree

```
sub_140004B30 (run() bootstrap)
  │
  ├─ sub_140001360(976, 8)          ← allocate Repository (976 bytes, align 8)
  │
  ├─ sub_1400D93D0                  ← Repository guard/type-check
  │    └─ sub_141208810(unk_14126AC16, off_14126AC48, ...)
  │         └─ [TypeMap insert: Mutex<Repository>]
  │
  ├─ sub_1400D8020                  ← RelayManager guard/type-check
  │    └─ sub_141208810(unk_14126AC16, off_14126AC48, ...)
  │         └─ [TypeMap insert: RelayManager]
  │
  └─ sub_1400D9820                  ← PluginRegistry guard/type-check
       └─ sub_141208810(unk_14126AC16, off_14126AC48, ...)
            └─ [TypeMap insert: PluginRegistry]
```

Registration order is fixed and sequential in the binary.
All three use the same sub_141208810 helper and the same unk_14126AC16 state-manager handle.

---

## Interface / Error / Boundary

### State types (fully named from binary strings)

| State | Rust type | Module path |
|-------|-----------|-------------|
| Repository | `std::sync::poison::mutex::Mutex<codexmate_lib::core::repository::Repository>` | `codexmate_lib::core::repository` |
| RelayManager | `codexmate_lib::core::relay::manager::RelayManager` | `codexmate_lib::core::relay::manager` |
| PluginRegistry | `codexmate_lib::core::plugins::registry::PluginRegistry` | `codexmate_lib::core::plugins::registry` |

### Allocation

- Repository: sub_140001360(976, 8) — 976 bytes, align 8
- RelayManager: allocation VA not yet captured (pending decompile)
- PluginRegistry: allocation VA not yet captured (pending decompile)

### State access pattern (from relay recon, relay_manager SEED.md)

- Repository accessed via state.lock() in command handlers → `sub_1400DA7C0` (read lock in auto_switch_watcher_bootstrap)
- RelayManager accessed directly (no mutex) — `codexmate_lib::core::relay::manager::RelayManager` is Arc-wrapped internally
- PluginRegistry accessed via commands: list_plugins, toggle_plugin, get_plugin_config, update_plugin_config

---

## Gate Leaf Status

- consumerStartReady: candidate (state types confirmed, VAs confirmed)
- strictImplementationUse: false — guard fn and registration fn internals not decompiled
- readyToImplement: false
- implementation_use: false
- gate_accepted: false
- blocked_by: IDA MCP endpoint unreachable

### To unblock

1. Reconnect IDA MCP
2. `decompile 0x141208810` — TypeMap insert internals
3. `decompile 0x1400D93D0`, `0x1400D8020`, `0x1400D9820` — guard logic
4. Check RelayManager and PluginRegistry allocation sizes
5. Rename: `managed_state_register_sys` @ 0x141208810, guard fns
6. `set_comments` + `idb_save`

---

## Unknown / Missing

| Item | Status |
|------|--------|
| TypeMap insert internals (sub_141208810) | blocked_ida_offline |
| Guard fn semantics (panic vs return on double-register) | blocked_ida_offline |
| RelayManager allocation size | blocked_ida_offline |
| PluginRegistry allocation size | blocked_ida_offline |
| Repository field layout (fields within 976 bytes) | blocked_ida_offline; partial from relay SEED.md |

---

## Action / Non-action

- ACTION: Reconnect IDA, decompile sub_141208810, all three guard fns
- ACTION: Capture RelayManager and PluginRegistry allocation call sites
- NON-ACTION: Do not write readyToImplement before guard/registration internals confirmed
