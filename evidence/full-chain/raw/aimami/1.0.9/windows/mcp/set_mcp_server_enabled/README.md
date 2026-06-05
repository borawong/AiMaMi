# set_mcp_server_enabled (windows)

- owner: `0x14027ff70`
- thread model: sync mutex/load-find-upsert; no async/spawn
- interface: name, enabled; name string + enabled bool; not-found error if missing
- side effect: toggle enabled on existing MCP server then durable config.toml write
- callees: 0x14027ff70, 0x140162230, toml_block_renderer_core_sys
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
