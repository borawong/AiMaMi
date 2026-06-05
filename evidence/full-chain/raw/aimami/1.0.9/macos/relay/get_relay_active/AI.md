# AI Handoff — get_relay_active

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/macos/relay/get_relay_active/
versions: 1.0.9
platforms: macos-arm64 (confirmed); Windows Unknown
session: relay-A-state-crud-20260602

owner_resolution_status: Accepted — 0x1001dfe4c + core 0x1001c83a4

coverage:
  pseudocode: 2 files (command_owner + core_get_active)
  call_tree: 8 nodes, depth=5

frontend_ccf_status: Unknown (accepted_unknown — pure read, no impl blocker)
backend_ccf_status: Accepted
pseudocode_status: Accepted — 0001 (command owner) + 0002 (RelayManager::get_active)
call_tree_status: Accepted — depth=5; terminals: mutex_init, mutex_lock, Vec<String>::clone(@v3+56), mutex_unlock, ipc_frame
interface_status: Accepted — no args; response=Option<Vec<String>>; None sentinel {0,8,0}
error_path_status: Accepted — Mutex_poisoned -> None sentinel; OOM -> abort
boundary_status: Accepted — macOS confirmed; Windows Unknown
gate_leaf_status: strictImplementationUse

key_implementation_facts:
  - active_providers field at RelayManager.state+56 (Vec<String>)
  - None sentinel: {ptr=0, len=8, bool=0} (not null Vec — specific sentinel)
  - d0=7 return in __usercall ABI = IPC frame count, NOT a float (prior recon gap resolved)
  - Mutex poisoned flag at state+24; set to 1 on panic
  - Mutex pointer at state+16 (initialized lazily via OnceBox)
  - IPC layout: discriminant=2@+0, "ok"@+8, type_info@+16, "active"@+32, type_info@+40, Vec<String>@+72, Some(1)@+96

unknowns:
  - frontend_ccf (accepted_unknown)
  - Windows evidence
