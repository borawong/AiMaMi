# export_relay_config — Windows Evidence Leaf

**Sync time**: 2026-06-02  
**Binary**: AiMaMi 1.0.9 win64.exe  
**SHA-256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**Session**: C-config-passthrough-diag-20260602  
**Platform**: windows-x64  
**Scope**: relay cluster C-config-passthrough-diag  
**Final conclusion**: strictImplementationUse (dim1-5 closed; frontend_ccf pending)

## Evidence Index

| Artifact | Path |
|---|---|
| Owner pseudocode | ida/pseudocode/0001_export_relay_config_owner_sys_ha5822387.c |
| Pseudocode manifest | ida/pseudocode-manifest.jsonl |
| Call tree | call-trees/export_relay_config.jsonl |
| Evidence detail | evidence.md |
| Validation | validation/result.json |

## Coverage

- dim1 (frontend CCF): NOT COVERED (windows backend session)
- dim2 (owner/pseudocode): ACCEPTED — export_relay_config_owner_sys@0x14027A740, IDA decompile, same SHA
- dim3 (call-tree to leaf): ACCEPTED — depth 6, terminal relay_atomic_write_file_sys (external_call_recorded)
- dim4 (interface/DTO/error/side-effect): ACCEPTED — filePath, includeApiKeys, atomic file write, error branches
- dim5 (same-platform gate): ACCEPTED — windows-x64, independent evidence
- dim6 (test/acceptance mapping): NOT COVERED

## Per-target Result Matrix

| Dimension | Status | Notes |
|---|---|---|
| Frontend CCF | not_covered | windows backend session only |
| Backend owner | accepted | A-level, string xref @ 0x141269113 |
| Pseudocode | accepted | IDA Hex-Rays, sha a5822387fa3f56dc |
| Call-tree | accepted | depth 6, external_call_recorded terminal |
| Interface | accepted | filePath(str), includeApiKeys(bool) |
| Error path | accepted | manager/arg/write error branches |
| Side effect | accepted | atomic file write to filePath, no state mutation |
| Same-platform gate | accepted | windows-x64 independent |
| Test/acceptance | not_covered | |

## Backend Control Flow / Pseudocode / Call-tree

Owner: `export_relay_config_owner_sys` @ 0x14027A740 (1582 bytes)  
Dispatcher: `auto_switch_multiplex_dispatcher_sys` @ 0x1402663e0  
String xref: "export_relay_config"@0x141269113 → dispatcher

Call-tree root → terminal:
```
export_relay_config_owner_sys (0x14027A740)
  └─ sub_1400DA320           — manager handle readiness check
  └─ sub_1411CE640           — extract manager arg
  └─ get_usage_refresh_interval_core_impl — extract filePath arg
  └─ sub_1404632D0           — extract includeApiKeys bool arg
  └─ relay_config_export_serialize_sanitize_sys (0x14043BE40)
       └─ sub_140153300      — clone relay state providers
       └─ relay_config_export_json_write_sys (0x14042E840)
            ├─ sub_140571180 — decrypt/resolve apiKey if includeApiKeys=true
            └─ relay_atomic_write_file_sys (0x140332540) ← TERMINAL: external_call_recorded
  └─ tauri_ipc_resolve_sys   — serialize Ok/Err to frontend
```

## Interface / Error / Boundary

**Args**: filePath(str, required), includeApiKeys(bool, required)  
**Response Ok**: { "ok": true }  
**Exported file payload**:
```json
{
  "schemaVersion": <u64>,
  "exportedAt": <u64 ms>,
  "exportedBy": "AiMaMi 1.0.9",
  "includeApiKeys": <bool>,
  "providers": [{ "id", "name", "baseUrl", "apiKey"?, "model", "extraHeaders"? }]
}
```
**Error paths**: manager-not-found, filePath-missing, includeApiKeys-missing, atomic-write-failure  
**Side effect**: atomic file write; no relay state mutation

## Gate Leaf Status

- **Tier**: strictImplementationUse
- implementation_use: false
- gate_accepted: false
- frontend_ccf: NOT COVERED (not blocking strictImplementationUse)

## Unknown / Missing

- filePath path traversal validation not confirmed in this layer (accepted_unknown)
- Exact schemaVersion runtime value (accepted_unknown)
- exportedAt timezone semantics (inferred Unix ms, accepted_unknown)

## Action / Non-action

- Can implement export_relay_config backend to strictImplementationUse against this evidence
- Frontend CCF must be closed separately before readyToImplement
