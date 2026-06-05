# Frontend Full Chain - AiMaMi 1.0.9 macOS MCP

Scope: additive frontend/current-source archive consumer chain for the accepted macOS MCP closure. This file does not change gate state.

## Shell route and preload

- `src/main-app.tsx` lazy-loads the MCP route through `renderPage(route)`.
- Sidebar navigation calls 
avigateToRoute("mcp")`, starts route feedback, then commits the route after two animation frames through `startTransition`.
- `useMountedRoutes` keeps exiting routes mounted for the exit window before unmount.
- Route preloading runs after startup idle delay and on sidebar hover via `scheduleRoutePreload`.
- `RouteFeedbackGate` controls when the page subtree renders; MCP is not a HIGH_IO delayed route.

## UI entry

- Route/page: `src/components/mcp/mcp-page.tsx`.
- Overview surface: `src/components/overview/overview-page.tsx` MCP card/trend.

## Default load chain

```text
McpPage mount
  -> useQuery({ queryKey: ["mcp-servers"], staleTime: Infinity })
     -> if load_bootstrap_state seeded ["mcp-servers"], use cache and skip invoke
     -> otherwise api.loadMcpServers()
        -> invoke("load_mcp_servers", {})
        -> CoreEnvelope<McpServerListPayload>
```

`McpServerListPayload`:

```ts
{
  items: McpServerSummary[];
  total: number;
  sourcePath: string;
  lastScanAt: number;
}
```

`McpServerSummary`:

```ts
{
  name: string;
  transport: "stdio" | "http" | "sse" | "unknown";
  enabled: boolean;
  sourcePath: string;
  command: string | null;
  args: string[];
  url: string | null;
  headers: Record<string, string>;
  environment: Record<string, string>;
}
```

## API and invoke chain

- `api.loadMcpServers()` -> `invoke("load_mcp_servers")`.
- `api.upsertMcpServer(...)` -> `invoke("upsert_mcp_server")`.
- `api.setMcpServerEnabled(...)` -> `invoke("set_mcp_server_enabled")`.
- `api.removeMcpServer(...)` -> `invoke("remove_mcp_server")`.

Backend binding is `src-tauri/src/commands/mcp.rs` into `src-tauri/src/core/mcp.rs`.

## Interaction chain

| Interaction | UI trigger | Invoke | Params | Success effect |
|---|---|---|---|---|
| Refresh | Button with RotateCw icon | `load_mcp_servers` via refetch | `{}` | Refill `["mcp-servers"]` |
| Toggle enabled | Row Switch `onCheckedChange` | `set_mcp_server_enabled` | `{ name: string, enabled: boolean }` | Invalidate `["mcp-servers"]` |
| Confirm delete | AlertDialogAction | `remove_mcp_server` | `{ name: string }` | Clear removing state and invalidate `["mcp-servers"]` |
| Add or save | Editor dialog save button | `upsert_mcp_server` | `{ input: McpServerInput }` | Invalidate `["mcp-servers"]` and close dialog |

`upsert_mcp_server` uses IPC field `input`:

```ts
{
  name: string;
  transport: McpTransport;
  enabled: true;
  command: string | null;
  args: string[];
  url: string | null;
  headers: Record<string, string>;
  environment: Record<string, string>;
}
```

Important frontend behavior: add/edit payload always sends `enabled: true`; editing a disabled server can re-enable it unless the implementation deliberately changes that behavior.

Response DTOs:

- `set_mcp_server_enabled` -> `CoreEnvelope<McpServerMutationPayload>`.
- `upsert_mcp_server` -> `CoreEnvelope<McpServerMutationPayload>`.
- `remove_mcp_server` -> `CoreEnvelope<McpServerRemovePayload>`.

`McpServerMutationPayload`: `{ server: McpServerSummary; total: number; sourcePath: string }`.
`McpServerRemovePayload`: `{ removedName: string; total: number; sourcePath: string }`.

## Guards and errors

- Query error renders a visible alert card with `formatInvokeError(error)`.
- Toggle/remove mutation error renders a visible alert card.
- Upsert mutation error renders an inline error block inside the dialog.
- Toggle guard: `pendingToggleName === name` prevents duplicate toggle submission.
- Remove guard: `!removing || removeBusy`, where `removeBusy = removeAction.busy || removeMutation.isPending`.
- Save button is disabled when name is empty or the upsert mutation is pending.
- Most successful mutations signal completion through dialog close/cache refresh rather than success toast.

## Shell load and state effects

- `load_bootstrap_state` includes the `mcpServers` bootstrap cache slice.
- `src/main-app.tsx` seeds `["mcp-servers"]` from bootstrap data.
- MCP page loads `load_mcp_servers` on mount only when the bootstrap seed is absent or stale under Query rules.
- Mutations invalidate `["mcp-servers"]`.
