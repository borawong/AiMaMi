# begin_add_account_attach_monitor

Status: accepted_full_leaf_100_ida_direct_windows_accounts.

Windows AiMaMi 1.0.9 owner `0x140283580` references command string `0x141268d98` at xref `0x140283600` and decompiles successfully in the Windows IDB. Threading model: sync_tauri_ipc_state_owner_monitor_attach. Params: none.

Important callees: get_usage_refresh_interval_core_read, tauri_ipc_resolve_sys, sub_140068830, sub_1400AB900. Terminal helpers: atomic write `relay_atomic_write_file_sys 0x140332540 -> MoveFileExW/CreateFileW/CloseHandle`, write leaf `0x14104E390 -> 0x141036DB0 NtWriteFile`, runtime event `0x1400AF970 runtime-state-updated / PROGRESSIVE_STATE_SAVE_FAILED`.
