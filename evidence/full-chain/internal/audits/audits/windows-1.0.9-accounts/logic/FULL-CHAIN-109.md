# Windows Accounts Full Chain 1.0.9

All nine Windows accounts commands were resolved by IDA string xrefs, owner decompile, component/callee analysis, IDB comments, and IDB save.

| Command | Owner | Params | Important callees | Side effects |
|---|---|---|---|---|
| begin_add_account_attach_monitor | 0x140283580 | none | get_usage_refresh_interval_core_read, tauri_ipc_resolve_sys, sub_140068830, sub_1400AB900 | repo snapshot read, monitor attach state, tauri ipc resolve |
| preview_account_import | 0x1408FA200 | filePath | sub_14060A630 scheduler, sub_140387100 await, sub_140458F10 serializer, tauri_ipc_resolve_sys | file read/parse only, no account persistence, tauri ipc resolve |
| logout | 0x1408D8790 | none | sub_1406088D0 scheduler, sub_140387source archive0 await, sub_140449AE0 serializer, sub_14084DF80 progressive refresh, tauri_ipc_resolve_sys | auth/session clear, registry persist, runtime refresh, tauri ipc resolve |
| import_chatgpt_session_account | 0x1408FEBB0 | sessionJson, overwriteExisting | sub_140608EB0 import scheduler, sub_140388580 import await, sub_14060AF00 refresh scheduler, sub_140387680 refresh await, sub_140438BB0 success envelope, sub_140452FC0 DTO serializer, tauri_ipc_resolve_sys | account import persistence, registry/auth rebuild, runtime refresh, warning on refresh failure, tauri ipc resolve |
| switch_account_and_restart_codex | 0x1408D39C0 | accountKey | sub_14060B1F0 scheduler, sub_140388010 await, sub_1404541A0 serializer, sub_14085C0D0 cleanup/refresh, tauri_ipc_resolve_sys | active account switch, auth/registry persist, Codex restart/recovery, runtime refresh, tauri ipc resolve |
| export_accounts_to_file | 0x1408C7A80 | targetPath, accountKeys | sub_140608000 scheduler, sub_1403874C0 await, sub_140445390 export serializer, sub_14085BD70 cleanup, relay_atomic_write_file_sys, tauri_ipc_resolve_sys | read registry/auth/account summaries, write export file, tauri ipc resolve |
| import_accounts_from_file | 0x1408BE4C0 | filePath, overwriteExisting, selectedKeys | sub_1406091A0 import scheduler, sub_140387A70 import await, sub_14060A340 refresh scheduler, sub_140387680 refresh await, sub_140451910 serializer, sub_1400AF970 runtime-state-updated, tauri_ipc_resolve_sys | read import file, registry/auth persistence, runtime refresh, runtime-state-updated, tauri ipc resolve |
| remove_accounts | 0x140902940 | accountKeys | sub_1406082F0 scheduler, sub_140387300 await, sub_14044F9A0 serializer, sub_14085C770 cleanup/refresh, sub_14084DF80 progressive refresh, tauri_ipc_resolve_sys | registry/auth/account removal, active account handling, runtime refresh, tauri ipc resolve |
| switch_account | 0x140908B60 | accountKey | sub_14060AC10 scheduler, sub_140388010 await, sub_1404541A0 serializer, sub_14084DF80 progressive refresh, tauri_ipc_resolve_sys | active account switch, auth/registry persistence, runtime refresh, tauri ipc resolve |
