# AiMaMi 1.0.9 Windows plugins settings decode/write failure paths

Status: `blocked_no_gate`.

This producer leaf supplements existing row 596 `plugins_config_error_dto_boundaries` with a narrower static IDA packet for `update_plugin_config` only. It focuses on settings decode/copy, in-memory store mutation, save helper error wrapping, and response-envelope propagation.

It does not repeat the broader request DTO summary except where needed to anchor this chain.

## Evidence

- SOT binary: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`
- SOT SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
- IDA MCP: `127.0.0.1:13337`, health `ok`, imagebase `0x140000000`
- Primary evidence: `evidence/ida-settings-decode-write-failure.md`
- Address table: `evidence/address-table.json`

## Conclusions

- `sub_1402663E0` dispatches `update_plugin_config`, decodes `registry`, `id`, then `settings`.
- `settings` is decoded at `0x140267109..0x140267159` through `sub_1404F1950`; the owner requires returned tag/value `1` before it calls `sub_140165130`.
- `sub_1404F1950` uses `sub_140473090` as a generic value copier/normalizer and then display-converts/wraps the accepted value into a tag-1 result.
- `sub_140473090` statically handles variant tags `0..5`. It copies scalar cases directly and deep-copies string/list/object-like payloads through allocation, `memcpy`, and helper calls. Exact runtime JSON semantics for null, omitted, empty object, empty array, and numeric edge cases remain unknown without fixtures.
- `sub_140165130` calls `sub_1403EDAA0`, treats save-helper tag `10` as success, and builds an `ok`/`Success` boolean true response through `sub_1404391D0`.
- `sub_1403EDAA0` updates the in-memory plugin entry before save: it clears the existing settings slot at `0x1403edc62`, copies the new settings value at `0x1403edc77..0x1403edc7b`, then calls `sub_1403EDEC0` at `0x1403edc90`.
- `sub_1403EDEC0` returns tag `9` with `serialize plugins.json: ` on serialization failure and tag `9` with `write plugins.json: ` on write failure. Success writes tag `10`.
- Failure propagates back through `sub_140165130`: non-tag-10 result is display-formatted via `sub_140464400`, cleaned via `sub_14017DEC0`, and returned with wrapper discriminant `0x8000000000000000`.
- No rollback branch is visible after the in-memory mutation and before/after save failure handling. Static conclusion: mutation-before-persistence confirmed; rollback proof not visible.
- `plugin store poisoned` is referenced in `sub_1403EDAA0` at xref `0x1403edd17`, so poisoned-lock error coverage reaches update path.

## Gate

- `consumerStartReady=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`

No runtime fixture, frontend config UI consumption proof, or acceptance mapping was produced.

## Remaining Unknowns

- Runtime fixture behavior for omitted/wrong-type/null/empty `settings`.
- Exact JSON shape for every accepted `settings` variant after serialization.
- Whether save failure leaves mutated store observable to subsequent reads in a live process.
- Runtime rollback behavior, if any, outside this bounded static path.
- Frontend consumption of `serialize plugins.json: ` and `write plugins.json: ` errors.

