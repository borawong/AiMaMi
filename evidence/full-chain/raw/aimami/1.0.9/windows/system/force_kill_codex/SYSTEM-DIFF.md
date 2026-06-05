# System Diff — force_kill_codex (windows-x64, 1.0.9)

## Platform Artifacts

- Platform: windows-x64
- Binary: AiMaM 1.0.9 win64.exe (PE, symbols stripped)
- SHA-256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

## Frontend IPC / Control-flow

NOT PRESENT in this binary.
- "force_kill_codex" string: ABSENT from PE string table
- No Tauri invoke_handler registration for this command name
- No frontend IPC entry point found
- Behavior triggered internally from Rust orchestration code only

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

NOT a Tauri command. Internal Rust helpers only.

Owner: force_kill_codex_by_imagename (VA 0x1402507B0)
  - Mechanism: `taskkill /F /IM Codex.exe` via std::process::Command
  - Flag: CREATE_NO_WINDOW (0x8000000)
  - Error string: "taskkill Codex failed: <ExitStatus>" at VA 0x141265F82

Caller variants:
  1. quit_codex_wait_fallback_kill (0x140254140)
     - No pre-signal; direct kill + poll loop
     - Callers: sub_1400A2DE0, sub_1400AD310, sub_1400B5320, sub_1403CDA60, sub_14043E710

  2. notify_quit_codex_wait_fallback_kill (0x140254320)
     - Pre-signal via signal_codex_quit_wake (0x140254510):
       _InterlockedCompareExchange8 + WakeByAddressSingle
     - Then kill + poll loop
     - Caller: switch_account_stop_codex_restart (0x14014A0)

Companion: scan_codex_process_list (0x140254CE0)
  - Win32: CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS) + Process32FirstW/NextW
  - Lowercase exe name via SSE2 ASCII conversion
  - Matches: "codex.exe" (9 chars) or "code x" prefix (>= 6 chars)
  - Retries up to 3x with 500ms sleep
  - Returns: Vec<{pid: u32, name: String}>

Response serializer: serialize_force_kill_response (0x14044EE30)
  - Fields: {success, code, message, data: {killedCount, processes}}
  - killedCount string at VA 0x14127C97E

## Interface / Error / Boundary

Input: none (internal call)
Output: {success: bool, code: i64, message: String, data: {killedCount: u32, processes: [{pid: u32, name: String}]}}
Errors:
  - CODEX_APP_QUIT_TIMEOUT string
  - "taskkill Codex failed: <ExitStatus>"
Side effects: kills Codex.exe, scans process table
Boundary: Windows-only mechanism (taskkill, CreateToolhelp32Snapshot, WakeByAddressSingle)

## Gate Leaf

strictImplementationUse: true
readyToImplement: false (missing frontend CCF + acceptance mapping)

## Plugin / Capability

N/A for this leaf.

## OTA / Package

N/A for this leaf.

## Resource / Binary Surface

Strings used:
  - "taskkill" at 0x141265F43
  - "/F" at 0x141265F52
  - "/IM" at 0x141265F54
  - "/PID" at 0x141265F6B
  - "Codex.exe" at 0x141265F79
  - "taskkill failed: " at 0x141265F58
  - "taskkill Codex failed: " at 0x141265F83
  - "CODEX_APP_QUIT_TIMEOUT: ..." (literal in .text)
  - "killedCount" at 0x14127C97E
  - "processes" at 0x14127C989
  - src\core\skills.rs referenced in same string region

Win32 imports:
  - CreateToolhelp32Snapshot
  - Process32FirstW / Process32NextW
  - GetCurrentProcessId
  - CloseHandle
  - _InterlockedCompareExchange8 (intrinsic)
  - WakeByAddressSingle

## Unknown

- macOS behavioral equivalent: UNKNOWN — separate macOS binary evidence required
- frontend trigger path: absent / product_decision
- test/acceptance mapping: not done
