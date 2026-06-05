# switch_account

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x140908B60` references command string `0x14129c9b7` at xref `0x140908c2e` and decompiles successfully in the Windows IDB. Threading model: tokio_async_switch_task_then_refresh. Params: accountKey.

Important callees: sub_14060AC10 scheduler, sub_140388010 await, sub_1404541A0 serializer, sub_14084DF80 progressive refresh, tauri_ipc_resolve_sys. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
