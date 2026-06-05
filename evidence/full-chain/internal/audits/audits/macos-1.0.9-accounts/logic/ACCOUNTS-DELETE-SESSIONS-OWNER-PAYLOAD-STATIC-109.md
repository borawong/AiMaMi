# Accounts Delete Sessions Owner Payload Static - AiMaMi 1.0.9

Scope: accounts/session-list surface for AiMaMi 1.0.9 macOS. This reducer
closes the previously unregistered static boundary for `delete_sessions`:
frontend mutation wrapper, same-version command wrapper, backend owner,
sqlite/file/global-state side-effect outline, and top-level
`SessionDeletePayload` serializer shape.

Evidence Source: SOT confirmed. IDA HTTP MCP is attached to the AiMaMi 1.0.9
SOT IDB under
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

This reducer writes no raw evidence, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product/main test, and promotes no
gate.

## Frontend Boundary

Current 1.0.9 frontend evidence records `delete_sessions` as an `ids` command
from the sessions page:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl`
  row 29: wrapper `deleteSessions`, command `delete_sessions`,
  `params=t`, `argObject={ids:t}`, `argKeys=["ids"]`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl`
  row 75: `assets/sessions-page-_V8EZ45X.js`, trigger
  `useMutation.mutationFn`, wrapper `F`, command `delete_sessions`,
  `argKeys=["ids"]`.
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/query-hits.jsonl`
  rows 26-28: on success, frontend removes returned `deletedIds` from selected
  state, clears active detail if needed, invalidates `["sessions"]`, and
  refetches active `["usage-analytics"]`.

Static implication: the normal frontend path sends a single `ids` array-like
argument and consumes response `data.deletedIds` plus session/usage query
refreshes. Direct IPC omitted/null/wrong-type `ids` behavior remains a
pre-command runtime/Tauri decode boundary.

## Backend Owner And Side Effects

IDA HTTP MCP resolves:

| Item | VA / evidence | Static fact |
|---|---|---|
| command wrapper | `codexmate_lib::commands::sessions::delete_sessions` at `0x10015f5dc` | Locks app state, calls core owner, maps core error display to command error string, wraps success with `CoreEnvelope<T>::ok`. |
| core owner | `codexmate_lib::core::sessions::delete_sessions` at `0x1005759ec` | Accepts requested ids, builds a set, opens the sessions sqlite DB, removes graph/thread rows, deletes matched content files, rewrites global-state JSONL, and returns deleted ids/count. |
| rollout index helper | `codexmate_lib::core::sessions::build_rollout_index` at `0x100576880` | Reused to resolve rollout/content records by session id. |
| DB opener | `codexmate_lib::core::sessions::open_codex_db` at `0x1005755c8` | Reused sqlite open/busy-timeout helper. |
| payload serializer | `SessionDeletePayload::serialize` at `0x1001d4a08` | Serializes two map entries: `deletedIds` and `deletedCount`. |

Important static branches:

- Empty input id list returns a core error before sqlite/file/global-state
  mutation.
- When sqlite exists, each matching id attempts:
  - `DELETE FROM thread_spawn_edges WHERE child_thread_id = ?1 OR parent_thread_id = ?1`
  - `DELETE FROM threads WHERE id = ?1`
- For matched rollout/content paths, existing files are checked with
  `std::fs::metadata` and removed with `std::sys::fs::remove_file`.
- If global state JSONL exists, the owner reads it, parses each line as JSON,
  checks JSON field `id`, omits matched rows, joins retained lines with newline,
  appends a trailing newline, and writes the file back.

## Static Error / Boundary Notes

Static sqlite error prefixes:

- `sqlite delete spawn edge: `
- `sqlite delete thread: `

Filesystem read/write/remove failures are surfaced through the core error path
instead of being accepted as deleted. JSON parse failures while scanning
global-state lines are swallowed for that line and the original line is retained
unless a parsed `id` matches the delete set.

## Payload Shape

`SessionDeletePayload::serialize` writes:

| Field | Static source |
|---|---|
| `deletedIds` | first serialized map entry, 10-byte field from the `deletedIds...` string cluster |
| `deletedCount` | second serialized map entry, 12-byte field from the `deletedCount...` string cluster |

This closes the static top-level response shape only. It does not close exact
runtime envelope bytes, ordering of deleted ids under mixed sqlite/file/jsonl
fixtures, rollback/no-rollback bytes, UI timing, or Windows parity.

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
