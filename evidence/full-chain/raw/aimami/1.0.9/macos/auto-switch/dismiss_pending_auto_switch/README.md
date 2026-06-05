# dismiss_pending_auto_switch — AiMaMi 1.0.9 macOS

updated: 2026-06-03 (deep-recovery pass — all callee bodies decompiled, snooze keys rodata-confirmed)
session: wf-aimami109-fullsurface-audit
sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

## IPC Command Owner

VA: 0x1002618b4  SIZE: 0x270  BLOCKS: 25
Symbol: codexmate_lib::commands::system::dismiss_pending_auto_switch::haa9489ddd069e24a
Acquires OnceBox<Mutex<Repository>>, delegates to Repository::dismiss_pending_auto_switch

## Backend Control Flow (IDA decompile 2026-06-03)

1. atomic_load_explicit OnceBox pointer
2. Mutex::lock @0x100d3499c
3. if poisoned: panic "poisoned lock: another task failed inside"
4. Repository::dismiss_pending_auto_switch @0x1005eec9c (76 blocks):
   a. load_pending_auto_switch @0x1005ea840 — read_to_string(a1+488/496) + serde_json
      - None on missing/parse-err: return Ok(None) discriminant=10 byte=0
   b. SystemTime::now + duration_since — capture dismissedAt timestamp
   c. CodexPaths::ensure_directories — Err(2) on failure
   d. alloc(128,1) — 128-byte JSON buffer
   e. serde SerializeMap x3 (keys rodata-confirmed 2026-06-03):
      - "currentAccountKey"   anon_393@0x100f3f5a0 len=17
      - "candidateAccountKey" anon_394@0x100f3f5b1 len=19
      - "dismissedAt"         anon_395@0x100f3f5c4 len=11
   f. std::fs::write(a1+512/520, json) — write snooze record; Err(2) on failure
   g. drop AutoSwitchSnoozeRecord
   h. clear_auto_switch_snooze(a1+488/496) — remove_file; NotFound->Ok; Err(2) other
   i. return Ok(()) discriminant=10 byte=1 on success
5. Mutex::unlock @0x100d349b8 (all paths)

## Snooze JSON Schema (rodata-confirmed)

{"currentAccountKey":"<str>","candidateAccountKey":"<str>","dismissedAt":"<timestamp>"}

## Interface

- Args: none
- Response: Result<()> at a2+0
  - 10 byte=0: Ok(None) — no pending request
  - 10 byte=1: Ok(())   — success
  -  2:        Err(CoreError::Io)
  -  3:        Err(SerializationError)

## Gate

dim1-5: all closed (deep-recovery IDA decompile + rodata get_string).
dim6: empty (per task spec).
strictImplementationUse: true
readyToImplement: false
