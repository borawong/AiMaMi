# plugins full leaf IDA closure

Platform: windows-x64
Result: PASS 13/13.

| leaf | kind | owner | gate |
|---|---|---:|---|
| `list_plugins` | `command` | `0x1402663e0` | PASS |
| `toggle_plugin` | `command` | `0x140282b70` | PASS |
| `get_plugin_config` | `command` | `0x140281c40` | PASS |
| `update_plugin_config` | `command` | `0x1402663e0` | PASS |
| `PluginRegistry__list` | `registry` | `0x1403ee7a0` | PASS |
| `PluginRegistry__set_enabled` | `registry` | `0x1403ed760` | PASS |
| `PluginRegistry__get_config` | `registry` | `0x1403ed0d0` | PASS |
| `PluginRegistry__update_settings` | `registry` | `0x1403edaa0` | PASS |
| `PluginRegistry__save_store_static` | `store` | `0x1403edec0` | PASS |
| `PluginStoreSchema__serialize` | `models` | `0x140573e60` | PASS |
| `builtin__all_builtin_plugins` | `builtin` | `0x1403ee200` | PASS |
| `builtin__web_tools__plugin_info` | `builtin` | `0x1403ee200` | PASS |
| `builtin__image_support__plugin_info` | `builtin` | `0x1403ee200` | PASS |
