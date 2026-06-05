# upsert_mcp_server (macos)

- owner: `0x10015c8d4`
- thread model: sync mutex/TOML parse-edit-save; no async/spawn
- interface: name, transport/mode, command/args/url/headers/environment/open/path fields; server form DTO, optional headers/environment/args, success/error envelope
- side effect: insert or replace MCP server block then durable config.toml write
- callees: 0x10015c8d4, 0x10061FCC0, 0x10061F480
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
