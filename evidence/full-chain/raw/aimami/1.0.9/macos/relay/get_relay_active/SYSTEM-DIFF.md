# System Diff — get_relay_active

## Platform Artifacts
- macOS: AiMaMi 1.0.9 arm64, confirmed
- Windows: Unknown

## Frontend IPC / Control-flow
- Unknown; command: `get_relay_active`; no argKeys

## Backend Commands / Pseudocode / Call-tree
- Command owner: 0x1001dfe4c (size=0xe4)
- Core: RelayManager::get_active (0x1001c83a4, size=0x194)
- active_providers at state+56 (Vec<String>)
- Mutex at state+16 (OnceBox lazy init), poisoned flag at state+24

## Interface / Error / Boundary
- Request: none; Response: Option<Vec<String>>; None sentinel {0,8,0}
- Mutex poisoned: None; OOM: abort; d0=7 is frame count (ABI artifact, not float)

## Gate Leaf
- strictImplementationUse: true; readyToImplement: false

## Unknown
- Frontend CCF; Windows platform
