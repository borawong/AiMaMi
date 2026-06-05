# upsert_mcp_server (windows)

- owner: `0x140277e50`
- thread model: sync mutex/TOML parse-edit-save; no async/spawn
- interface: name, transport/mode, command/args/url/headers/environment/open/path fields; server form DTO, optional headers/environment/args, success/error envelope
- side effect: insert or replace MCP server block then durable config.toml write
- callees: 0x140277e50, 0x140160FB0, managed_block_migration_core_sys, toml_block_renderer_core_sys
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
