# preview_account_import

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x1408FA200` references command string `0x14129c7f8` at xref `0x1408fa2c8` and decompiles successfully in the Windows IDB. Threading model: tokio_async_task_scheduler_await. Params: filePath.

Important callees: sub_14060A630 scheduler, sub_140387100 await, sub_140458F10 serializer, tauri_ipc_resolve_sys. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
