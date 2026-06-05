# IDA implementation candidate boundary: list_plugins

Source: IDA MCP `127.0.0.1:13337`  
Binary: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`  
SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`  
Size: `26821632`  
Candidate: `sub_140164BD0`  
Decision: `impl_leaf_accepted=false`

## Owner branch

The owner remains the large dispatcher `sub_1402663E0`. The bounded branch at `0x140267f30` binds command string `list_plugins`, scope string `registry`, and a context pointer before calling `sub_1400FA340`. If the resolver result tag is not `6`, the branch jumps to `loc_14026A930` and serializes an error with `sub_140062230`.

When the resolver result tag is `6`, the owner loads the resolver payload into `rdx` and calls `sub_140164BD0` at `0x140267fb4`. The candidate result is then checked for arithmetic/Result status and shaped through `sub_14029CBB0` or copied into the response envelope.

## Candidate pseudocode summary

`sub_140164BD0` is a 0x2b-byte wrapper:

```text
sub_140164BD0(out):
  local list_buffer[40]
  sub_1403EE7A0(list_buffer)
  sub_14043A010(out, list_buffer)
  return out
```

This is valid bounded pseudocode for the candidate body, but it is not an accepted implementation leaf by itself because it delegates both registry listing and response shaping to callees.

## Direct callee boundary

- `sub_1403EE7A0`: reads the plugin registry/list store under an interlocked lock. It references `plugin store poisoned` and `src\core\plugins\registry.rs`, copies entries from the store vector (`count * 152` bytes), and calls `sub_140095ED0`.
- `sub_140095ED0`: allocates an output vector and calls `sub_14038B200`.
- `sub_14038B200`: maps each plugin record into larger output records (`192` byte stride), copies nested string/config-like fields, and falls back to empty option-like records when keyed lookup misses.
- `sub_14043A010`: builds an OK response envelope, allocating strings that decode as `ok` and `Success`, embeds the list payload, and returns the response.

## Interface and side-effect hints

- Input: no command payload fields are consumed in the candidate body after the dispatcher has resolved `registry`.
- Output: success response envelope uses `ok` and `Success`; payload is the vector produced from registry entries.
- Error hints: `plugin store poisoned` is reachable in the list source callee. Allocation failures call `sub_14120829B`; formatting/panic paths use `sub_1412085B0`.
- Side effects: read/lock/wake behavior on the plugin store (`_InterlockedCompareExchange8`, `WakeByAddressSingle`); no write/persistence/fs leaf was observed in this bounded path.

## Non-acceptance reason

`sub_140164BD0` cannot be promoted to accepted implementation leaf in this pass. It is a wrapper around `sub_1403EE7A0` and `sub_14043A010`; field-level DTO mapping for the plugin record, builtin/default plugin parity, runtime IPC evidence, frontend UI/state evidence, and upstream acceptance mapping remain absent. The bounded IDA evidence improves backend candidate confidence only and does not close strict or full gate dimensions.
