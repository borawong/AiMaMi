# ACCOUNTS-DISPLAY-UNWRAP-PANIC-GUARD-STATIC-109

status: accepted_same_version_static_reducer_no_gate_promotion
module: accounts
version: AiMaMi 1.0.9
platform: macOS universal static
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

## Scope

This reducer closes one narrow static helper ambiguity in the accounts import/export family:
the `Result::unwrap` callsites observed inside `preview_account_import` and
`export_accounts_to_file` are display-formatting panic guards, not business parser,
export, serializer, side-effect, runtime envelope, or UI acceptance branches.

It does not classify unrelated `Result::unwrap` callsites in monitor/thread spawn or
other accounts helpers.

## IDB Evidence

- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- `preview_import` owner: `0x1005dd788`
- `preview_account_import` command body wrapper: `0x10032c93c`
- wrapper xref to owner: `0x10032cb40`
- preview unwrap callsite: `0x1005ddc18`
- `export_accounts` owner: `0x1005ddd0c`
- `export_accounts_to_file` command wrapper: `0x10032ce58`
- wrapper xref to owner: `0x10032d0cc`
- export unwrap callsites: `0x1005df5dc`, `0x1005df67c`
- panic/string cluster includes Display unexpected / Result unwrap failure strings near
  `0x100f3fed3` / `0x100f2fc66`.

IDA readback:

- `preview_import @ 0x1005dd788` enters `parse_import_file @ 0x1005e13fc`
  before registry/active helper reads and preview classification. The local unwrap callsite
  is reached from `Path::Display::fmt` formatting of the payload file path and falls through
  the standard `core::result::unwrap_failed @ 0x100db45b0` panic path only when Display
  formatting reports an impossible formatter error.
- `preview_account_import blocking body @ 0x10032c93c` performs StateManager
  `try_get` / lock, copies decoded `filePath`, calls the core preview owner, maps
  `CoreError` display into `Err<String>`, and returns `CoreEnvelope::ok` on success.
- `export_accounts @ 0x1005ddd0c` has the same display/string-formatting guard class at
  the two export unwrap callsites. These callsites are not the export file write,
  backup JSON field emission, skipped-account decision, or command envelope boundary.

## Static Conclusion

Accepted facts:

- `preview_account_import` unresolved helper note for `Result::unwrap` is reduced for the
  display-formatting callsite only.
- `export_accounts_to_file` unresolved helper note for `Result::unwrap` is reduced for the
  two display/string-formatting callsites only.
- These callsites are terminal panic guards for impossible formatter errors. They are not
  user-facing parser/runtime error semantics and do not add accepted request/envelope,
  no-write, write, rollback, UI-state, acceptance, or Windows evidence.

Still missing before strict / ready:

- accepted same-version WKWebView/Tauri IPC invocation for the selected accounts fixture
- exact request, success envelope, and error envelope bytes
- before/after bytes for no-write and write side effects
- executed UI-state / callback consumption proof
- executed source archive acceptance mapping
- independent Windows closure

## Gate

- `consumerStartReady`: unchanged
- `strictImplementationUse`: false / 0
- `readyToImplement`: false / 0
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false
- `moduleExitAllowed`: false
- `gateEffect`: no_promotion

## IDB Writeback

Comments were written to the IDB at:

- `0x1005ddc18`
- `0x1005df5dc`
- `0x1005df67c`

The database was saved after comment writeback.
