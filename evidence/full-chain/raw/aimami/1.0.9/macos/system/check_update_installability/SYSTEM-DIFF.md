# System Diff — check_update_installability (macOS 1.0.9)

## Platform Artifacts

- macOS arm64: AiMaMi 1.0.9, SHA-256 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
- Windows: Unknown — not evidenced, must not be inferred from macOS

## Frontend IPC / Control-flow

- IPC command name: "check_update_installability" — present as demangled symbol, NOT found in packed rodata command-name strings
- Frontend trigger: Unknown — not evidenced
- argKeys: [] (confirmed from closure decompile — no args deserialized)
- Response: Tauri IPC envelope wrapping CheckUpdateInstallabilityResult struct

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

### macOS (Accepted)

| Layer | Address | Symbol | Role |
|---|---|---|---|
| Tauri closure | 0x1003290d4 | codexmate_lib::run::{{closure}}::{{closure}}::he40ace9fe98d1fb1 | IPC async handler body |
| Platform impl | 0x100578128 | codexmate_lib::platform::update::check_update_installability::h67162043a00e43b4 | Core logic |
| Platform helper | 0x100578020 | codexmate_lib::platform::update::is_app_translocation_path::h98e6351ad9c49f46 | Translocation predicate |

Call-tree depth: 3
Terminal leaves: __NSGetExecutablePath (OS API), xattr subprocess, InvokeResolver::respond

### Windows (Unknown)

No Windows evidence. Do not infer from macOS. Windows path logic (/Volumes/ is macOS-specific; Windows equivalent unknown).

## Interface / Error / Boundary

### macOS
- Input: no arguments
- Output struct: 75-byte struct with status_tag (String), exe_path (Option<String>), app_path (Option<String>), can_install (bool), is_translocation (bool), quarantine_cleared (bool)
- Status tags: "ok" / "read_only_location" / "app_translocation"
- Error handling: all errors silent (fallback values, no CoreError to frontend)
- Side effects: read-only xattr probe only

### Windows
- Unknown

## Gate Leaf

| Gate | macOS | Windows |
|---|---|---|
| consumerStartReady | true | Unknown |
| strictImplementationUse | true | Unknown |
| readyToImplement | false (dim6 empty) | Unknown |

## Plugin / Capability

N/A — system/update module, not plugin domain.

## OTA / Package

Not applicable to this leaf. check_update_installability probes installability preconditions; it does not perform OTA download or apply updates.

## Resource / Binary Surface

- macOS-specific: /AppTranslocation/ path detection, /Volumes/ prefix check, NSGetExecutablePath, xattr command
- No Windows-equivalent paths identified

## Unknown

- Frontend IPC trigger / command name string in rodata
- Windows behavior and equivalent path checks
- primary_window_tag exact frontend semantics
- test/acceptance mapping (dim6)
