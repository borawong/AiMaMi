# Evidence Paths

## Raw Bundle

- This bundle: `<source-location>/raw/aimami/1.0.9/windows/get_plugin_config`
- Static evidence: `<source-location>/raw/aimami/1.0.9/windows/get_plugin_config/evidence/static-bounded-evidence.json`

## Canonical Binary SOT

- Binary SOT: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`
- SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
- Size: `26821632`

## Consumed Non-Promoting Diagnostic Sources

- Source binary bootstrap: `<source-location>/raw/aimami/1.0.9/windows/source-binary/source-binary-bootstrap/manifest.json`
- Frontend delta classification: `<source-location>/intermediate/aimami/1.0.9/windows/frontend-delta-classification/frontend-delta.json`
- PE command-table window: `<source-location>/intermediate/aimami/1.0.9/windows/load-relay-state-owner-pdata-calltree/disassembly/command-table-window.pD.txt`

## Pointer Policy

The upstream handoff should point to this raw bundle first. Intermediate paths are diagnostic inputs, not implementation handoff roots.