# export_accounts_to_file

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x1408C7A80` references command string `0x14129c8f1` at xref `0x1408c7b48` and decompiles successfully in the Windows IDB. Threading model: tokio_async_export_task. Params: targetPath, accountKeys.

Important callees: sub_140608000 scheduler, sub_1403874C0 await, sub_140445390 export serializer, sub_14085BD70 cleanup, relay_atomic_write_file_sys, tauri_ipc_resolve_sys. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
