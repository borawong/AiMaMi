# System Diff — import_relay_config (macos 1.0.9)

## Platform Artifacts

- macOS arm64: confirmed; sha256 1db044e8efab
- Windows x64: Unknown

## Frontend IPC / Control-flow

- IPC command string: "import_relay_config" @ 0x100f2efa5
- Frontend CCF: unknown
- Args from backend: filePath (String), AppHandle (implicit Tauri)

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

- Owner: 0x1001e0468 (decompiled)
- Core helper: RelayManager::import_config @ 0x1001c8554 (decompiled)
- Depth: 5 (atomic_write terminal)
- Side-effect: relay.json write + config.toml sync + tray menu refresh

## Interface / Error / Boundary

- Args: filePath: String
- Response Ok: {filePath, rewritten_to}
- Errors: file parse / persist / sync failures → CoreError propagated
- No rollback on partial failure

## Gate Leaf

- macOS: strictImplementationUse
- Windows: Unknown

## Plugin / Capability

- n/a

## OTA / Package

- n/a

## Resource / Binary Surface

- Reads import file; writes relay.json (atomic); injects config.toml router; updates tray menu

## Unknown

- frontend_ccf: unknown
- Windows: Unknown
- apply_import_to_state merge logic detail: accepted_unknown
