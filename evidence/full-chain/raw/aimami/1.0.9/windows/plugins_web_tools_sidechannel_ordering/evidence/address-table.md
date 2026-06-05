# Address Table

| Role | Address | Evidence |
|---|---:|---|
| `web-tools` string | `0x14120C7E8` | Unique direct string xref to startup at `0x140004C79`. |
| startup owner | `0x140004B30` | Constructs runtime state; calls store init and seeds side-channel. |
| startup store init call | `0x140004C65` | `call sub_1403EE200` before side-channel lookup. |
| startup `web-tools` lookup | `0x140004C8D` | `call sub_1403ED4D0` with `rdx = "web-tools"`, `r8d = 9`. |
| startup side-channel write | `0x140004C9A` | `mov [rcx+10h], al`. |
| enabled lookup helper | `0x1403ED4D0` | Mutex-protected plugin enabled lookup by id bytes. |
| load/merge/save helper | `0x1403EE200` | Reads `plugins.json`, merges defaults, saves at `0x1403EE512`. |
| save helper | `0x1403EDEC0` | Serializes store then calls write helper at `0x1403EE048`. |
| file write helper | `0x14104E390` | File write loop used by `sub_1403EDEC0`. |
| get-enabled wrapper | `0x140285050` | Command string `get_hotspot_enabled`, locks runtime state and calls reader. |
| get-enabled reader helper | `0x1401631A0` | Runtime mutex/reader helper; returns bool-like result. |
| toggle command owner | `0x140282B70` | Command wrapper. |
| toggle impl | `0x140164C00` | Calls store mutator, checks success, conditionally refreshes side-channel. |
| toggle store mutator | `0x1403ED760` | Mutates enabled byte and persists store. |
| toggle store enabled mutation | `0x1403ED90C` | `mov [rdx-8], al`. |
| toggle save call | `0x1403ED91D` | `call sub_1403EDEC0`. |
| toggle `web-tools` compare | `0x140164D30..0x140164D4E` | Literal byte compare for `web-tools`. |
| toggle side-channel write | `0x140164D5B` | `mov [rax+10h], bl`. |
| update command owner | `0x1402663E0` | Dispatcher/wrapper containing `update_plugin_config`. |
| update impl | `0x140165130` | Calls settings mutator and returns ok-bool on success. |
| update settings mutator | `0x1403EDAA0` | Replaces settings bytes and persists store. |
| update settings replacement | `0x1403EDC62..0x1403EDC7B` | Clears old settings and copies new settings struct. |
| update save call | `0x1403EDC90` | `call sub_1403EDEC0`. |
