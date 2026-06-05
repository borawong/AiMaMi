# AI Handoff — load_bootstrap_state

status: strictImplementationUse_dim1_5_closed_dim6_empty
evidence_root: <source-location>/raw/aimami/1.0.9/macos/system/load_bootstrap_state/
versions: 1.0.9
platforms: macos (arm64)
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

owner_addr: 0x10025fe54
owner_symbol: codexmate_lib::commands::system::load_bootstrap_state::h0faabba99c644bc3

call_tree_status: accepted, depth=2
pseudocode_status: accepted

interface:
  args: none (IPC command takes no user params)
  response: CoreEnvelope<BootstrapState> — Ok(BootstrapState) always; 0x3E8 bytes copied to IPC output
  response_path_ptr: a1+480 (path_ptr), a1+488 (path_len) — points to bootstrap cache file path in Repository
  error: only poisoned-lock → Err variant (discriminant 2 at *a2)

side_effects:
  - fs::read_to_string(bootstrap_cache_path) — read-only
  - No writes, no HTTP

dim1_frontend_ccf: accepted_native_callback — boot-spawn via run::{{closure}} (0x1003187fc) routes to load_bootstrap_state command
dim2-4: accepted
dim5: macos_confirmed_windows_unknown
dim6: empty

key_callees:
  - codexmate_lib::core::bootstrap_cache::load (0x1001beef8) — fs_leaf + parse_leaf
  - CoreEnvelope<T>::ok (0x1001db260) — response_leaf
  - memcpy(a2, out, 0x3E8) — output copy

error_behavior:
  - IOError on read: return empty BootstrapState (graceful degradation, not hard error)
  - ParseError on JSON: return empty BootstrapState
  - Poisoned mutex: return Err with discriminant=2

unknowns:
  - Bootstrap cache file path: stored at a1+480/488 in Repository struct (exact path not chased)
  - BootstrapState struct layout: 0x390 bytes from memcpy size
