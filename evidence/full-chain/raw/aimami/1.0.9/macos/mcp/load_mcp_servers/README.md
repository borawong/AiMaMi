# load_mcp_servers (macos)

- owner: `0x10015be84`
- thread model: sync mutex/TOML parse; no async/spawn
- interface: repo/path state only; returns McpServerSummary list with name/transport/command/args/url/headers/environment/enabled fields
- side effect: read config.toml MCP server blocks; no write/network/process
- callees: 0x10015be84, 0x10061d598
- gate: readyToImplement/full_leaf_100 accepted for this platform leaf.
