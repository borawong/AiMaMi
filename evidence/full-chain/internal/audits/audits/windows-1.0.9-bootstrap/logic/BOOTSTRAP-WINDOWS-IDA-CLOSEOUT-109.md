# Bootstrap Windows IDA Closeout - AiMaMi 1.0.9

Scope: additive closeout evidence for `windows-1.0.9-bootstrap`. This file does not change `gate-report.json` or `data/task-plan.json` because this bundle has an existing owner boundary.

## Owner Matrix

- target path: `<source-location>/audits/windows-1.0.9-bootstrap/`
- canonical scope: `aimami/1.0.9/windows-x64/bootstrap`
- current producer in package: `deep-win-bootstrap-20260602` via INDEX rows 675-687 and 710-713
- current session: Codex local additive review, no takeover sensitive-field
- source task-plan: `data/task-plan.json` still marks four bootstrap leaves as `consumerStartReady_candidate`
- allowed write mode: additive `logic/*.md`, `reviews/*.md`, `frontend/*FULL-CHAIN*.md`
- collision status: existing owner present; no canonical gate overwrite
- takeover sensitive-field status: none

## IDA Evidence Now Available

The Windows IDA MCP is online for the same source binary SHA `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`.

- `app_cli_dispatcher_sys` @ `0x1400010D0`: parses `daemon-run-once` with inline XOR string check; routes either to daemon one-shot setup or to `app_run_entry_bootstrap_sys`.
- `app_run_entry_bootstrap_sys` @ `0x140004B30`: decompiled. It builds Codex paths, initializes single-instance/bootstrap state, creates Repository/RelayManager/PluginRegistry managed states, wires Tokio/Tauri plugins/context, then builds and runs the app.
- `auto_switch_watcher_bootstrap_sys` @ `0x14028CCB0`: decompiled. It is the native bootstrap substitute for the auto-switch watcher and reaches config/state reads plus thread spawn behavior.
- `std_thread_spawn_wrapper_sys` @ `0x140004980`: decompiled. It reaches the CreateThread helper and `CloseHandle`, with panic path for failed thread spawn.
- `managed_state_register_sys` @ `0x141208810`: decompiled TypeMap registration shim; callers include `app_run_entry_bootstrap_sys` and state registration wrappers.
- `load_bootstrap_state_owner_sys` @ `0x140272E80`: decompiled. This is the canonical daemon IPC leaf consumed by `bootstrap_cache`; it resolves via Tauri IPC and is already covered in the Windows daemon-autoswitch package.

IDB comments were written at all six addresses and the Windows IDB was saved.

## Gate Impact

This pass removes the stale "IDA MCP offline" factual blocker from the additive review layer.

It does not promote the canonical Windows bootstrap gate because the package `AGENTS.md` explicitly says the current gate remains candidate/consumer-start unless the canonical producer updates it or an owner authorization is present.

## Remaining Canonical Work

- Decide owner takeover or route the new IDA evidence back to `deep-win-bootstrap-20260602`.
- If takeover is authorized, rewrite package `manifest.json`, `gate-report.json`, and `data/task-plan.json` from this IDA closeout plus raw leaf manifests.
- Add dim6 acceptance mapping per leaf before any `readyToImplement/full_leaf_100` promotion.

