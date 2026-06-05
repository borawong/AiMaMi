# AI Handoff — get_relay_proxy_status

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/macos/relay/get_relay_proxy_status/
versions: 1.0.9
platforms: macos-arm64 (confirmed); Windows Unknown
session: relay-A-state-crud-20260602

owner_resolution_status: Accepted — 0x1001e2294 + core 0x1001c8fb4

coverage:
  pseudocode: 1 file (command_owner; compose_proxy_status decompiled inline via IDA)
  call_tree: 9 nodes, depth=5

frontend_ccf_status: Unknown (accepted_unknown)
backend_ccf_status: Accepted
pseudocode_status: Accepted
call_tree_status: Accepted — depth=5; terminals: mutex_init, mutex_lock, format_inner(host_str), format_inner(port_str), mutex_unlock, inactive_zero_path
interface_status: Accepted — ProxyStatus{active:bool@+74, port:u16@+72, hostStr, portStr, proxyAddr:Option@+48}
error_path_status: Accepted — Mutex_poisoned -> all_zero_fields
boundary_status: Accepted — macOS; Windows Unknown
gate_leaf_status: strictImplementationUse

key_implementation_facts:
  - ProxyStatus composed fresh on each call (not cached)
  - Proxy running: active=true, port read from state+40 (u16), host_str="127.0.0.1:{port}", port_str="{port}"
  - Proxy NOT running: active=false, port=0, all String fields empty, xmmword_100EDC0E0@+40 (Option::None sentinel)
  - Format templates: anon_168="127.0.0.1:{}", anon_166="{}"
  - Response layout: 5 owords (80 bytes) at a2+72..+152; d0=7 frame count (ABI)
  - state+32 = proxy_running flag (nonzero = running), state+40 = port (u16)

unknowns:
  - frontend_ccf (accepted_unknown)
  - Windows evidence
