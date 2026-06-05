# System Diff — export_relay_config (macos 1.0.9)

## Platform Artifacts

- macOS arm64: AiMaMi 1.0.9 Mach-O; sha256 1db044e8efab; confirmed
- Windows x64: Unknown (not in scope of this pass)

## Frontend IPC / Control-flow

- IPC command string: "export_relay_config" @ 0x100f2ef92
- Frontend CCF: unknown (not extracted in this cluster pass)
- Expected args from backend deserialization: filePath (String), includeApiKey (bool)

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

- Owner: codexmate_lib::commands::relay::export_relay_config @ 0x1001e01c8
- Depth: 5 edges
- Terminal: atomic_write::write_atomic (fs_write_leaf) @ 0x1006729f8
- Helper: io::export_to_file @ 0x1001c373c (decompiled)
- Helper: RelayManager::snapshot @ 0x1001cfc44 (decompiled, reused helper)
- Helper: keychain::get_api_key @ 0x1001598b8 (conditional on includeApiKey)

## Interface / Error / Boundary

- Args: filePath: String, includeApiKey: bool
- Response Ok: {filePath, rewritten_to, providers_count, include_api_key}
- Response Err: CoreError code 9 (serde or io error)
- Envelope: CoreEnvelope discriminant 2 (Ok) / 0x8000000000000000 (Err)
- No relay.json mutation

## Gate Leaf

- macOS: strictImplementationUse
- Windows: Unknown

## Plugin / Capability

- n/a

## OTA / Package

- n/a

## Resource / Binary Surface

- Reads RelayManager state (in-memory snapshot)
- Writes export file to user-specified path
- Reads system keychain (conditional)

## Unknown

- frontend_ccf: unknown (not in scope)
- Windows platform evidence: Unknown
- Keychain read error path detail: accepted_unknown (get_api_key internal error handling not traced)
