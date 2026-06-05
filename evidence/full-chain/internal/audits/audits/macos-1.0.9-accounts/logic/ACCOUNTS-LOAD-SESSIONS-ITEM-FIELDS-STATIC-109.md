# Accounts Load Sessions Item Fields Static - AiMaMi 1.0.9

Scope: accounts/session-list nested `load_sessions.items[]` item field source
and frontend consumption for AiMaMi 1.0.9 macOS. This reducer complements
`logic/ACCOUNTS-LOAD-SESSIONS-OWNER-PAYLOAD-STATIC-109.md`; it does not replace
that top-level payload reducer.

Evidence Source: SOT confirmed. IDA HTTP MCP is attached to the AiMaMi 1.0.9
SOT IDB under
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
Source executable SHA-256:
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

This reducer writes no raw evidence, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product/main test, and promotes no gate.

## Frontend Consumption

Current 1.0.9 frontend evidence ties the session page to `load_sessions`:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/query-hits.jsonl`
  row 25: `queryKey=["sessions"]`, `queryFn=()=>F.loadSessions()`, response
  consumption `(N==null?void 0:N.data.items)??[]`, item map
  
ew Map(B.map(r=>[r.id,r]))`, and group builder `we(B)`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl`
  row 74: `assets/sessions-page-_V8EZ45X.js` terminal `wrapperCall`,
  command `load_sessions`, wrapper `F`, `argKeys=[]`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl`
  row 28: wrapper `loadSessions`, command `load_sessions`, `params=()`,
  `argObject=null`, `argKeys=[]`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/sessions-page-_V8EZ45X.js`
  line 6: session tree groups items by `isConversationThread`,
  `projectPath`, `projectName`, `projectPathMissing`, builds parent-child
  relations from `id` and `parentSessionId`, sorts by `updatedAt`, renders
  `threadName`, `updatedAt`, `fileSize`, `agentNickname`, `agentRole`, and
  orphan badges, and sends selected `id` values to `deleteSessions`.

Static implication: the rendered session tree consumes item-level fields, not
only the top-level `items` and `total` payload keys.

## Backend Static Field Sources

IDA HTTP MCP resolves the backend owner:

| Item | VA / evidence | Static fact |
|---|---|---|
| core owner | `codexmate_lib::core::sessions::load_sessions @ 0x1005716d0` | Same-version session list loader. |
| parent payload serializer | `SessionListPayload::serialize @ 0x1001d3a54` | Top-level `items` and `total`. |
| nested item serializer | `CodexSession::serialize @ 0x1001d810c` | Serializes the nested `items[]` element shape. |
| SQL / JSON pointer cluster | string cluster at `0x100f3ce74`; direct datarefs from `load_sessions` include `0x1005717fc`, `0x100572254`, `0x100572e30`, `0x100573194`, `0x100573668`, `0x100573800`, `0x100573868`, `0x1005738c4` | Same owner references sqlite row fields and rollout JSON pointer fallbacks. |

The same-version `load_sessions` owner prepares:

`SELECT id, title, updated_at, cwd, archived, agent_nickname, agent_role, source, model_provider FROM threads`

and also references rollout/global-state fallback pointers:

- `/payload/cwd`
- `/payload/timestamp`
- `/payload/source/subagent/thread_spawn/parent_thread_id`
- `/payload/source/subagent/thread_spawn/depth`
- `/payload/agent_nickname`
- `/payload/agent_role`
- `/payload/role`

Hex-Rays lines for `load_sessions @ 0x1005716d0` show:

- line 515: `rusqlite::Connection::prepare_with_flags` on the session SQL
  above;
- lines 2060-2063: `serde_json::Value::pointer` for `/payload/cwd`;
- lines 2098-2104: pointer `/payload/timestamp` plus RFC3339 parse;
- lines 2140-2143: pointer
  `/payload/source/subagent/thread_spawn/parent_thread_id`;
- lines 2177-2180: pointer `/payload/source/subagent/thread_spawn/depth`;
- lines 2195-2198: pointer `/payload/agent_nickname`;
- lines 2234-2237: pointer `/payload/agent_role`.

`CodexSession::serialize @ 0x1001d810c` writes these item fields in static
serialize order:

| Order | Serialized field | Decompile line / source slot |
|---:|---|---|
| 1 | `id` | line 30, source `a1 + 16` |
| 2 | `threadName` | lines 35-39, source `a1 + 40` |
| 3 | `updatedAt` | lines 44-48, source `a1 + 232` |
| 4 | `fileSize` | line 53, source `a1` |
| 5 | `filePath` | lines 58-62, source `a1 + 64` |
| 6 | `projectName` | lines 67-71, source `a1 + 88` |
| 7 | `projectPath` | lines 76-80, source `a1 + 112` |
| 8 | `parentSessionId` | lines 85-89, source `a1 + 136` |
| 9 | `depth` | lines 94-98, source `a1 + 240` |
| 10 | `agentNickname` | lines 103-107, source `a1 + 160` |
| 11 | `agentRole` | lines 112-116, source `a1 + 184` |
| 12 | `isArchived` | lines 121-125, source `a1 + 244` |
| 13 | `excerpt` | lines 130-134, source `a1 + 208` |
| 14 | `projectPathMissing` | lines 139-143, source `a1 + 245` |
| 15 | `isConversationThread` | lines 148-152, source `a1 + 246` |

## Accepted Static Field Matrix

| Item field / frontend field | Static source |
|---|---|
| `id` | sqlite `threads.id`; frontend uses it as map field, selection id, parent-child lookup field, and delete id. |
| `threadName` / title | sqlite `threads.title`; owner also checks rollout `thread_name` fallback strings. Frontend renders `session.threadName`. |
| `updatedAt` | sqlite `threads.updated_at`; owner also reads `/payload/timestamp` and parses RFC3339 fallback. Frontend sorts by `updatedAt` and renders formatted time. |
| `cwd` / project path input | sqlite `threads.cwd`; owner also reads `/payload/cwd`. |
| `isArchived` | item serializer field; sqlite source is `threads.archived`. Current session page evidence does not render this field directly. |
| `agentNickname` | sqlite `threads.agent_nickname`; owner also reads `/payload/agent_nickname`. Frontend falls back to role unknown only after `agentNickname` / `agentRole`. |
| `agentRole` | sqlite `threads.agent_role`; owner also reads `/payload/agent_role` and `/payload/role`. Frontend renders it after nickname fallback. |
| `source` | sqlite `threads.source`; owner reads subagent source pointers. Frontend renders tree/orphan semantics through derived item fields rather than raw `source`. |
| `modelProvider` | sqlite `threads.model_provider`; same owner selects it, but this field is not present in the confirmed `CodexSession::serialize` item field list and current session page evidence does not render it directly. |
| `parentSessionId` | derived from rollout/global-state subagent thread-spawn pointers; frontend uses it to build parent-child relations and orphan counts. |
| `isConversationThread`, `projectPath`, `projectName`, `projectPathMissing`, `fileSize` | consumed by frontend grouping/rendering; exact backend derivation is partially inferred from owner rollout/source traversal and remains not fully closed at nested DTO parity level. |

## Boundaries / Unknown

This reducer is static-only. It does not prove:

- exact serialized JSON bytes for each nested item;
- live sqlite rows, rollout JSONL bytes, or global-state fixture bytes;
- exact field casing under runtime transport beyond frontend consumption names and
  static source strings;
- row ordering under real databases;
- runtime IPC envelope/error bytes;
- rendered UI state from a live AiMaMi WKWebView;
- executed acceptance;
- Windows parity.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged; accounts remains Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer reduces a nested item static field-source gap for
`load_sessions.items[]`, but it is not sufficient for strict implementation use
or full leaf 100.
