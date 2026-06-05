# Frontend Consumer Chain 109 - MCP (macos)

This file is the consumer handoff for frontend control-flow, UI state, TanStack Query wiring, and current source archive code connection to the reverse backend contract. It does not change backend IDA owner evidence or promote gates by itself.

Current status: Live current source archive frontend chain exists for all four upstream MCP commands.

## Command Chain

### `load_mcp_servers`
- UI trigger: MCP page mount and refresh button
- TanStack field/state: ["mcp-servers"]
- API wrapper: `api.loadMcpServers()`
- Terminal invoke/callback: `invoke("load_mcp_servers")`
- UI consumption: page loading/error/empty/list state; refreshAction wraps refetch

### `upsert_mcp_server`
- UI trigger: Add/edit server dialog Save
- TanStack field/state: mutation; success invalidates ["mcp-servers"]
- API wrapper: `api.upsertMcpServer(payload)`
- Terminal invoke/callback: `invoke("upsert_mcp_server", { input })`
- UI consumption: dialog busy/error state; parses env field=value and headers Name: value; stdio args default [] and maps default {}

### `set_mcp_server_enabled`
- UI trigger: Server enabled Switch onCheckedChange
- TanStack field/state: mutation; success invalidates ["mcp-servers"]
- API wrapper: `api.setMcpServerEnabled(name, enabled)`
- Terminal invoke/callback: `invoke("set_mcp_server_enabled", { name, enabled })`
- UI consumption: per-server pendingToggleName disables switch; action error card on failure

### `remove_mcp_server`
- UI trigger: Delete button -> alert confirm
- TanStack field/state: mutation; success invalidates ["mcp-servers"]
- API wrapper: `api.removeMcpServer(name)`
- Terminal invoke/callback: `invoke("remove_mcp_server", { name })`
- UI consumption: removeAction busy; confirm dialog closes on success; action error card on failure

## TanStack / State Rules

`["mcp-servers"]` is the single cache owner. All mutators invalidate it on success; do not introduce per-row caches unless backend contract changes.

## Backend Contract Link

Raw leaves remain under `<source-location>/raw/aimami/1.0.9/macos/mcp/<command>/`. Use those leaves for owner/threading/interface/error/side-effect facts; use this file for current source archive frontend consumer wiring.

## Acceptance Mapping

Mount MCP page, refresh, create stdio/http server, toggle enabled, edit, remove, and verify dialog busy/error and cache refresh.

## Validator Notes

- MCP edit save currently submits enabled: true in the upsert payload, so editing a disabled server can implicitly enable it unless implementation changes that behavior deliberately.
- Most successful MCP mutations signal completion through dialog close/cache refresh rather than success toast.
- Current fast validation is source-level; mutation E2E/mock coverage is not comprehensive in this handoff.
