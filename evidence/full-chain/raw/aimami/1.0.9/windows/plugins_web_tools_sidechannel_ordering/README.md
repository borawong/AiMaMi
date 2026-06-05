# AiMaMi 1.0.9 Windows plugins web-tools side-channel ordering

Scope: static IDA MCP evidence for the `web-tools` runtime side-channel ordering in startup, `get_hotspot_enabled`, `toggle_plugin`, and `update_plugin_config`. This leaf intentionally does not repeat request DTO, settings decode, or plugins.json persistence-error bodies already covered by sibling bundles.

Binary SOT: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`

Binary SHA256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`

## Confirmed

- `web-tools` has exactly one direct string xref in this IDB: string `0x14120C7E8` is referenced at `0x140004C79` inside startup `sub_140004B30`.
- Startup calls `sub_1403EE200` at `0x140004C65` before the `web-tools` lookup. `sub_1403EE200` builds the `plugins.json` path at `0x1403EE24F`, decodes/default-merges plugin store content, and calls save helper `sub_1403EDEC0` at `0x1403EE512`.
- Startup then calls enabled lookup helper `sub_1403ED4D0` at `0x140004C8D` with `rdx = "web-tools"` and length `9`, and writes the returned `al` to runtime side-channel field offset `+0x10` at `0x140004C9A`.
- `get_hotspot_enabled` wrapper `sub_140285050` references command string `0x141268FA7`, locks runtime state via `sub_1400DA7C0((Dst[64] + 0x10))` at `0x140285129`, and calls reader helper `sub_1401631A0` at `0x14028517B`.
- `toggle_plugin` command path is `sub_140282B70 -> sub_140164C00 -> sub_1403ED760 -> sub_1403EDEC0 -> sub_14104E390`.
- In `sub_1403ED760`, the store enabled byte is mutated at `0x1403ED90C`, then persistence save `sub_1403EDEC0` is called at `0x1403ED91D`.
- In `sub_140164C00`, only after `sub_1403ED760` returns success marker `10`, the id is compared against literal bytes for `web-tools` at `0x140164D30..0x140164D4E`; if equal, runtime side-channel offset `+0x10` is written with the requested enabled value at `0x140164D5B`.
- `update_plugin_config` path is `sub_1402663E0 -> sub_140165130 -> sub_1403EDAA0 -> sub_1403EDEC0`.
- In `sub_1403EDAA0`, settings bytes are replaced at `0x1403EDC62..0x1403EDC7B`, then persistence save `sub_1403EDEC0` is called at `0x1403EDC90`; no `web-tools` string compare and no runtime side-channel `+0x10` write were observed on this update path.

## Inferred

- Startup ordering is store-init first, side-channel seed second: load/merge/save helper `sub_1403EE200` precedes `sub_1403ED4D0("web-tools")` and the field write.
- `get_hotspot_enabled` reads the runtime side-channel state rather than looking up `web-tools` in the plugin store on demand; static evidence reaches the runtime lock/reader helper, not the plugin registry lookup helper.
- `toggle_plugin` refreshes the runtime side-channel immediately on the same success path that persists the store, but only for id `web-tools` and only after `sub_1403ED760` reports success.
- `update_plugin_config` is settings-only for this side-channel question: it can persist settings, but static evidence does not show any runtime refresh of the side-channel field.

## Unknown / Limits

- Runtime ordering not proven statically beyond the path-local instruction/call order above. No AiMaMi process was run, no runtime fixture was captured, and no user `plugins.json` was read.
- The exact Rust type name of the side-channel owner is not recovered in this leaf. Evidence names it as a runtime state field at offset `+0x10`, reached from startup and command context copies.
- This is IDA static assist evidence only. It does not include frontend consumption, runtime acceptance mapping, failure fixtures, or a consumer gate promotion.

## Gate

`implementation_use=false`, `gate_accepted=false`, `readyToImplement=false`, `strictImplementationUse=false`, `consumerStartReady=false`.

Do not append this leaf to `INDEX.jsonl` from this producer run.
