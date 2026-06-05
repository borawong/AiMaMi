# remove_mcp_server (macos)

- owner: `0x10015c300`
- thread model: sync mutex/TOML remove-save; no async/spawn
- interface: name; name string; success/error envelope
- side effect: remove MCP server block then durable config.toml write
- callees: 0x10015c300, 0x10061F5BC, 0x10061F480
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
