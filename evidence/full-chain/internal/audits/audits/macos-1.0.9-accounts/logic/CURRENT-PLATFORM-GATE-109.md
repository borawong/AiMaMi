# Current Platform Gate - AiMaMi 1.0.9 macOS Accounts

Scope: current macOS 1.0.9 accounts only.

This file records only the macOS accounts platform gate. It does not describe
or block on another platform folder.

## macOS SOT

- app: `<source-location>/source-binary/AiMaMi 1.0.9.app`
- binary: `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- IDA binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

The macOS SOT app exists and the binary SHA matches the IDA SOT binary.

## macOS Accounts Gate

| dimension | state |
|---|---|
| backend/static IDA | closed 9/9 |
| raw leaf bundles | clean 9/9 |
| same-version frontend CCF/UI-state | partial, not accepted for strict/highest |
| runtime IPC envelope bytes | missing |
| runtime side-effect bytes | missing |
| executed acceptance fixtures | missing |

## Gate Effect

No promotion:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Accounts remains the active module.
