# System Diff — reset_codex_config (Windows 1.0.9 vs macOS)

## Platform Artifacts

| Platform | Binary | Status |
|----------|--------|--------|
| Windows x64 | AiMaM 1.0.9 win64.exe (sha256: a5822387...) | CONFIRMED (this bundle) |
| macOS | AiMaMi 1.0.9.app | NOT analyzed for this command |

**Platform policy**: Windows evidence is independent. macOS behavior of this command is Unknown.

## Frontend IPC / Control-flow

Windows: Unknown — not analyzed in this bundle
macOS: Unknown — not analyzed for this command

## Backend Commands / Control-flow / Pseudocode / Call-tree

### Windows x64

| Item | Value |
|------|-------|
| Command string VA | 0x141268d0a |
| Owner (Tauri handler) | tauri_cmd_reset_codex_config_handler @ 0x14026F590 |
| Business logic | relay_manager_reset_codex_config_impl @ 0x14014DF10 |
| Module (Rust) | codexmate_lib::core::relay::manager |
| Config writer | relay_codex_config_toml_write @ 0x140422D90 |
| Catalog remover | relay_remove_codex_router_catalog @ 0x1403A1780 |
| Fs leaf | relay_atomic_write_file @ 0x140332540 (MoveFileExW flags=9) |
| Call-tree depth | 5 |
| Pseudocode status | decompiled (IDA Hex-Rays) |

### macOS

Not analyzed — do not infer from Windows.

## Interface / Error / Boundary

| Field | Value |
|-------|-------|
| argKeys | [] (no frontend args) |
| response | Result<bool, Error> |
| bool meaning | true = preflight strip ran (router was active); false = only config strip |
| error type | IoError propagated via Tauri IPC |
| error string prefix | "write codex config.toml failed: " (Windows) |

## Gate Leaf

| Platform | Status |
|----------|--------|
| Windows x64 | strictImplementationUse (backend+call-tree+interface ACCEPTED; frontend CCF Unknown; test mapping not done) |
| macOS | Unknown — not analyzed |

## Plugin / Capability

Not applicable for this command.

## OTA / Package

Not applicable for this command.

## Resource / Binary Surface

- `~/.codex/config.toml`: read + write (stripped version)
- `~/.codex/codex_router_catalog.json`: conditional read + write/remove

## Unknown

- macOS behavior of reset_codex_config: Unknown
- Frontend CCF (both platforms): Unknown
- Exact relay_state internal flags for router-active branch: accepted_unknown
