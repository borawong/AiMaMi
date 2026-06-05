# Frontend Full Chain - AiMaMi 1.0.9 Windows MCP

Scope: additive frontend/current-source archive consumer chain for the accepted Windows MCP closure. This file does not change gate state.

## UI entry

- Route/page: `src/components/mcp/mcp-page.tsx`.
- Overview surface: `src/components/overview/overview-page.tsx` MCP card/trend.

## API and invoke chain

- `api.loadMcpServers()` -> `invoke("load_mcp_servers")`.
- `api.upsertMcpServer(...)` -> `invoke("upsert_mcp_server")`.
- `api.setMcpServerEnabled(...)` -> `invoke("set_mcp_server_enabled")`.
- `api.removeMcpServer(...)` -> `invoke("remove_mcp_server")`.

Backend binding is `src-tauri/src/commands/mcp.rs` into `src-tauri/src/core/mcp.rs`.

## Shell load and state effects

- `load_bootstrap_state` includes the `mcpServers` bootstrap cache slice.
- `src/main-app.tsx` seeds `["mcp-servers"]` from bootstrap data.
- MCP page loads `load_mcp_servers` on mount.
- Mutations invalidate `["mcp-servers"]`.

