# Accounts Account IO ExportFile Deserializer Field Map Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`account_io::ExportFile` and `account_io::ExportedAccount` deserializer field
visitors used by preview/import account backup JSON parsing.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct SOT string-cluster checks from
`<source-location>/source-binary/`. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product code
or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `ExportFile::__Visitor::expecting`:
  `0x1005fb878`
- `ExportFile::__FieldVisitor::visit_str`:
  `0x1005fb8b4`
- `ExportedAccount::__Visitor::expecting`:
  `0x1005fba7c`
- `ExportedAccount::__FieldVisitor::visit_str`:
  `0x1005fcc40`
- SOT field string clusters include:
  `schemaVersion`, `kind`, `appVersion`, `exportedAt`, `exportedHostname`,
  `accountCount`, `accounts`, `accountKey`, `email`, `alias`, `accountName`,
  `workspaceName`, `profileName`, `plan`, `authMode`,
  `hasActiveSubscription`, `subscriptionExpiresAt`,
  `subscriptionWillRenew`, `createdAt`, `lastUsedAt`, and `auth`.

## Accepted Static Field Maps

`ExportFile::__FieldVisitor::visit_str` resolves this accepted field map:

| Field id | Accepted field |
|---:|---|
| 0 | `schemaVersion` |
| 1 | `kind` |
| 2 | `appVersion` |
| 3 | `exportedAt` |
| 4 | `exportedHostname` |
| 5 | `accountCount` |
| 6 | `accounts` |
| 7 | unknown / ignored field marker |

`ExportedAccount::__FieldVisitor::visit_str` resolves this accepted field map:

| Field id | Accepted field |
|---:|---|
| 0 | `accountKey` |
| 1 | `email` |
| 2 | `alias` |
| 3 | `accountName` |
| 4 | `workspaceName` |
| 5 | `profileName` |
| 6 | `plan` |
| 7 | `authMode` |
| 8 | `hasActiveSubscription` |
| 9 | `subscriptionExpiresAt` |
| 10 | `subscriptionWillRenew` |
| 11 | `createdAt` |
| 12 | `lastUsedAt` |
| 13 | `auth` |
| 14 | unknown / ignored field marker |

This confirms the read-side field recognition for account backup JSON. It does
not claim runtime required/default behavior, duplicate-field behavior, nested
auth sensitive-field decode semantics, exact export/import file bytes, or acceptance
fixture results.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md` for export backup
  construction and write path;
- `ACCOUNTS-PREVIEW-IMPORT-PARSER-ERROR-STATIC-109.md` for parser/error
  boundary classification;
- `ACCOUNTS-IMPORT-ACCOUNTS-COMMIT-STATIC-109.md` and
  `ACCOUNTS-IMPORT-ACCOUNTS-SELECTED-OVERWRITE-STATIC-109.md` for import
  commit/selection side-effect ordering;
- `ACCOUNTS-AUTH-FILE-sensitive-field-SERIALIZERS-STATIC-109.md` for nested auth field
  serializer shape.

## Still Missing Before Strict

- main `ExportFile` and `ExportedAccount` deserializer required/default matrix;
- duplicate-field, missing-field, null, wrong-type, and extra-field runtime
  decode behavior;
- exact preview/import request and runtime Tauri envelope bytes;
- exact backup JSON bytes and account ordering under export fixtures;
- nested `auth` object runtime decode bytes and sensitive-field value handling;
- conflict, selected-field, active-account, invalid-field, and missing-sensitive-field
  runtime fixture matrices;
- auth, registry, quota, and temp before-after bytes;
- rollback/no-rollback proof for write/rebuild failures;
- frontend dialog/toast/query-invalidation runtime state;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
