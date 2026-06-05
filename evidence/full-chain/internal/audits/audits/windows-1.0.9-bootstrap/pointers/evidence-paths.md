# Evidence Paths — windows-1.0.9-bootstrap

**bundle**: windows-1.0.9-bootstrap
**platform**: windows-x64
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**backfill_note**: backfilled by <workstation> consolidation 2026-06-05; paths derived from logic/ distilled docs and gate-report.json

---

## Binary SOT

```
<source-location>/source-binary/aimami/1.0.9/windows/
```

SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`

## Raw evidence root

```
<source-location>/raw/aimami/1.0.9/windows/bootstrap/
```

## Intermediate evidence

```
<source-location>/intermediate/aimami/1.0.9/windows/bootstrap/
```

## Distilled docs (consumer-facing)

- `logic/WIN-BOOTSTRAP-DEEP-DISTILLED-109.md` — deep distilled for all 4+1 leaves; dim1-5 evidence
- `data/task-plan.json` — consumer gate (strictImplementationUse for 5 leaves)
- `gate-report.json` — cluster_gates array; machine=<workstation>; session=<audit-session>

## INDEX.jsonl lines

- Lines 710-713: original consumerStartReady bootstrap evidence (deep-win-bootstrap session)
- Upgrade entries: <audit-session> session (<workstation>)

## field VAs

| Symbol | VA |
|--------|----|
| app_run_entry CLI | 0x1400010D0 |
| run() body / app_run_entry_bootstrap_sys | 0x140004B30 |
| IPC dispatcher | 0x1402663E0 |

## Cross-bundle pointers

- macOS equivalent: `<source-location>/audits/macos-1.0.9-bootstrap/`
- Cross bundle: `<source-location>/audits/cross-1.0.9-relay-core-bootstrap/` — synthesizes mac + win bootstrap + relay-core
- System-shell-init supplement (angle-3 load_snapshot): `<source-location>/audits/macos-1.0.9-system-shell-init/` (local outtake; not authoritative for bootstrap gate)
