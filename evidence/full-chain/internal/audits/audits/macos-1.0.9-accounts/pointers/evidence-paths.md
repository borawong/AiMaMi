# Evidence Paths - AiMaMi 1.0.9 macOS Accounts

Use env-relative paths only.

## Current Entrypoints

- bundle: `<source-location>/audits/macos-1.0.9-accounts/`
- current reducer: `<source-location>/audits/macos-1.0.9-accounts/logic/ACCOUNTS-FULL-LEAF-100-IDA-ACCEPTED-109.md`
- IDA rollup: `<source-location>/audits/macos-1.0.9-accounts/logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`
- task plan: `<source-location>/audits/macos-1.0.9-accounts/data/task-plan.json`
- gate report: `<source-location>/audits/macos-1.0.9-accounts/gate-report.json`
- manifest: `<source-location>/audits/macos-1.0.9-accounts/manifest.json`
- AI handoff: `<source-location>/audits/macos-1.0.9-accounts/AI.md`

## Binary SOT

- IDA app binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- IDA IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## IDA Tools Used

- `mcp__ida_pro_mcp_mac.server_health`
- `mcp__ida_pro_mcp_mac.decompile`
- `mcp__ida_pro_mcp_mac.analyze_function`
- `mcp__ida_pro_mcp_mac.xrefs_to`
- `mcp__ida_pro_mcp_mac.py_eval`
- `mcp__ida_pro_mcp_mac.set_comments`
- `mcp__ida_pro_mcp_mac.idb_save`

## Gate State

```json
{
  "strictImplementationUse": true,
  "readyToImplement": true,
  "implementation_use": true,
  "gate_accepted": true,
  "full_leaf_100": true,
  "moduleExitAllowed": true
}
```
