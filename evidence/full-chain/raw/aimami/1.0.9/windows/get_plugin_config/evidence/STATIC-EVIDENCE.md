# Static Evidence

Leaf: `get_plugin_config`

This raw bundle contains a bounded Windows 1.0.9 static evidence reduction only. It verifies the canonical Windows binary SOT and records retained frontend IPC plus PE command-table string presence. It does not contain accepted Ghidra pseudocode, accepted backend owner semantics, accepted call-tree depth, or runtime acceptance.

## Confirmed

- Binary SOT: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`.
- SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`.
- Size: `26821632` bytes.
- Frontend delta source: `<source-location>/intermediate/aimami/1.0.9/windows/frontend-delta-classification/frontend-delta.json` reports the command retained across Windows 1.0.8 and 1.0.9 with quick minified IPC contract evidence.
- PE command table source: `<source-location>/intermediate/aimami/1.0.9/windows/load-relay-state-owner-pdata-calltree/disassembly/command-table-window.pD.txt` contains the contiguous sequence `list_plugins` / `toggle_plugin` / `get_plugin_config` / `update_plugin_config`.
- This command appears at file offset `0x1267752` and string VA `0x141269152` inside that table.

## Inferred

- The command name is present in the Windows 1.0.9 Tauri command table, so it is a real upstream command surface.
- The frontend wrapper evidence is enough to keep the target in the plugin config queue, but not enough to accept UI/state or config UI absence.
- For `update_plugin_config`, prior queue notes suggest a successful response shaped as `CoreEnvelope::ok(1)`, but this bundle does not prove that on Windows 1.0.9.
- For `get_plugin_config`, prior queue notes suggest found/not-found behavior matters, but this bundle does not prove exact Windows 1.0.9 envelope semantics.
- Plugin config behavior likely depends on registry/store/config state, but persistence and rollback semantics are still unresolved.

## Unknown

- Accepted backend owner body and non-failed same-platform pseudocode are missing.
- Deep call-tree to implementation leaves is missing.
- Strict DTO/default/settings/capabilities/schema parity is missing.
- Exact error envelope and side-effect/rollback boundary are missing.
- Visible config UI absence or accepted product decision is missing.
- Runtime or test acceptance mapping is missing.

## Gate Effect

All gate fields stay false. This is `blocked` / `no_promotion` evidence only.