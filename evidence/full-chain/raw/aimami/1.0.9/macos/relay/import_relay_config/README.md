# AiMaMi 1.0.9 macos relay/import_relay_config

同步时间: 2026-06-02T14:20+08:00
范围: macos arm64 backend command owner + core import helper pseudocode
最终结论: strictImplementationUse — dim1-5 closed, dim6 empty

## 证据索引

- owner: codexmate_lib::commands::relay::import_relay_config::h4b907bb99e0e8d6f @ 0x1001e0468
- handler closure: 0x10032a498
- core helper: RelayManager::import_config @ 0x1001c8554
- persist helper: RelayManager::persist @ 0x1001cf304
- terminal: atomic_write::write_atomic @ 0x1006729f8 (via storage::save)
- side-effect: tray_menu::refresh_tray_menu @ 0x100331688
- source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

## Coverage

- owner pseudocode: decompiled ✓
- import_config pseudocode: decompiled ✓
- call-tree: 12 edges, depth=5 (storage::save→atomic_write), terminated ✓
- interface/DTO: closed ✓
- error paths: closed ✓
- side effects: closed ✓ (relay.json write + tray menu refresh + config.toml sync)
- frontend_ccf: unknown
- platform: macOS confirmed; Windows Unknown

## Per-target Result Matrix

| Dimension | Status |
|---|---|
| frontend control-flow | unknown (not in scope) |
| backend owner + pseudocode | Accepted — decompiled 0x1001e0468 + 0x1001c8554 |
| call-tree to implementation leaf | Accepted — depth 5, fs_write_leaf + process_leaf |
| interface / DTO / error / side-effect | Accepted |
| same-platform gate (macOS) | Accepted |
| test/acceptance mapping | empty per task spec |

## Frontend Control Flow

unknown — not in scope.

## Backend Control Flow / Pseudocode / Call-tree

import_relay_config (0x1001e0468)
  └─ RelayManager::import_config (0x1001c8554)
       ├─ io::parse_import_file (0x1001c43d8) — parse .aimami-relay.json
       ├─ Mutex::lock
       ├─ RelayState::clone
       ├─ io::apply_import_to_state (0x1001c4d48) — merge providers
       ├─ RelayManager::persist (0x1001cf304)
       │    ├─ compose_proxy_status (0x1001c8fb4)
       │    └─ storage::save (0x1001d182c)
       │         └─ atomic_write::write_atomic [FS TERMINAL]
       ├─ sync_codex_config_with_outcome (0x1001cc828) [if providers changed]
       └─ Mutex::unlock
  └─ tray_menu::refresh_tray_menu (0x100331688) [PROCESS TERMINAL]

## Interface / Error / Boundary

### Request
```json
{ "filePath": "/path/export.aimami-relay.json" }
```

### Response Ok
```json
{ "filePath": "<imported path>", "rewritten_to": "<normalized>" }
```

### Errors
- File parse error → CoreError propagated
- Persist failure → CoreError propagated
- sync_codex_config failure → CoreError propagated
- No rollback on partial sync failure

### Side Effects
- Reads import file from filePath
- Acquires RelayManager mutex, merges providers, writes relay.json atomically
- If providers count changed: syncs Codex config.toml (router injection)
- Calls refresh_tray_menu on success

## Gate Leaf Status

gate: strictImplementationUse
dim1-5: Accepted
dim6: empty
readyToImplement: false

## Unknown / Missing

- frontend_ccf: unknown
- Windows: Unknown
- apply_import_to_state internal merge logic: partially traced (accepted_unknown)
- sync_codex_config_with_outcome internal detail: accepted_unknown

## Action / Non-action

IMPLEMENTS: import relay providers from .aimami-relay.json file into relay state, persist, and sync config.
