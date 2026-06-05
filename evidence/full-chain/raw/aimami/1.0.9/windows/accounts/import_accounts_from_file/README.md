# import_accounts_from_file

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x1408BE4C0` references command string `0x14129c956` at xref `0x1408be588` and decompiles successfully in the Windows IDB. Threading model: tokio_async_import_file_task_then_refresh_task. Params: filePath, overwriteExisting, selectedKeys.

Important callees: sub_1406091A0 import scheduler, sub_140387A70 import await, sub_14060A340 refresh scheduler, sub_140387680 refresh await, sub_140451910 serializer, sub_1400AF970 runtime-state-updated, tauri_ipc_resolve_sys. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
