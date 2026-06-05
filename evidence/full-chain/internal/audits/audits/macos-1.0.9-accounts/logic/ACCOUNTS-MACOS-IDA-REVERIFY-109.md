# macOS accounts IDA reverify 2026-06-03

Produced at: 2026-06-03T02:07:06+08:00

Result: PASS. 9/9 accounts owners decompile in the current AiMaMi 1.0.9 macOS IDB. IDB comments were written and saved.

| command | owner | decompile | threading |
|---|---:|---:|---|
| `switch_account` | `0x1005e3cd0` | `540 lines / 20404 chars` | `tokio_blocking_repo_mutex` |
| `switch_account_and_restart_codex` | `0x1001e6be4` | `374 lines / 14833 chars` | `sync_switch_restart_recovery` |
| `preview_account_import` | `0x1005dd788` | `296 lines / 9072 chars` | `blocking_file_parse_no_write` |
| `import_accounts_from_file` | `0x1005dfb6c` | `1089 lines / 38697 chars` | `blocking_import_persist_rebuild_refresh` |
| `export_accounts_to_file` | `0x1005ddd0c` | `1360 lines / 49254 chars` | `blocking_export_atomic_write` |
| `logout` | `0x1005f1d84` | `229 lines / 8705 chars` | `repo_mutex_logout_refresh` |
| `remove_accounts` | `0x1005e4850` | `642 lines / 22856 chars` | `repo_mutex_remove_refresh` |
| `begin_add_account_attach_monitor` | `0x100262db4` | `235 lines / 9138 chars` | `monitor_attach_thread_spawn` |
| `import_chatgpt_session_account` | `0x1005e1d6c` | `525 lines / 20112 chars` | `blocking_import_persist_rebuild_refresh` |

Gate: full_leaf_100=true, strictImplementationUse=true, implementation_use=true, gate_accepted=true, moduleExitAllowed=true.
