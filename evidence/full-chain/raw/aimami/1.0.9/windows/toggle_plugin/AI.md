# AI Handoff

status: blocked_no_promotion_static_only
evidence_root: <source-location>/raw/aimami/1.0.9/windows/toggle_plugin
intermediate_root: <source-location>/intermediate/aimami/1.0.9/windows/toggle_plugin
handoff_root: <source-location>/aimami/1.0.9/windows-x64/toggle_plugin
product: aimami
version: 1.0.9
platform: windows / windows-x64 handoff
leaf: toggle_plugin
kind: mutate/toggle plugin registry command
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
binary_size: 26821632

coverage:
  frontend_ccf_status: not_collected_for_this_windows_leaf
  backend_ccf_status: blocked_owner_not_recovered
  pseudocode_status: missing
  call_tree_status: diagnostic_blocked_placeholder_only
  interface_status: blocked_static_shape_only
  error_path_status: missing
  boundary_status: Windows same-platform scope declared; no macOS inference
  gate_leaf_status: blocked_no_promotion

unknownsBlockingStart:
- backend owner / pseudocode for the leaf
- PluginRegistry helper pseudocode and deep call-tree
- Windows runtime IPC execution trace
- DTO/error/envelope/side-effect parity
- executed acceptance mapping

allowedImplementationMode: none
forbiddenAssumptions:
- Do not treat command-string presence as handler proof.
- Do not treat descriptor recovery zero-candidate output as absence of behavior.
- Do not infer Windows plugin behavior from macOS evidence.
- Do not promote this workorder to strict or ready.

nextProducerStep:
Run bounded Windows owner recovery for $leaf, then Ghidra decompile the recovered owner and helper chain. Only after real same-binary pseudocode/call-tree/interface evidence exists should a reducer reconsider consumerStartReady.