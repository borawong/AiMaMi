# macOS 1.0.9 Frontend CCF Extraction Repair

Produced at: `2026-05-31T13:23:31Z`

## Scope

- Batch: `lane-40 macos-109-frontend-ccf-extraction-repair`
- Product/version/platform: `aimami` / `1.0.9` / `macos-universal`
- Current canonical bundle: `<source-location>/audits/macos-1.0.9-accounts/`
- Expected source binary SHA256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Existing Blocker Confirmed

The existing 1.0.9 macOS frontend CCF probe remains empty:

- `intermediate/aimami/1.0.9/macos/frontend-ccf/full-frontend-ccf/frontend/frontend-control-flow.jsonl`: `0` rows.
- `intermediate/aimami/1.0.9/macos/frontend-ccf/full-frontend-ccf/frontend/frontend-control-flow-unresolved.jsonl`: `0` rows.
- Existing probe status: `pipeline_executed_tauri_dumper_failed_resources_fallback_empty_ccf`.
- Existing probe Resources fallback listed only icon and voice sidecar resources, not frontend JS assets.

Windows 1.0.9 frontend CCF/UI-state evidence remains diagnostic-only for this lane and is not used to close macOS CCF.

## Bounded Repair Attempt

Extractor:

```bash
node ${CODEX_HOME:-$HOME/.codex}/skills/rust-reverse-pipeline/scripts/extract_component_control_flow.mjs \
  --frontend-root "<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/Resources" \
  --out "<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-extraction-repair/frontend-control-flow.jsonl" \
  --api-map-out "<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-extraction-repair/api-map.json"
```

Bound: `45` seconds.

Result:

- Exit code: `1`
- Timeout: `false`
- Output CCF rows: `0`
- Raw attempt summary: `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-extraction-repair/summary.json`
- Raw diagnostic details are intentionally not linked as a direct log artifact from `source archive`; use the summary manifest above and canonical `INDEX.jsonl` entry for external evidence lookup.

Precise failure:

```text
The failed repair attempt targeted a repo-local scratch copy of the 1.0.9 app
that is now classified as a stale/forbidden route. Current binary discovery
must start from the SOT path:
<source-location>/source-binary/AiMaMi 1.0.9.app
```

Current disk validation:

- `<source-location>/source-binary/AiMaMi 1.0.9.app`: present.
- `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`: present, SHA256 `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- Repo-local binary scratch paths are stale and must not be used as current
  raw, intermediate, upstream, pointer, staging, or fallback roots.

Later correction:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ccf-coverage-summary.json`
  produced non-empty bounded minified evidence from the SOT app:
  `97` frontend CCF rows, `128` IPC rows, `79/127` unique command coverage,
  `accepted_frontend_ccf=false`.

## Gate Decision

Status: `superseded_by_sot_found_app_partial_ccf_rerun_no_gate_promotion`.

The old missing-app/root blocker is stale. The current blocker is partial
same-version frontend coverage and missing strict dimensions, not missing SOT
binary. `accepted_frontend_ccf` stays `false`. Do not set `gate_accepted`,
`implementation_use`, `readyToImplement`, or `full_leaf_100` from either the
failed repair attempt or the later partial rerun.

Unblock condition: produce accepted same-platform macOS 1.0.9 frontend
control-flow/UI-state evidence for the required commands, then pair it with
same-version backend owner/pseudocode/call-tree, runtime request/response/error
envelopes, side-effect fixtures, acceptance mapping, and independent Windows
closure where required by gate.
