# Accounts Load Sessions Owner Payload Static - AiMaMi 1.0.9

Scope: accounts/session-list surface for AiMaMi 1.0.9 macOS. This reducer
closes a previously unregistered static boundary for `load_sessions`: frontend
no-arg IPC wrapper, same-version backend owner, session source discovery, and
`SessionListPayload` serializer shape.

Evidence Source: SOT confirmed. IDA HTTP MCP is attached to the AiMaMi 1.0.9
SOT IDB under
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

This reducer writes no raw evidence, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product/main test, and promotes no
gate.

## Frontend Boundary

Current 1.0.9 frontend CCF evidence records `load_sessions` as a terminal
wrapper call with no argument keys:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl`
  row for `assets/sessions-page-_V8EZ45X.js`, terminal
  `wrapperCall`, command `load_sessions`, wrapper `F`, `argKeys=[]`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl`
  row for wrapper `loadSessions`, command `load_sessions`,
  `params=()`, `argObject=null`, `argKeys=[]`.

Static implication: the normal frontend path sends no command arguments. Direct
IPC extra-argument behavior and exact transport bytes remain runtime-only.

## Backend Owner And Source Discovery

IDA HTTP MCP resolves:

| Item | VA / evidence | Static fact |
|---|---|---|
| core owner | `codexmate_lib::core::sessions::load_sessions` at `0x1005716d0` | Same-version session list loader; large body references session row fields and session source strings. |
| rollout index helper | `codexmate_lib::core::sessions::build_rollout_index` at `0x100576880` | Walks rollout files and normalizes `\` to `/` in paths before inserting rollout metadata. |
| DB opener | `codexmate_lib::core::sessions::open_codex_db` at `0x1005755c8` | Opens rusqlite connection with flags, sets busy timeout, and formats open / busy-timeout errors. |
| payload serializer | `SessionListPayload::serialize` at `0x1001d3a54` | Serializes two map entries: `items` and `total`. |

`load_sessions` component strings include:

- `Documents`
- `Codex`
- `thread_name`
- `updated_at`
- `electron-saved-workspace-roots`
- `type`
- `%Y-%m-%dT%H:%M:%S%.6fZ`
- `exp`
- `search`
- `query`
- `resolve`
- `fetch`
- `payload`

The SQL/string cluster reached from rollout/session analysis includes:

- `codex-global-state.json`
- `SELECT id, title, updated_at, cwd, archived, agent_nickname, agent_role, source, model_provider FROM threads`
- `/payload/cwd`
- `/payload/timestamp`
- `/payload/source/subagent/thread_spawn/parent_thread_id`
- `/payload/source/subagent/thread_spawn/depth`
- `/payload/agent_nickname`
- `/payload/agent_role`
- `/payload/role`

## Static Error / Boundary Notes

`open_codex_db` statically formats rusqlite errors with:

- `sqlite open: `
- `sqlite busy_timeout: `

`build_rollout_index` statically skips missing rollout roots by checking
`std::fs::metadata` before walking. It filters filenames beginning with
`rollout-` and ending in `.jsonl`, extracts the stable middle component, joins
the last five path components with `/`, converts backslashes to slashes, and
stores rollout metadata in a hash map.

## Payload Shape

`SessionListPayload::serialize` writes:

| Field | Static source |
|---|---|
| `items` | first serialized map entry, 5-byte field from the `items...` string cluster |
| `total` | second serialized map entry, 5-byte field from the `total...` string cluster |

This closes the static top-level response shape only. It does not close every
nested session item field, live JSON bytes, ordering under real session files,
or runtime error envelope.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged; accounts remains Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer is useful implementation context for the accounts/session-list
surface, but it is not runtime IPC evidence, exact envelope bytes, before/after
filesystem proof, executed acceptance, or Windows parity.
