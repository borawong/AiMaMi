# switch_account_and_restart_codex

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x1408D39C0` references command string `0x14129c8c7` at xref `0x1408d3a88` and decompiles successfully in the Windows IDB. Threading model: tokio_async_switch_restart_task. Params: accountKey.

Important callees: sub_14060B1F0 scheduler, sub_140388010 await, sub_1404541A0 serializer, sub_14085C0D0 cleanup/refresh, tauri_ipc_resolve_sys. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
