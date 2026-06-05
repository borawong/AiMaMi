# AI Handoff — import_relay_config (windows-x64)

status: strictImplementationUse
evidence_root: <source-location>/raw/aimami/1.0.9/windows/relay/import_relay_config/
versions: 1.0.9
platforms: windows-x64
session: C-config-passthrough-diag-20260602
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

target_universe: [import_relay_config]
locator_audit: A-level string xref "import_relay_config"@0x141269126 → dispatcher@0x1402663e0 → owner@0x140270420
coverage: 1/1

owner_resolution_status: accepted (A-level)
full_app_coverage_status: not-full-app (backend only, this session)

per_target_required_results:
  import_relay_config:
    owner: import_relay_config_owner_sys@0x140270420 (accepted, A-level)
    pseudocode: decompiled (IDA Hex-Rays, same binary SHA)
    call_tree: depth=5, terminal=sub_14006AA80 (persistence_commit)
    interface: filePath(str,required)
    error_path: state-read-error, manager-not-found, filePath-missing, file-read-failure, parse-error, apply-failure
    side_effect: reads file from filePath; replaces all relay providers in state; persists to config.toml
    frontend_ccf: NOT COVERED this session
    test_acceptance_mapping: NOT COVERED

frontend_ccf_status: not_covered
backend_ccf_status: accepted (owner@0x140270420)
pseudocode_status: decompiled (status=decompiled, source=ida, sha=a5822387fa3f56dc)
call_tree_status: accepted (depth=5, terminal=persistence_commit)
interface_status: accepted (filePath confirmed)
error_path_status: accepted
boundary_status: accepted_unknown (apiKey encryption in imported state; replace vs merge semantics)
gate_leaf_status: strictImplementationUse

scripts: []
unknowns:
  - Whether apiKeys in import file stored encrypted or plaintext in relay state (accepted_unknown)
  - Exact importedCount/skippedCount response fields vs boolean (accepted_unknown)
  - activeByIde merge/replace semantics after import (accepted_unknown)

do_not_infer:
  - Windows evidence must not be inferred from macOS
  - Import is DESTRUCTIVE replace (not merge) — do not assume merge behavior
