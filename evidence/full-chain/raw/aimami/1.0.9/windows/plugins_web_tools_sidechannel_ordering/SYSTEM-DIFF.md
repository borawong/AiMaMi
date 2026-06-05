# System Diff

## Platform Artifacts

Windows x64 only. Source binary is the canonical SOT executable with SHA256 `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`.

## Backend Commands / Control-flow / Pseudocode / Leaf

`web-tools` side-channel has two confirmed write sites:

- Startup seed: `0x140004C8D` calls `sub_1403ED4D0("web-tools", 9)`, then `0x140004C9A` writes `al` to field offset `+0x10`.
- Toggle refresh: `0x140164D30..0x140164D4E` compares plugin id bytes to `web-tools`; when equal and after store mutation/save success, `0x140164D5B` writes the requested enabled bool to field offset `+0x10`.

`get_hotspot_enabled` has a confirmed read path through `sub_140285050 -> sub_1401631A0`, with a runtime lock/reader path rooted at `Dst[64] + 0x10`.

`update_plugin_config` has no observed side-channel refresh: it calls `sub_1403EDAA0`, replaces settings, saves via `sub_1403EDEC0`, and returns an ok-bool response.

## Plugin / Capability

The runtime side-channel is linked to plugin id `web-tools`; static evidence does not show similar side-channel writes for other plugin ids in these paths.

## Unknown

Runtime ordering not proven statically beyond the path-local ordering. No runtime fixture, frontend consumption, or acceptance mapping is included.

## Gate Leaf

No promotion. `implementation_use=false`; `gate_accepted=false`; `readyToImplement=false`; `consumerStartReady=false`.
