# System Diff

## Platform Artifacts

Windows 1.0.9 binary SOT is verified by SHA256 $sha and size $size.

## Frontend IPC / Control-flow

Not collected in this leaf bundle. Existing macOS or frontend-relay-diff evidence is not used to close this Windows leaf.

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

The command string $leaf is present in the Windows PE command string neighborhood. No concrete handler owner, same-binary pseudocode, or accepted deep call-tree was recovered in this bounded pass.

## Interface / Error / Boundary

Static strings show plugin store and persistence-related messages, but request/response DTO parity, CoreEnvelope behavior, target-not-found errors, poisoned-lock errors, serialize/write failures, and rollback state are not proven for this Windows leaf.

## Gate Leaf

blocked_no_promotion. consumerStartReady=false; strictImplementationUse=false; readyToImplement=false; implementation_use=false; gate_accepted=false; full_leaf_100=false.

## Plugin / Capability

Plugin registry/store strings are present, including PluginRegistry, plugins.json, poisoned plugin store, serialize plugins.json, and write plugins.json. These are diagnostic locator facts only.

## Unknown

- backend owner not recovered for Windows 1.0.9 same binary
- Ghidra pseudocode absent for the leaf and PluginRegistry helper chain
- deep call-tree to registry/store/serde/fs leaves absent
- strict DTO/error/envelope parity not proven on Windows 1.0.9
- executed IPC/runtime harness trace absent on Windows 1.0.9
- upstream acceptance mapping not executed; only blocked draft can be named
