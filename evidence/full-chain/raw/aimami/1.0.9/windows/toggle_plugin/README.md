# AiMaMi 1.0.9 Windows toggle_plugin

Scope: toggle_plugin only. Platform evidence is Windows same-platform PE static evidence against the canonical binary SOT.

Final status: blocked / no_promotion. This bundle does not reach consumerStartReady, strictImplementationUse, readyToImplement, implementation_use, gate_accepted, or full_leaf_100.

## Evidence

- Binary SOT: $envRoot/raw/binary/AiMaM 1.0.9 win64.exe
- SHA256: $sha
- Size: $size
- Selected same-platform static string evidence: $envRaw/evidence/windows-string-neighborhood.md
- Tool/intermediate diagnostics: $envInter/data/
- Descriptor recovery summary: $envInter/data/handler-facts/summary.json

## Result

The Windows 1.0.9 PE contains the $leaf command string in the adjacent Tauri command table neighborhood, plus plugin registry/store strings such as PluginRegistry, plugins.json, poisoned plugin store, serialize plugins.json, and write plugins.json. The bounded descriptor recovery produced zero concrete handler candidates and zero rip-relative handler candidates for this leaf. Therefore the evidence is useful for queueing future owner recovery, but it is not implementation proof.

## Missing / Blockers

- Backend owner/pseudocode is missing for $leaf on the Windows 1.0.9 binary.
- Helper chain to PluginRegistry / store serialization / file write leaves is not decompiled for this Windows leaf.
- Runtime IPC execution trace is absent.
- Strict public DTO, error envelope, rollback/failure-state, and acceptance mapping are absent.

## Non-action

Do not use this bundle to implement upstream parity. Do not infer Windows behavior from macOS 1.0.8/1.0.9 plugin evidence. Do not set implementation_use enabled, gate_accepted enabled, eadyToImplement=true, or ull_leaf_100=true from these files.