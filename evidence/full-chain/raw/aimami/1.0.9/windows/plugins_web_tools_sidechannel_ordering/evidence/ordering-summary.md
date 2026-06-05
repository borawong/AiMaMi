# Ordering Summary

## Startup

Observed static order in `sub_140004B30`:

1. `0x140004C65`: calls `sub_1403EE200` with the plugin registry/store object.
2. `sub_1403EE200` builds a `plugins.json` path at `0x1403EE24F`, decodes or creates default store content, merges built-in plugin rows, and calls `sub_1403EDEC0` at `0x1403EE512`.
3. `0x140004C79..0x140004C8D`: loads string `web-tools`, length `9`, calls `sub_1403ED4D0`.
4. `0x140004C9A`: writes returned `al` into runtime side-channel field offset `+0x10`.

Conclusion: startup side-channel seed is after static store init/merge/save in the observed path.

## Get Enabled

Observed static order in `sub_140285050`:

1. Command string `get_hotspot_enabled` at `0x141268FA7` is referenced at `0x1402850D0`.
2. `0x140285129`: obtains runtime lock/state via `sub_1400DA7C0((Dst[64] + 0x10))`.
3. `0x14028517B`: calls `sub_1401631A0`, a mutex/reader helper that returns the current runtime bool-like result.

Conclusion: `get_hotspot_enabled` reads runtime side-channel state, not the plugin store via `sub_1403ED4D0`.

## Toggle

Observed static order in `sub_140164C00` and `sub_1403ED760`:

1. `0x140164D04`: `sub_140164C00` calls `sub_1403ED760`.
2. `0x1403ED90C`: `sub_1403ED760` mutates plugin enabled byte.
3. `0x1403ED91D`: `sub_1403ED760` calls `sub_1403EDEC0` to persist.
4. `0x140164D23`: caller checks success marker `10`.
5. `0x140164D30..0x140164D4E`: caller compares id bytes to `web-tools`.
6. `0x140164D5B`: caller writes requested enabled bool to runtime side-channel field offset `+0x10`.
7. `0x140164D64`: caller builds ok-bool response.

Conclusion: on the static success path, `toggle_plugin(web-tools, enabled)` persists store first, then refreshes runtime side-channel, then builds response.

## Update

Observed static order in `sub_140165130` and `sub_1403EDAA0`:

1. `0x140165174`: `sub_140165130` calls `sub_1403EDAA0`.
2. `0x1403EDC62..0x1403EDC7B`: old settings are cleared/replaced with provided settings.
3. `0x1403EDC90`: store save helper `sub_1403EDEC0` is called.
4. `0x14016517E..0x1401651B0`: success marker `10` leads to ok-bool response construction.

Conclusion: `update_plugin_config` persists settings but no side-channel refresh was observed.

## Limit

Runtime ordering not proven statically beyond the path-local instruction/call order. This packet does not include execution traces or fixture acceptance.
