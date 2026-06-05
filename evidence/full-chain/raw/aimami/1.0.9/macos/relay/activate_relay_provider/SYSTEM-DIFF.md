# System Diff — activate_relay_provider (macOS 1.0.9)

## Platform Artifacts

macOS arm64: AiMaMi 1.0.9 (SHA 1db044e8efab)
Windows: Unknown

## Frontend IPC / Control-flow

Unknown — backend-only pass. accepted_unknown.

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

| Item | macOS | Windows |
|---|---|---|
| Owner VA | 0x1001e23c8 (sync, non-async) | Unknown |
| Core VA | 0x1001cf510 (RelayManager::activate) | Unknown |
| Call-tree depth | 6 | Unknown |
| Error message | "relay provider {id} not found" | Unknown |
| persist | relay.json via atomic_write | Unknown |
| catalog | write_catalog if enabled+url+transport; remove_catalog otherwise | Unknown |

## Interface / Error / Boundary

| Field | Value |
|---|---|
| Input | providerId: String |
| Output | CoreEnvelope<RelayState> (0x128 bytes struct) |
| Error | CoreEnvelope<Err(String)>: "relay provider {id} not found" or CoreError |
| side_effect_1 | ensure_proxy_started (TcpStream probe) |
| side_effect_2 | RelayActiveByIde::add (IDE push) |
| side_effect_3 | relay.json write (atomic) |
| side_effect_4 | config.toml / codex catalog update |

## Gate Leaf

macOS: strictImplementationUse | Windows: Unknown

## Unknown

- Frontend CCF: accepted_unknown
- Windows: Unknown
- RelayActiveByIde data structure internals
