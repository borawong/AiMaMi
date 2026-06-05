# Accounts Preview Import Helper Leaf Pseudocode - AiMaMi 1.0.9

Scope: accounts-only, AiMaMi `1.0.9`, macOS. This reducer consumes the raw
helper-leaf bundle for `preview_account_import`. It does not create product
code, run product tests, edit regulations, or promote any consumer gate.

Raw evidence:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`

Canonical index: `INDEX.jsonl` row `511`.

## Result

Accepted as same-version macOS static helper-leaf pseudocode evidence only.

The previous preview root proof showed `preview_import` calling these helpers
without helper-specific pseudocode:

- `parse_import_file`
- `read_registry_or_empty_keys`
- `read_active_account_key`

The new raw bundle decompiled `4/4` target rows with Ghidra `-noanalysis` on
the existing analyzed 1.0.9 arm64 project:

| Address | Function | Evidence |
|---|---|---|
| `0x1005dd788` | `codexmate_lib::core::account_io::preview_import` | raw pseudocode row 1 in the manifest referenced above |
| `0x1005e13fc` | `codexmate_lib::core::account_io::parse_import_file` | raw pseudocode row 2 in the manifest referenced above |
| `0x1005e29f4` | `codexmate_lib::core::account_io::read_active_account_key` | raw pseudocode row 3 in the manifest referenced above |
| `0x1005e2b64` | `codexmate_lib::core::account_io::read_registry_or_empty_keys` | raw pseudocode row 4 in the manifest referenced above |

The call-tree now resolves `preview_import` to the three direct helpers above.
`Result::unwrap` remains an unresolved non-primary panic/display leaf.

## Static Behavior

The helper proof narrows the static backend behavior for
`preview_account_import`:

- `parse_import_file` checks file metadata, reads bytes, and deserializes the
  exported account JSON via `serde_json::de::from_trait`.
- `read_registry_or_empty_keys` checks registry metadata, reads registry JSON
  when present, deserializes it, and produces existing local account keys.
- `read_active_account_key` checks active-field metadata, reads the active field
  JSON/string path when present, and returns the current active local account
  field shape.
- `preview_import` uses those read/parse results to classify preview entries
  and counters, then returns preview payload data.

Static side-effect classification is unchanged but stronger: this path is
still read/parse/classify/return, with no persistence commit observed in the
preview command. This is not runtime no-write proof.

## Gate Effect

No promotion:

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false.
- `readyToImplement`: false.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.

Still missing for strict/highest gates:

- accepted real WKWebView/Tauri IPC invocation;
- exact request body and success/error/CoreError envelopes;
- before/after no-write bytes for auth, registry, quota, temp, and source
  fixture files;
- executed preview dialog / destructive toast UI-state;
- reducer-accepted fixture PASS/FAIL;
- Windows 1.0.9 independent platform closure.
