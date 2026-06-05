# load_mcp_servers (windows)

- owner: `0x1402758d0`
- thread model: sync mutex/TOML parse; no async/spawn
- interface: repo/path state only; returns McpServerSummary list with name/transport/command/args/url/headers/environment/enabled fields
- side effect: read config.toml MCP server blocks; no write/network/process
- callees: 0x1402758d0, 0x14015FD10, toml_block_renderer_core_sys
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
