# plugins full leaf IDA closure

Platform: macos
Result: PASS 13/13.

| leaf | kind | owner | gate |
|---|---|---:|---|
| `list_plugins` | `command` | `0x1003262b8` | PASS |
| `toggle_plugin` | `command` | `0x10015f064` | PASS |
| `get_plugin_config` | `command` | `0x10015f338` | PASS |
| `update_plugin_config` | `command` | `0x10015f440` | PASS |
| `PluginRegistry__list` | `registry` | `0x10015bd38` | PASS |
| `PluginRegistry__set_enabled` | `registry` | `0x10015b18c` | PASS |
| `PluginRegistry__get_config` | `registry` | `0x10015ac24` | PASS |
| `PluginRegistry__update_settings` | `registry` | `0x10015b42c` | PASS |
| `PluginRegistry__save_store_static` | `store` | `0x10015b6fc` | PASS |
| `PluginStoreSchema__serialize` | `models` | `0x100673ed0` | PASS |
| `builtin__all_builtin_plugins` | `builtin` | `0x100386660` | PASS |
| `builtin__web_tools__plugin_info` | `builtin` | `0x100386780` | PASS |
| `builtin__image_support__plugin_info` | `builtin` | `0x1003863bc` | PASS |
