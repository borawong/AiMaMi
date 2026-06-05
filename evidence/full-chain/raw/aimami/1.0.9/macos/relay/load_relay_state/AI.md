# AI Handoff — load_relay_state

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/macos/relay/load_relay_state/
versions: 1.0.9
platforms: macos-arm64 (confirmed); Windows Unknown
target_universe: relay::load_relay_state command backend
session: relay-A-state-crud-20260602

owner_resolution_status: Accepted — 0x1001dff6c codexmate_lib::commands::relay::load_relay_state::h8ced6f0d700b9817

coverage:
  pseudocode: 1 file (command owner)
  call_tree: 12 nodes, depth=6, all terminals reached
  call_tree_file: call-trees/codexmate_lib::commands::relay::load_relay_state.jsonl

frontend_ccf_status: Unknown (accepted_unknown — no blocking impl decision)
backend_ccf_status: Accepted
pseudocode_status: Accepted — ida/pseudocode/0001_load_relay_state_owner_cmd_h8ced6f0.c
call_tree_status: Accepted — depth=6; terminals: TcpStream::connect_timeout, atomic_write::write_atomic(relay.json), RelayState::clone, apiKey_zero_loop, CoreEnvelope::ok, CoreError::fmt
interface_status: Accepted — no argKeys; response=RelayState(scrubbed); apiKey@+88 zeroed
error_path_status: Accepted — CoreError(proxy_start_fail), CoreError(storage_save), unwrap_failed(mutex_poisoned)
boundary_status: Accepted — macOS confirmed; Windows Unknown
gate_leaf_status: strictImplementationUse — all dim1-5 closed (dim1 Unknown accepted)

key_implementation_facts:
  - ensure_proxy_started: TCP probe 127.0.0.1:port 2x300ms; on fail -> CoreError
  - apiKey scrub: every RelayProvider at byte offset +88 (in 208-byte entry) zeroed before IPC return — SECURITY CRITICAL
  - apiKey scrub is vectorized/unrolled for >3 providers (4-at-a-time with stride 104 qwords)
  - RelayState snapshot: Mutex::lock -> clone -> Mutex::unlock
  - On proxy start: storage::save -> atomic_write::write_atomic(relay.json) as side-effect
  - No config.toml mutation in this command path

unknowns:
  - frontend_ccf: not analyzed
  - Windows: no platform evidence
  - ensure_proxy_started internal spawn mechanics: not fully decompiled (out of scope)

do_not_infer:
  - Windows behavior from macOS
  - proxy_start internal process spawn args from this analysis
