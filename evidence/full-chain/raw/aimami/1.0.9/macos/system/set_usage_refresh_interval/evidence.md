# set_usage_refresh_interval — raw evidence (macOS 1.0.9)

**owner_va**: 0x100260e24  
**symbol**: `codexmate_lib::commands::system::set_usage_refresh_interval::h9f19651bf53cef45`  
**binary_sha12**: 1db044e8efab  
**session**: wf-aimami109-dualcomplete  
**machine**: <workstation>  
**produced_at**: 2026-06-03  
**is_upstream**: true  
**gate_tier**: strictImplementationUse (dim1-5 closed; dim6 not assessed = ceiling)

## dim1 — Frontend CCF

Command string confirmed in IPC command table at 0x100f2ebf2:
`detect_api_proxy_configget_usage_refresh_intervalset_usage_refresh_interval...`

xrefs to 0x100260e24: called from `codexmate_lib::run::{{closure}}::{{closure}}@0x10031f9fc` — Tauri `invoke_handler` registration closure.

Frontend CCF: `invoke('set_usage_refresh_interval', { interval: String })` — params `a2`=ptr to `Repository` Mutex, `a3`=ptr to `[ptr_to_str, len, cap]` for the interval string.

## dim2 — Owner decompile

`codexmate_lib::commands::system::set_usage_refresh_interval` at 0x100260e24:

1. Lock Repository Mutex (via `a2`, initialized lazily with `OnceBox::initialize`)
2. Panic guard (poisoned lock check)
3. `Repository::set_usage_refresh_interval(&v34, repo+16, a3[1]=ptr, a3[2]=len)` → validate + write interval to settings
4. If result tag ≠ 10 (Err): format error, return Err envelope. `Mutex::unlock`. Drop AppHandle.
5. If result tag == 10 (Ok, returns new interval string ptr+len):
   - `Mutex::unlock` (repo mutex)
   - `StateManager::try_get` → get shared Repository from app state (offset +136+4872+16) 
   - Lock that second Mutex
   - `Repository::get_usage_refresh_interval(&v40, repo2+16)` → read back the saved interval
   - `usage_refresh_interval_seconds(interval_ptr, interval_len)` → convert to seconds (u64)
   - `Mutex::unlock` (second)
   - Free old interval string if present
   - `update_usage_refresh_schedule(seconds)` → condvar notify_all to wake watcher thread
   - Write Ok envelope into `a4` out-param: `*a4=0`, `*(a4+8..24)` = saved interval string
6. Drop `AppHandle` (`a1`)

## dim3 — Call-tree to leaves

```
set_usage_refresh_interval@0x100260e24
├── Repository::set_usage_refresh_interval@0x1005ee944
│   ├── validate input string: "1m"|"3m"|"5m"|"30s" only; else Err(InvalidInterval)
│   ├── Repository::load_settings@0x1005e2f68              [fs read: config.toml]
│   ├── update usageRefreshInterval field in CodexMateSettings
│   └── Repository::save_settings@0x1005e3328              [fs write: config.toml]
├── Repository::get_usage_refresh_interval@0x1005ee5dc     [read back saved value]
│   └── Repository::load_settings@0x1005e2f68
├── usage_refresh_interval_seconds@0x1005f4b34             [str→u64 seconds]
└── update_usage_refresh_schedule@0x100262c90
    ├── OnceLock::initialize (lazy STATE init)
    ├── Mutex::lock on usage_refresh_watcher_state::STATE
    ├── qword_101390368 = seconds                          [write interval to shared state]
    └── Condvar::notify_all(&unk_101390378)                [wake watcher thread]
```

Call-tree depth: 4. Terminated at: fs write (save_settings → config.toml), condvar notify_all (watcher thread signal).

## dim4 — Interface / DTO / error / side-effect

**Params (IPC)**:
- `interval: String` — must be one of: `"1m"` | `"3m"` | `"5m"` | `"30s"`

**Returns**: `Result<String, CoreError>` via `CoreEnvelope`
- Ok: the saved interval string (same value passed in, confirmed by read-back)
- Err: `"Invalid interval value: ..."` if string doesn't match known enum
- Err: poisoned Mutex error if lock poisoned

**Validation**: `Repository::set_usage_refresh_interval` checks input string against enum set:
- `"1m"` (len=2, tag=0x6D31) → OK
- `"3m"` (len=2, tag=0x6D33) → OK
- `"5m"` (len=2, bswap check 0x356D) → OK
- `"30s"` (len=3, tag=0x73303330) → OK
- anything else → Err with formatted error message

**Interval seconds mapping** (from `usage_refresh_interval_seconds`):
- `"1m"` → 60
- `"3m"` → 180
- `"5m"` → 300
- `"30s"` → 30

**Side effects**:
1. Writes `usageRefreshInterval` field in `config.toml` via `save_settings`
2. Updates global watcher state `qword_101390368` with new seconds value
3. Wakes the usage refresh watcher thread via `Condvar::notify_all(&unk_101390378)`
   - Watcher shared state: `usage_refresh_watcher_state::STATE@0x101390358`
   - Interval slot: `qword_101390368@0x101390368`
   - Condvar: `unk_101390378@0x101390378`

**Error path**:
- Invalid interval string → `CoreError` with formatted message (error tag=8)
- Mutex poisoned → panic path returns Err
- `save_settings` fs error → returns Err

## dim5 — Same-platform gate

Platform: macOS arm64 (AiMaMi.i64, sha12=1db044e8efab). IDA decompile confirmed same-platform.

**gate**: pass (strictImplementationUse)  
**ceiling**: strictImplementationUse (dim6 not assessed)

## Watcher State Layout (from update_usage_refresh_schedule)

```
usage_refresh_watcher_state::STATE@0x101390358  (OnceLock<Mutex<WatcherState>>)
  +0x00: atomic ptr (Mutex box)
  +0x08: poisoned flag
qword_101390388@0x101390388                      (OnceLock initialized flag)
byte_101390360@0x101390360                       (Mutex poisoned byte)
qword_101390368@0x101390368                      (interval_seconds: u64)
unk_101390378@0x101390378                        (Condvar — same as note_usage_refresh_activity)
```
