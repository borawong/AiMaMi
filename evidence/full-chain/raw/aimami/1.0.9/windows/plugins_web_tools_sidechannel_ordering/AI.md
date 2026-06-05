# AI Handoff

status: static_ida_assist_no_gate_promotion

evidence_root: `<source-location>/raw/aimami/1.0.9/windows/plugins_web_tools_sidechannel_ordering`

intermediate_root: `<source-location>/intermediate/aimami/1.0.9/windows/plugins_web_tools_sidechannel_ordering`

handoff_root: `<source-location>/aimami/1.0.9/windows-x64/plugins_web_tools_sidechannel_ordering`

binary:
- path: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`
- sha256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
- size: `26821632`

target_universe:
- startup: `sub_140004B30`
- enabled lookup helper: `sub_1403ED4D0`
- get-enabled wrapper/helper: `sub_140285050 -> sub_1401631A0`
- toggle chain: `sub_140282B70 -> sub_140164C00 -> sub_1403ED760 -> sub_1403EDEC0 -> sub_14104E390`
- update chain: `sub_1402663E0 -> sub_140165130 -> sub_1403EDAA0 -> sub_1403EDEC0`

coverage:
- backend owner/pseudocode: partial static IDA coverage for this leaf only.
- call-tree: bounded static chain rows, not a full gate call-tree artifact.
- interface/dto: out of scope; covered by sibling plugins bundles.
- side-effect boundary: side-channel write/read ordering summarized.
- runtime: not executed.

key_findings:
- startup seeds side-channel from plugin store after `sub_1403EE200` load/merge/save.
- `get_hotspot_enabled` reads runtime side-channel through lock/reader helper, not direct plugin-store lookup.
- `toggle_plugin` updates persisted store before writing runtime side-channel for `web-tools`.
- `update_plugin_config` persists settings and does not refresh side-channel in observed static path.

unknowns:
- runtime ordering not proven statically beyond path-local call/instruction order.
- exact high-level Rust type names for side-channel owner/field remain candidate-only.
- frontend consumption and acceptance mapping are absent.

gate:
- consumerStartReady: false
- strictImplementationUse: false
- readyToImplement: false
- implementation_use: false
- gate_accepted: false
- full_leaf_100: false

do_not_infer:
- Do not infer Windows behavior from macOS.
- Do not treat this leaf as proof for DTO, settings decode, or persistence error handling.
- Do not append global `INDEX.jsonl` from this producer output.
