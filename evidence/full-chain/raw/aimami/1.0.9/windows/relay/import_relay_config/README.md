# import_relay_config — Windows Evidence Leaf

**Sync time**: 2026-06-02  
**Binary**: AiMaMi 1.0.9 win64.exe  
**SHA-256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**Session**: C-config-passthrough-diag-20260602  
**Platform**: windows-x64  
**Final conclusion**: strictImplementationUse (dim1-5 closed; frontend_ccf pending)

## Evidence Index

| Artifact | Path |
|---|---|
| Owner pseudocode | ida/pseudocode/0001_import_relay_config_owner_sys_ha5822387.c |
| Pseudocode manifest | ida/pseudocode-manifest.jsonl |
| Call tree | call-trees/import_relay_config.jsonl |
| Evidence detail | evidence.md |
| Validation | validation/result.json |

## Coverage

- dim1 (frontend CCF): NOT COVERED
- dim2 (owner/pseudocode): ACCEPTED — import_relay_config_owner_sys@0x140270420
- dim3 (call-tree to leaf): ACCEPTED — depth 5, terminal sub_14006AA80 (persistence_commit)
- dim4 (interface/DTO/error/side-effect): ACCEPTED
- dim5 (same-platform gate): ACCEPTED
- dim6 (test/acceptance): NOT COVERED

## Per-target Result Matrix

| Dimension | Status | Notes |
|---|---|---|
| Frontend CCF | not_covered | |
| Backend owner | accepted | A-level, string xref @ 0x141269126 |
| Pseudocode | accepted | IDA Hex-Rays, sha a5822387fa3f56dc |
| Call-tree | accepted | depth 5, persistence_commit terminal |
| Interface | accepted | filePath(str,required) |
| Error path | accepted | state-read/manager/filePath/parse/apply branches |
| Side effect | accepted | DESTRUCTIVE replace of all relay providers + config.toml persist |
| Same-platform gate | accepted | windows-x64 independent |
| Test/acceptance | not_covered | |

## Backend Control Flow / Pseudocode / Call-tree

Owner: `import_relay_config_owner_sys` @ 0x140270420 (1550 bytes)

```
import_relay_config_owner_sys (0x140270420)
  └─ get_usage_refresh_interval_core_read  — read existing relay state; early Err if error
  └─ sub_1400DA320                         — check manager/app handle
  └─ sub_1411CE640                         — extract manager arg
  └─ get_usage_refresh_interval_core_impl  — extract filePath arg
  └─ relay_config_import_parse_sys (0x14043C2C0)
       └─ sub_140147C70                    — file read + JSON parse to provider structs
       └─ sub_14000A1E0                    — drop existing providers slice
  └─ sub_14006AA80                         — TERMINAL: apply providers to relay state + persist
  └─ tauri_ipc_resolve_sys                 — serialize Ok/Err to frontend
```

## Interface / Error / Boundary

**Args**: filePath(str, required)  
**Import schema** (from relay_config_import_parse_sys + sub_140432A20): schemaVersion, exportedAt, exportedBy, includeApiKeys, providers[]  
**Response Ok**: { "importedCount": <u32>, "skippedCount": <u32> } (fields inferred, not individually confirmed)  
**Side effect**: DESTRUCTIVE — existing providers replaced by imported set; config.toml updated  
**Error paths**: state-read-error, manager-not-found, filePath-missing, file-read-failure, JSON-parse-error, apply-failure

## Gate Leaf Status

- **Tier**: strictImplementationUse
- implementation_use: false
- gate_accepted: false

## Unknown / Missing

- Whether apiKeys stored encrypted or plaintext in relay state after import (accepted_unknown)
- Exact response fields (importedCount/skippedCount vs boolean) (accepted_unknown)
- activeByIde field merge/replace semantics (accepted_unknown)
