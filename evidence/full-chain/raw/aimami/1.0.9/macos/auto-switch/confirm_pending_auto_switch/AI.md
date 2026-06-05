# AI Handoff — confirm_pending_auto_switch

status: strictImplementationUse_dim1_5_closed_dim6_empty
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
owner_addr: 0x1002613d8
owner_symbol: codexmate_lib::commands::system::confirm_pending_auto_switch::he0179c0b61bc9903

interface:
  args: AppHandle (injected by Tauri), no user IPC params
  response: CoreEnvelope<SwitchPayload> (discriminant at a3+0)
  error: CoreError("No pending auto-switch request") if no pending; poisoned-lock; IO errors from switch_account

side_effects:
  - Repository::confirm_pending_auto_switch → load_pending_auto_switch (fs read) → switch_account (fs write)
  - accounts::refresh_full_runtime_snapshot(AppHandle) — async side effect triggered after confirm success

key_callees:
  - Repository::confirm_pending_auto_switch (0x1005eeb54)
    - load_pending_auto_switch (0x1005ea840): fs read
    - switch_account (0x1005e3cd0): fs write (active account update)
  - accounts::refresh_full_runtime_snapshot (0x1001e6a1c): async account refresh
  - drop<AppHandle> (0x10027d088)

error_behavior:
  - No pending: Err("No pending auto-switch request") — static alloc 30 bytes
  - Poisoned lock: Err discriminant=2 at a3

dim1-5: accepted. dim6: empty.
