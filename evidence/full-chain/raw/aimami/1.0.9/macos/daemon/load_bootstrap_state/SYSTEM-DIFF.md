# System Diff — load_bootstrap_state

## Platform Artifacts
- macOS: bootstrap cache at path from Repository struct (a1+480/488)
- Windows: Unknown path convention

## Backend
- bootstrap_cache::load: fs::read_to_string + serde_json
- Graceful fallback on all read/parse errors

## Interface / Error / Boundary
- Response: CoreEnvelope<BootstrapState>
- Always returns Ok (empty state on error, not CoreError)

## Gate Leaf
- macOS: strictImplementationUse
- Windows: Unknown
