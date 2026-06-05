# AiMaMi 1.0.9 Windows Source Binary Bootstrap

Status: complete source/raw bootstrap only. No Ghidra, no rizin, no reverse gate promotion.

Canonical bundle: $envBundle

## Source Binary

- Canonical path: $envBinary
- SHA256: $dstHash
- Size: 26821632 bytes
- ProductVersion: 1.0.9
- FileVersion: 1.0.9
- ProductName: AiMaMi
- CompanyName: aimami

## Provenance

Incoming staging file was read from $stagingEnvPath only as the user-provided source input. It is not used as an evidence root. The binary was copied into the canonical raw bundle because current OUTPUT-SPEC allows raw evidence to store original binaries under $envRootExpr/raw/....

## Files

- AiMaM 1.0.9 win64.exe: canonical raw copy of the source/staging binary.
- source-hash.json: SHA256, size, ProductVersion, FileVersion, and source provenance metadata.
- manifest.json: bundle manifest and policy flags.

## Policy

- no internal/reverse write
- no <temporary-evidence-root> write
- no INDEX shard
- no local copy outside the provided staging file and canonical raw bundle
- readyToImplement=false; implementation_use=false; gate_accepted=false; full_leaf_100=false
## Dateless Canonicalization

Canonicalized: 2026-05-31T17:11:08.4266413+08:00
Supersedes dated path: `<source-location>/raw/aimami/1.0.9/windows/source-binary/source-binary-bootstrap-20260531`.
The old dated directory is retained as stale historical evidence when present; this stable bundle has no gate or implementation promotion.
