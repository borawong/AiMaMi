# AiMaMi 1.0.9 Windows plugins builtin web-tools defaults/settings evidence

Scope: bounded producer leaf for `plugins_builtin_web_tools_defaults_settings`.

Canonical root: `<source-location>` = `<source-location>`.

Binary SOT: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`

Verified SHA256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`.

## Result

This leaf confirms a Windows 1.0.9 static builtin plugin vector with two entries:

| index | id | name | description | capability byte | builtin | category |
|---:|---|---|---|---:|---|---:|
| 0 | `web-tools` | `Web Tools` | Injects `web_search` and `web_fetch` tools for OpenAI-compatible relay models. | 0 | true | 0 |
| 1 | `image-support` | `Image Support` | Enables multimodal image input/Vision for OpenAI-compatible relay models. | 1 | true | 0 |

Primary static evidence:

- `sub_1405999D0` builds the builtin vector: count/capacity 2, stride `0x98`, entries from `sub_14024FF30` and `sub_140599610`.
- `sub_14024FF30` builds the `web-tools` builtin info record.
- `sub_140599610` builds the `image-support` builtin info record.
- `sub_1403EE200` calls `sub_1405999D0`, then merges builtin records into the plugin store/load-default flow and saves via `sub_1403EDEC0`.
- `sub_140573A80` serializes plugin response item DTO fields including `capabilities`, `builtin`, `enabled`, and `settings`.
- `sub_140004B30` reads `web-tools` enabled state from the plugin store using `sub_1403ED4D0` and writes it to a runtime web-tools side-channel field.

## Gate

No promotion. `implementation_use=false`, `gate_accepted=false`, `readyToImplement=false`.

This is IDA static evidence only. It does not prove Windows runtime `plugins.json` defaults, `settings` persisted shape, target-not-found response semantics, config UI product acceptance, or exact update failure branches.

See `evidence/builtin-web-tools-defaults-settings.md` and `evidence/builtin-web-tools-defaults-settings.json` for the short evidence table.
