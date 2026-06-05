# System Diff — load_relay_state

## Platform Artifacts
- macOS: AiMaMi 1.0.9 arm64 Mach-O, SOT SHA=985dae00
- Windows: Unknown — not analyzed; do not infer

## Frontend IPC / Control-flow
- Unknown — not analyzed this session
- Command name: `load_relay_state`
- No argKeys (parameterless IPC call)

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf
- Owner: 0x1001dff6c (macOS confirmed)
- Core chain: ensure_proxy_started(0x1001c91c0) → snapshot(0x1001cfc44) → RelayState::clone → apiKey_scrub → CoreEnvelope::ok(0x1001d9e60)
- Proxy auto-start: TcpStream::connect_timeout(127.0.0.1:port, 300ms, retry 2) + storage::save on start
- apiKey scrub: SIMD-unrolled (4-at-a-time, stride 208 bytes, offset +88)
- File write: relay.json via atomic_write::write_atomic (only if proxy newly started)

## Interface / Error / Boundary
- Request: no parameters
- Response: RelayState (scrubbed providers)
- apiKey@+88 = 0 in all returned RelayProvider entries
- Error: CoreError on proxy_start_fail or storage_save_fail
- Boundary: Windows Unknown; proxy spawn behavior not fully analyzed

## Gate Leaf
- strictImplementationUse: true (macOS)
- readyToImplement: false
- Blockers: frontend_ccf(Unknown), Windows(Unknown), dim6_test_acceptance(empty)

## Plugin / Capability
- N/A for this command

## OTA / Package
- N/A

## Resource / Binary Surface
- IDB: raw/binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
- SOT: raw/binary/AiMaMi 1.0.9.app

## Unknown
- Frontend CCF: not analyzed (accepted_unknown)
- Windows platform: no evidence (do not infer)
- ensure_proxy_started internal process spawn args: out of scope
