# Builtin web-tools/defaults/settings evidence

## IDA targets

| address | name | role | confidence |
|---|---|---|---|
| `0x1405999D0` | `sub_1405999D0` | builtin vector builder / `all_builtin_plugins` equivalent | high |
| `0x14024FF30` | `sub_14024FF30` | `web-tools` plugin info builder | high |
| `0x140599610` | `sub_140599610` | `image-support` plugin info builder | high |
| `0x1403EE200` | `sub_1403EE200` | plugin store path/load/default/merge/save helper | high |
| `0x140573A80` | `sub_140573A80` | list response item serializer | high |
| `0x140004B30` | `sub_140004B30` | startup/store initialization and web-tools side-channel read | high |
| `0x1403ED4D0` | `sub_1403ED4D0` | plugin enabled lookup helper | medium |
| `0x1403ED0D0` | `sub_1403ED0D0` | get-config/settings lookup helper | candidate-only |
| `0x1403EDAA0` | `sub_1403EDAA0` | update-settings store mutator | candidate-only |
| `0x1403ED760` | `sub_1403ED760` | toggle enabled store mutator | candidate-only |

## Builtin vector

`sub_1405999D0` allocates `0x130` bytes, calls `sub_14024FF30` and `sub_140599610`, copies two `0x98` records, then returns vector len/capacity `2`.

Relevant decompiler shape:

```text
v3 = alloc(304, 8)
sub_14024FF30(Src)
sub_140599610(v5)
memcpy(v3, Src, 0x98)
memcpy(v3 + 152, v5, 0x98)
*a1 = 2
a1[1] = v3
a1[2] = 2
```

## `web-tools` plugin info

`sub_14024FF30` constructs:

- id `web-tools`: immediate `0x6c6f6f742d626577` plus byte `0x73` at `0x14024FF6E..0x14024FF7B`.
- name `Web Tools`: immediate `0x6c6f6f5420626557` plus byte `0x73` at `0x14024FF9F`.
- description: string at `0x141265EBB`, copied with length `0x88`.
- version `1.0.0`: `0x140250009`.
- author `AiMaMi`: `0x140250035`.
- capabilities: one-byte vector, byte `0`, vector stored at record offsets `+0x78/+0x80/+0x88`.
- builtin/category: `mov word ptr [rsi+90h], 1` at `0x1402500D8`. With serializer offsets, this is `builtin=true`, `category=0`.

## `image-support` plugin info

`sub_140599610` constructs:

- id `image-support`: immediates at `0x14059964E`, `0x14059965C`, `0x140599666`.
- name `Image Support`: immediates at `0x140599689`, `0x140599697`, `0x1405996A1`.
- description: string at `0x14128AF28`, copied with length `0xC2`.
- version `1.0.0`.
- author `AiMaMi`.
- capabilities: one-byte vector, byte `1`, vector stored at record offsets `+0x78/+0x80/+0x88`.
- builtin/category: `mov word ptr [rsi+90h], 1` at `0x1405997CC`, interpreted as `builtin=true`, `category=0`.

## Store/default relation

`sub_1403EE200` calls `sub_1405999D0` at `0x1403EE259`, loads/parses existing plugin store when present, falls back through default helpers, loops over the builtin vector in `0x98`-byte steps, and inserts/matches builtin records into the store map. It then calls `sub_1403EDEC0` at `0x1403EE512` to save.

This proves builtin records flow into the plugin store load/default/merge path. It does not prove the exact Windows runtime persisted default `enabled` value or default `settings` object.

## DTO/list relation

`sub_140573A80` serializes plugin response item fields:

- `id` from record `+0x00`.
- `name` from record `+0x18`.
- `description` from record `+0x30`.
- `version` from record `+0x48`.
- `author` from record `+0x60`.
- `category` from record `+0x91`.
- `capabilities` from record `+0x78`.
- `builtin` from record `+0x90`.
- `enabled` from output record `+0xB8`.
- `settings` from output record `+0x98`.

The builtin builders directly support `capabilities`, `builtin`, and `category`. `enabled` and `settings` are output/store fields and remain candidate-only for exact defaults in this leaf.

## Web-tools side-channel relation

`sub_140004B30` calls the plugin store initializer `sub_1403EE200` at `0x140004C65`, then calls `sub_1403ED4D0` with the `web-tools` string at `0x140004C79/0x140004C8D`. The returned byte is written to a runtime field at `0x140004C9A`.

This confirms a startup read from plugin store state to a web-tools runtime side-channel. It does not close toggle/update ordering after startup.

## Remaining unknowns

- Exact Windows fresh-store `plugins.json` defaults.
- Exact default `settings` shape.
- `get_plugin_config` target-not-found/null response body.
- `update_plugin_config` not-found/update failure response body.
- Config UI acceptance and frontend consumer behavior.
- Runtime toggle/update ordering into the web-tools side-channel.
