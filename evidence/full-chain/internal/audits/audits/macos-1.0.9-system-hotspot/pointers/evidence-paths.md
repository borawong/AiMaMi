# Evidence Paths — macos-1.0.9-system-hotspot

All paths relative to `<source-location>`.

## Binary SOT

```
raw/binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi
  (fat binary, sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482)
raw/binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi
  (thin arm64, sha256: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706)
raw/binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
  (IDA Pro database, saved 2026-06-03)
```

## get_hotspot_enabled

```
raw/aimami/1.0.9/macos-arm64/system/get_hotspot_enabled/evidence.md
  IDA owner: 0x10032eac0 (codexmate_lib::commands::hotspot::get_hotspot_enabled)
  Frontend CCF: raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl
```

## set_hotspot_enabled

```
raw/aimami/1.0.9/macos-arm64/system/set_hotspot_enabled/evidence.md
  IDA owner: 0x10032ecbc (codexmate_lib::commands::hotspot::set_hotspot_enabled)
  create_hotspot_window: 0x10032f24c
  apply_native_hotspot_properties: 0x10032fedc
  set_window_alpha: 0x10032e740
```

## hotspot_ready

```
raw/aimami/1.0.9/macos-arm64/system/hotspot_ready/evidence.md
  IDA owner: 0x10032e664 (codexmate_lib::commands::hotspot::hotspot_ready)
  Frontend CCF: assets/index-CL22l5v8.js:86:31559 + :86:36157
```

## Cross-reference: Windows counterpart

```
<source-location>/audits/windows-1.0.9-system-hotspot/AI.md
raw/aimami/1.0.9/windows-x64/system/get_hotspot_enabled/evidence.md  (Win owner: 0x140285050)
raw/aimami/1.0.9/windows-x64/system/set_hotspot_enabled/evidence.md  (Win owner: 0x14027C6D0)
raw/aimami/1.0.9/windows-x64/system/hotspot_ready/evidence.md        (Win owner: 0x14026DEF0)
```
