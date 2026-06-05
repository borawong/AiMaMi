# toggle_plugin interface/error/side-effect boundary

Scope: AiMaMi 1.0.9 Windows x64, leaf `toggle_plugin` only. Source: IDA static assist on binary SHA `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`. This evidence strengthens interface/error/side-effect boundary notes but does not promote any consumer gate.

## IDA anchors
- Owner: `sub_140282B70` at `0x140282b70`.
- Implementation candidate: `sub_140164C00` at `0x140164c00`.
- Candidate prototype: `__int64 __fastcall(__int64 out, __int64 registry, __int64 registry_context, __int64 id_slice, unsigned __int8 enabled)`.
- IDA session: 127.0.0.1:13337, Hex-Rays ready, auto-analysis ready.

## DTO boundary
- Static IDA owner sub_140282B70 references the toggle_plugin command string and decodes command payload fields including id and enabled before calling sub_140164C00.
- Implementation candidate inputs are registry pointer, registry context, id string slice, and enabled byte; registry/context are app-state inputs rather than frontend DTO fields.
- The frontend-facing DTO boundary is accepted only at static level as required id:string plus enabled:boolean; omitted/null/default behavior is not runtime-accepted.
- Static response shaping reaches ok/Success builder sub_1404391D0 and propagates candidate errors through owner serializer sub_140062230; exact JS-visible envelope text remains runtime unknown.

## Error boundary
- Store lock poison path is evidenced by string plugin store poisoned and src<network-location> in sub_1403ED760.
- Persistence failure tags are evidenced through save_store helper sub_1403EDEC0, serializer sub_140573E60, write helper sub_14104E390, and strings serialize plugins.json / write plugins.json.
- Display formatting failure is evidenced by the alloc string Display implementation returned an error unexpectedly referenced by sub_140164C00.
- Allocation/panic helper branches are present at sub_14120829B/sub_1412085B0; exact user-visible mapping is not accepted without runtime IPC trace.
- Owner decode failures for registry/id/enabled remain bounded to sub_140062230 error serialization and are not proven as exact frontend error copies.

## Side-effect boundary
- Accepted static fact: sub_1403ED760 mutates the registry map entry selected by id and writes the enabled byte into the entry payload.
- Accepted static fact: candidate special-cases web-tools and writes a builtin plugin enabled byte at the registry context-derived location.
- Accepted static fact: save_store path serializes PluginStoreSchema/plugins via sub_140573E60 and attempts a file write through sub_14104E390.
- No HTTP/process/sidecar dispatch was observed in the bounded candidate/callee set.
- Rollback/atomicity and exact filesystem base path/permission behavior are runtime unknown.

## Accepted static facts
- same-platform Windows 1.0.9 binary SHA verified in IDA session
- owner sub_140282B70 calls candidate sub_140164C00
- candidate decompiles successfully and reaches registry mutation plus save-store helper chain
- callee chain includes sub_1403ED760, sub_1403EDEC0, sub_140573E60, sub_14104E390, sub_1404391D0, sub_140464400, and cleanup helper sub_14017DEC0
- static boundary evidence is accepted as implementation-leaf evidence only, not consumer gate proof

## Runtime / acceptance unknowns
- Windows runtime IPC execution trace is absent
- frontend control-flow/UI state was not revalidated in this leaf-local pass
- upstream acceptance tests were drafted but not executed
- exact user-visible error text and envelope copies remain unaccepted runtime unknowns
- plugins.json write atomicity/rollback behavior remains unaccepted runtime unknown

## Acceptance-map draft
- Seed a Windows test registry with a disabled non-builtin plugin, invoke toggle_plugin with id and enabled=true, then verify registry/list output reflects enabled=true.
- Invoke toggle_plugin with enabled=false and verify the same plugin becomes disabled without changing unrelated plugin records.
- Use web-tools as the id and verify the builtin enabled byte and registry record stay consistent after the call.
- After a successful toggle, verify plugins.json is serialized with PluginStoreSchema/plugins and the state survives process restart.
- Force poisoned-store, serialization, and write-failure conditions and verify a user-visible error is returned without claiming rollback behavior beyond evidence.

## Gate posture
- consumerStartReady: false
- strictImplementationUse: false
- readyToImplement: false
- implementation_use: false
- gate_accepted: false
- full_leaf_100: false
- no_promotion: true

Reason: false: static boundary is stronger, but frontend UI/control-flow, runtime IPC trace, same-platform gate execution, and executed acceptance mapping remain missing.
