# System-shell-init local IDA outtake

Status: `duplicate_local_outtake_not_authoritative`.

This file name is retained only to avoid broken pointers from the local package created in this session. It is not an accepted full-leaf reducer and must not be consumed as a gate source.

Authoritative shell/bootstrap progress is in:

- `../macos-1.0.9-bootstrap/data/task-plan.json`
- `../windows-1.0.9-bootstrap/data/task-plan.json`
- `../cross-1.0.9-relay-core-bootstrap/data/task-plan.json`

Shared INDEX owner facts:

| Platform | Owner | Session | INDEX lines | Current gate |
| --- | --- | --- | --- | --- |
| macOS | `<workstation>` | `deep-mac-bootstrap-20260602` | `688-691`, reduce line `715` | `consumerStartReady` reduce, no gate promotion |
| Windows | `claude-sonnet-4-6 (deep-win-bootstrap)` | `deep-win-bootstrap-20260602` | `710-713` | `consumerStartReady_candidate` |

Local IDA comments set in this session:

`0x100334ce8`, `0x10033124c`, `0x100331688`, `0x1003317e4`, `0x100332790`, `0x100333924`, `0x10032f24c`, `0x10032ecbc`, `0x1003305b8`, `0x100263444`, `0x10026254c`, `0x1001cfd70`, `0x100577d34`.

These comments are reuse indexes only. Gate effect remains false:

```json
{
  "consumerStartReady": false,
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```
