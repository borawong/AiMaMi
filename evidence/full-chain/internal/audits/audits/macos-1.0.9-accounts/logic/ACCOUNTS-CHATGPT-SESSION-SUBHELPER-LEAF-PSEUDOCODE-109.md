# Accounts ChatGPT Session Subhelper Leaf Pseudocode - AiMaMi 1.0.9

Scope: AiMaMi 1.0.9 macOS accounts-only subhelper evidence for
`import_chatgpt_session_account`.

This reducer consumes:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/`

It does not add product code, does not run product tests, does not edit
regulations, and does not promote `consumerStartReady`,
`strictImplementationUse`, `readyToImplement`, `implementation_use`,
`gate_accepted`, or `full_leaf_100`.

## Raw Evidence

- `INDEX.jsonl` row: `515`
- Manifest:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/manifest.json`
- Source app SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- Source app SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Arm64 thin SHA256:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`

Ghidra decompiled 8/8 requested target rows with 0 misses:

| Address | Role | Matched function |
|---|---|---|
| `0x100624a58` | nested session object finder | `codexmate_lib::core::auth::find_session_like_object::visit` |
| `0x1002ecd78` | hash lookup helper variant | `core::hash::BuildHasher::hash_one` |
| `0x10020bbb0` | timestamp formatter | `chrono::datetime::DateTime<Tz>::to_rfc3339` |
| `0x10080f270` | fallback current UTC time | `chrono::offset::utc::Utc::now` |
| `0x10080f378` | RFC3339 parser | `chrono::datetime::DateTime<chrono::offset::fixed::FixedOffset>::parse_from_rfc3339` |
| `0x1008116f8` | epoch-day conversion | `chrono::naive::date::NaiveDate::from_num_days_from_ce_opt` |
| `0x1004ced98` | chrono option/result expect helper | `chrono::expect` |
| `0x1008111ec` | timestamp subtraction helper | `chrono::naive::datetime::NaiveDateTime::checked_sub_signed` |

The call-tree script emitted 8 files. Six are gate-accepted static rows;
`DateTime<Tz>::to_rfc3339` and
`DateTime<FixedOffset>::parse_from_rfc3339` remain unresolved roots in the
script output because of generic target-name matching, but their pseudocode
files are present and accepted as same-version static Ghidra evidence.

## Static Behavior Reduced

`find_session_like_object::visit` now has direct pseudocode. It recursively
walks JSON values and returns a session-like object only when it can find
direct or nested fields matching the ChatGPT session contract. It checks direct
object keys such as `accessToken`, `sensitive-field`, `refreshToken`, `idToken`, and
`accountId`, and also handles nested `tokens` / `last_refresh` shapes before
returning a pointer or null.

`core::hash::BuildHasher::hash_one` now has direct pseudocode for the ChatGPT
call-site variant. It is a SipHash-style lookup helper used by the static code
for fields such as `exp` and existing account field membership. This closes the
hash helper as static pseudocode, but not runtime behavior or persistence bytes.

The chrono helpers now explain the static timestamp behavior:

- numeric `exp` can be converted into an RFC3339 timestamp;
- RFC3339 strings are parsed through the fixed-offset parser;
- missing or unparseable timestamp paths can fall back to `Utc::now`;
- synthetic sensitive-field windows use a checked subtraction path, including the
  `TimeDelta::hours out of bounds` / `DateTime - TimeDelta overflowed` panic
  guard string in unreachable overflow-style cases.

## Gate Effect

This reduces the static helper-leaf gap for the current ChatGPT session import
boundary. It does not prove any runtime evidence:

- no accepted Tauri IPC runtime invocation;
- no exact success/error envelope;
- no `sessionJson` / `overwriteExisting` null or omitted runtime decode
  behavior;
- no before/after snapshot, registry, or atomic-write bytes;
- no rollback/no-write fixture;
- no frontend runtime consumption proof;
- no executed acceptance;
- no Windows independent closure.

Gate state after the later static closure reducer:

- `consumerStartReady=true` for Gate 1 static context only
- `consumerStartBlocked=false` for Gate 1 static context only
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`
