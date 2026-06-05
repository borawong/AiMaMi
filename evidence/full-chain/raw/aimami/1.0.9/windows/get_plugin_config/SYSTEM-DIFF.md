# System Diff

Leaf: `get_plugin_config`

## Windows 1.0.9 Evidence

- Current Windows binary SOT is verified: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b` / `26821632` bytes.
- Frontend IPC surface is retained from Windows 1.0.8 to 1.0.9, based on the existing frontend delta classification.
- PE command table contains the leaf command string at `0x141269152`.

## Difference Boundary

No accepted Windows 1.0.9 backend behavior diff is proven. This bundle does not use macOS evidence to close Windows gate.

## Gate Boundary

- consumerStartReady: false
- strictImplementationUse: false
- readyToImplement: false
- implementation_use: false
- gate_accepted: false
- full_leaf_100: false