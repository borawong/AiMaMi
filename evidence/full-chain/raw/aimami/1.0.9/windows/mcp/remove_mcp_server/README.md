# remove_mcp_server (windows)

- owner: `0x140279ad0`
- thread model: sync mutex/TOML remove-save; no async/spawn
- interface: name; name string; success/error envelope
- side effect: remove MCP server block then durable config.toml write
- callees: 0x140279ad0, 0x140160500, toml_block_renderer_core_sys
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
