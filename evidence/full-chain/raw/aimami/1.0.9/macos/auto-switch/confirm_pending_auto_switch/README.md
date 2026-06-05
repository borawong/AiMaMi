# confirm_pending_auto_switch — AiMaMi 1.0.9 macOS

同步时间: 2026-06-02
最终结论: strictImplementationUse

## Backend Control Flow
1. Mutex::lock(Repository)
2. Repository::confirm_pending_auto_switch(repo)
   - load_pending_auto_switch → read pending JSON
   - None → return Err("No pending auto-switch request")
   - Some → switch_account(target_id) → write active account
3. Success → refresh_full_runtime_snapshot(AppHandle) — async full account re-fetch
4. Returns CoreEnvelope<SwitchPayload>
5. drop(AppHandle), Mutex::unlock

## Error
- "No pending auto-switch request" (static, 30 bytes)
- Poisoned lock → CoreError Err variant

## Gate Leaf
dim1-5: accepted. dim6: empty.
