# System diff

This leaf adds a new Windows 1.0.9 static evidence bundle for builtin plugin construction and its nearest store/DTO relationships.

New evidence relative to existing plugins leaves:

- Confirms builtin plugin count `2` in `sub_1405999D0`.
- Confirms builtin plugin IDs/names/descriptions/capability bytes for `web-tools` and `image-support`.
- Confirms static builtin construction reaches the plugin store merge/load-default path in `sub_1403EE200`.
- Confirms list response item serialization offsets for `capabilities`, `builtin`, `enabled`, and `settings` in `sub_140573A80`.
- Confirms startup reads the `web-tools` enabled state from the plugin store and writes a runtime side-channel field in `sub_140004B30`.

Still not closed:

- Fresh Windows runtime persisted defaults in `plugins.json`.
- Exact default `settings` object shape as persisted on Windows.
- `get_plugin_config` target-not-found/null response body.
- `update_plugin_config` target-not-found/update failure response body.
- Config UI product acceptance and frontend consumer behavior.
- Runtime ordering of web-tools side-channel updates after toggle/update.
