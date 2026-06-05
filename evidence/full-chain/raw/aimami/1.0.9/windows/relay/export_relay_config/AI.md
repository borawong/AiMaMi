# AI Handoff — export_relay_config (windows-x64)

status: strictImplementationUse
evidence_root: <source-location>/raw/aimami/1.0.9/windows/relay/export_relay_config/
versions: 1.0.9
platforms: windows-x64
session: C-config-passthrough-diag-20260602
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

target_universe: [export_relay_config]
locator_audit: A-level string xref "export_relay_config"@0x141269113 → dispatcher@0x1402663e0 → owner@0x14027A740
coverage: 1/1 (owner + call-tree + interface + side-effect + error-path)
coverage_mode: windows-backend-only-this-session

owner_resolution_status: accepted (A-level, string xref to dispatcher to owner)
full_app_coverage_status: not-full-app (backend only, this session)

per_target_required_results:
  export_relay_config:
    owner: export_relay_config_owner_sys@0x14027A740 (accepted, A-level)
    pseudocode: decompiled (IDA Hex-Rays, same binary SHA)
    call_tree: depth=6, terminal=relay_atomic_write_file_sys (external_call_recorded)
    interface: filePath(str,required), includeApiKeys(bool,required)
    error_path: manager-not-found, filePath-missing, includeApiKeys-missing, file-write-failure
    side_effect: atomic file write to filePath; no relay state mutation (read-only)
    frontend_ccf: NOT COVERED this session
    test_acceptance_mapping: NOT COVERED

frontend_ccf_status: not_covered (windows backend session)
backend_ccf_status: accepted (owner@0x14027A740 confirmed via string xref)
pseudocode_status: decompiled (status=decompiled, source=ida, sha=a5822387fa3f56dc)
call_tree_status: accepted (depth=6, terminal=external_call_recorded)
interface_status: accepted (filePath, includeApiKeys confirmed from disasm string literals)
error_path_status: accepted (manager/arg/write branches confirmed)
boundary_status: accepted_unknown (filePath path traversal validation not confirmed in this layer)
gate_leaf_status: strictImplementationUse (dim1-5 closed; frontend_ccf and test_acceptance not covered)

scripts: []
unknowns:
  - filePath path traversal validation — not confirmed in backend layer (accepted_unknown)
  - Exact schemaVersion value at runtime (accepted_unknown)
  - Whether exportedAt is Unix ms or local time ms (inferred Unix ms, accepted_unknown)

do_not_infer:
  - Windows evidence must not be inferred from macOS
  - filePath sanitization layer not confirmed — do not assume safe
