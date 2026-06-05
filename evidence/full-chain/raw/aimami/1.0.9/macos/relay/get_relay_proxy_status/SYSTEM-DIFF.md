# System Diff — get_relay_proxy_status

## Platform Artifacts
- macOS: AiMaMi 1.0.9 arm64, confirmed
- Windows: Unknown

## Frontend IPC / Control-flow
- Unknown; command: `get_relay_proxy_status`; no argKeys

## Backend Commands / Pseudocode / Call-tree
- Owner: 0x1001e2294 (size=0xf8); core: RelayManager::compose_proxy_status (0x1001c8fb4)
- proxy_running flag at state+32; port at state+40(u16)
- Format templates: anon_168("127.0.0.1:{}"), anon_166("{}")
- None sentinel for inactive: xmmword_100EDC0E0@+40

## Interface / Error / Boundary
- Request: none; Response: ProxyStatus{active, port, hostStr, portStr, proxyAddr}
- Mutex poisoned: all zero/false

## Gate Leaf
- strictImplementationUse: true; readyToImplement: false

## Unknown
- Frontend CCF; Windows platform
