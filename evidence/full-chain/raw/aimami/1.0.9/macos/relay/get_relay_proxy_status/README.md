# get_relay_proxy_status — AiMaMi 1.0.9 macOS Raw Leaf

**Produced**: 2026-06-02 | **Session**: relay-A-state-crud-20260602
**Gate**: `strictImplementationUse` (macOS confirmed; Windows Unknown)

## Final Conclusion

Pure read: composes ProxyStatus from in-memory RelayManager state under Mutex. Formats host/port strings via format_inner. No side effects.

## Response Structure

`ProxyStatus` (80 bytes, 5 owords):
| Field | Offset | Type | Active=true | Active=false |
|-------|--------|------|-------------|--------------|
| `active` | +74 | bool | 1 | 0 |
| `port` | +72 | u16 | raw port | 0 |
| `hostStr` | +0..+16 | String | "127.0.0.1:{port}" | "" |
| `portStr` | +24..+40 | String | "{port}" | "" |
| `proxyAddr` | +48 | Option<String> | Some("...") | None (xmmword_100EDC0E0) |

## Errors

- Mutex poisoned: all fields zero, active=false

## Gate: strictImplementationUse=true | readyToImplement=false
