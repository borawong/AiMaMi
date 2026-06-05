# set_mcp_server_enabled (macos)

- owner: `0x10015d360`
- thread model: sync mutex/load-find-upsert; no async/spawn
- interface: name, enabled; name string + enabled bool; not-found error if missing
- side effect: toggle enabled on existing MCP server then durable config.toml write
- callees: 0x10015d360, 0x100621F4C, 0x10061FCC0, 0x10061F480
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
