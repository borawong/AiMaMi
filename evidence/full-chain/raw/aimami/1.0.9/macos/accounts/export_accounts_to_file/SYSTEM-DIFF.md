# SYSTEM-DIFF - export_accounts_to_file

Scope: AiMaMi 1.0.9 macOS accounts `export_accounts_to_file`.

## Confirmed Same-Version Static Delta

- Frontend exposes `exportAccountsToFile(t, e)` and invokes
  `export_accounts_to_file` with `targetPath` and `accountKeys`.
- Backend command wrapper `0x10032ce58` forwards copied `targetPath` and
  optional `accountKeys` to core owner `0x1005ddd0c`.
- Core owner reads local account registry and selected auth snapshots, builds
  export JSON, normalizes `.aimami-accounts` filename suffix, and writes bytes
  through `relay::atomic_write::write_atomic`.

## Not Proven By This Leaf

- Runtime IPC bytes and CoreEnvelope/CoreError exact payloads.
- Runtime exported JSON byte ordering/escaping/timestamp/hostname fallback.
- Runtime before/after filesystem bytes and write-failure residue.
- Rendered save-dialog/toast/loading/query-invalidation state.
- Non-macOS behavior is outside this macOS leaf.

Gate effect: no promotion. This leaf is static same-version backend evidence
only.

