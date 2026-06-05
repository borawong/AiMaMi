# AI producer notes

Role: execution / producer.

This leaf was produced from IDA MCP evidence against AiMaMi 1.0.9 Windows x64 only. It intentionally avoids runtime execution, real user `plugins.json` reads, and cross-version or macOS extrapolation.

## Decisions

- Treat `sub_1405999D0` as the bounded equivalent of `all_builtin_plugins`.
- Treat `sub_14024FF30` as `builtin::web_tools::plugin_info` equivalent.
- Treat `sub_140599610` as the companion builtin `image-support`/Vision plugin info builder.
- Keep `default enabled`, `default settings`, `get_config not-found`, and `update_settings not-found` as blocked/candidate-only unless directly supported by this Windows static leaf.

## Non-decisions

- No INDEX update was written.
- No task plan update was written.
- No consumer-gate promoted artifact was written.
- No implementation-use gate was accepted.
