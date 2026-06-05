# System Diff — set_relay_provider_network

## Platform Artifacts
- macOS: AiMaMi 1.0.9 arm64, confirmed
- Windows: Unknown

## Frontend IPC / Control-flow
- Unknown; command: `set_relay_provider_network`; dispatch_closure: 0x10031d8c8; argKeys: {providerId, network}

## Backend Commands / Pseudocode / Call-tree
- Dispatch closure: 0x10031d8c8; true owner: 0x1001e28e4 (hfd713d2139c85809, ~0x2dc)
- Core: RelayManager::set_provider_network (0x1001c99d8, size=0x3fc)
- CORRECTED from prior seed (owner was listed as TBD/dispatch-only)
- Idempotent path: network==new_network -> return clone, no mutation
- Field writes: network@+205(byte), updated_at@+192(i64)
- persist → atomic_write(relay.json) + memmove(state+32, 0x128)
- breaker::record_success (0x1001592a0)
- NO Keychain, NO tray, NO config.toml

## Interface / Error / Boundary
- Request: {providerId, network(u8)}; Response: CoreEnvelope<RelayProvider> (0x120 bytes)
- Idempotent early return documented (not error)
- Errors: provider_not_found, persist_IO

## Gate Leaf
- strictImplementationUse: true; readyToImplement: false

## Unknown
- Frontend CCF; Windows evidence; network enum value names (beyond 0=default)
