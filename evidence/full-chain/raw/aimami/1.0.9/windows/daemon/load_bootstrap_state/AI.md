# AI Handoff — load_bootstrap_state (Windows 1.0.9)

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/windows/daemon/load_bootstrap_state
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
owner_resolution_status: Accepted — 0x140272E80 renamed load_bootstrap_state_owner_sys
call_tree_status: Accepted — depth 3, terminal leaves at JSON builders + ipc_resolve
interface_status: Accepted — argKeys=[], full BootstrapState DTO recovered from JSON builder string refs
error_path_status: Accepted — sub_141204520 CoreError path
boundary_status: Accepted — read-only, no side effects
gate_leaf_status: strictImplementationUse

response_dto:
  schemaVersion: string | field at 0x14127B499
  success: bool | field at 0x14127C95B
  code: string | field at 0x14127C7AD
  message: string | field at 0x14127C7B1
  data.executedAt: string (ISO date) | field at 0x14127C6A4
  data.runOnce: bool | field at 0x14127C6AE
  data.autoSwitchEnabled: bool | field at 0x14127C6B5
  data.activeAccountKey: string | field at 0x14127C664
  data.switchedAccountKey: string | field at 0x14127C6D2
  data.pendingSwitchAccountKey: string|null | field at 0x14127C6E4

unknowns:
  - frontend_ccf: Unknown
  - test_acceptance_mapping: empty_per_task_spec
