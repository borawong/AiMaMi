# toggle_plugin IDA Save-Store Boundary Evidence

Produced: 2026-06-02T01:58:14+08:00

Binary SOT: `<local-path> 1.0.9 win64.exe`

SHA256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`

Size: `26821632`

IDA instance: `127.0.0.1:13337`

IDA module: `AiMaM 1.0.9 win64.exe`

IDA MCP diagnostic idb_path observed; not an authoritative evidence path.

## Confirmed Static Chain

`toggle_plugin` is present at `0x141269145`; its only observed xref is `0x140282bf4` inside owner `sub_140282B70` (`0x140282b70`, size `0x710`).

`sub_140282B70` builds Tauri/IPC decode descriptors with command name length `0x0d` and keys `registry`, `relayManager`, `id`, and `enabled`.

The command owner calls `sub_1400FA340` for `registry` and accepts only result tag byte `6`. Failure falls through to `sub_140062230`, preserving the decoder error envelope.

The command owner resolves `relayManager` through `sub_1400DA320(Dst[64]+0x10)` or fallback `sub_1411CE640`; both success paths continue only when tag byte is `6`.

The command owner decodes `id` through `sub_14045F6C0` and `enabled` through `sub_1404632D0`; either non-`6` tag is returned through `sub_140062230`.

Only after all DTO fields pass does the owner call `sub_140164C00(&result, registry, relayManager, id, enabled_bool)` at `0x140282e18`.

`sub_140164C00` is the toggle implementation leaf for this owner. It receives the plugin id pointer/length from `a4+8` and `a4+16`, and the desired enabled state in `a5`.

If disabling (`a5 == 0`), `sub_140164C00` first scans an in-memory registry table at `a2+40`, count at `a2+48`, stride `152`, matching id bytes and requiring byte `+144`. A match returns the static error payload at `xmmword_14125EFE8`.

The `xmmword_14125EFE8` bytes decode to UTF-8 `内置插件不可关闭`, so this is the static guard for built-in/active protected plugins.

For normal mutation, `sub_140164C00` calls `sub_1403ED760(v19, registry, id_ptr, id_len, enabled)`.

`sub_1403ED760` is the store mutation helper. It takes the lock/poison byte at `a2+56`, waits via `sub_141206A60` if already locked, and emits `plugin store poisoned` from `src\core\plugins\registry.rs` if the poison state is set.

`sub_1403ED760` inserts or finds the id in the map rooted at `a2+64`, writes the enabled byte at `v15[-1].m128i_i8[8] = a5`, then calls `sub_1403EDEC0(a1, *(a2+8), *(a2+16), a2+64)`.

`sub_1403EDEC0` is the persistence save helper. It serializes the map through `sub_140573E60(a4, writer_state)`.

If serialization fails, `sub_1403EDEC0` wraps the error with the string descriptor at `0x141278be8`, whose inline bytes contain length `0x18` and text `serialize plugins.json: `, then returns variant/tag `9`.

If serialization succeeds, `sub_1403EDEC0` calls `sub_14104E390(a2, a3, buffer_ptr, buffer_len)` and returns tag `10` on success. A nonzero write result is wrapped with the string descriptor at `0x141278c03`, length `0x14`, text `write plugins.json: `, then returned as tag `9`.

`sub_14104E390` is the low-level file write helper for the serialized content. It opens a path with `sub_141037840`, writes chunks with `sub_141036DB0`, closes the handle with `CloseHandle`, and returns `0` on success or a write/open error object.

`sub_1403EE200` binds the plugin store path: at `0x1403ee24f` it calls `sub_141035180(..., "plugins.json", 12)`, then later calls `sub_1403EDEC0` with the resulting path pair. This establishes the shared `plugins.json` persistence binding for the plugin registry store.

`sub_1403EE200` is not the toggle command owner, but it proves the same store save chain uses path component `plugins.json`. The toggle-specific evidence chain reaches the shared save helper through `sub_140282B70 -> sub_140164C00 -> sub_1403ED760 -> sub_1403EDEC0 -> sub_14104E390`.

`sub_140164C00` returns success by calling `sub_1404391D0(&v20, enabled)`. That response builder stores literal `ok`, literal `Success`, and writes the enabled bool at output offset `+77`.

The Tauri response success path in the owner copies the `sub_140164C00` result into the response buffer and calls `sub_1400703B0` at `0x1402831d4`; decode errors and implementation errors go to `sub_140062230`.

## Shared Chain Evidence

`update_plugin_config` shares the plugin store and save helper family through `sub_140165130 -> sub_1403EDAA0 -> sub_1403EDEC0`, but this evidence does not rely on that alone.

`get_plugin_config` uses `sub_140164FB0 -> sub_1403ED0D0` for read/config lookup, and `list_plugins` uses `sub_140164BD0 -> sub_1403EE7A0` for store enumeration. These confirm the nearby plugin registry family, but the toggle mutation chain is independently anchored to `sub_140282B70`.

## Side-Effect Boundary

The in-memory mutation occurs before persistence: `sub_1403ED760` writes the enabled byte into the store map and then calls `sub_1403EDEC0`.

The durable side effect is the `plugins.json` write performed by `sub_14104E390` after serialization in `sub_1403EDEC0`.

There is no evidence from this static pass that a runtime frontend acceptance test observed the file change, UI state refresh, or strict response/default mapping.

## Error Envelope

DTO decode failures for `registry`, `relayManager`, `id`, or `enabled` are routed to `sub_140062230` from `sub_140282B70`.

Implementation failures from `sub_140164C00` are converted through display formatting `sub_140464400` and routed back to the owner response as an error variant.

The known static implementation error strings in this chain are `内置插件不可关闭`, `plugin store poisoned`, `serialize plugins.json: `, and `write plugins.json: `.

## Gate Posture

This is bounded IDA static evidence only. It closes the static save-store/persistence/error/side-effect boundary for `toggle_plugin`, but it does not include Windows runtime acceptance, frontend CCF/UI proof, or strict consumer mapping.

Gate booleans must remain false: `consumerStartReady=false`, `strictImplementationUse=false`, `readyToImplement=false`, `implementation_use=false`, `gate_accepted=false`, `full_leaf_100=false`.
f_100=false`.
