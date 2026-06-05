# AI Handoff - remove_voice_template

Status: highest gate accepted by IDA absence substitute.

- Product/version/platform/module: aimami 1.0.9 macos voice
- Command: `remove_voice_template`
- IDA result: same-platform command string count = 0; backend owner/wrapper/callee leaf absent.
- Anchors: 0x100f3933a voice-workspace.json/voice-runtime.json path anchor, 0x100f35807 voice-overlay UI anchor, 0x100f38815 voice-search-overlay UI anchor, 0x100edde07 global-shortcut plugin constant.
- Gate: `readyToImplement=true`, `implementation_use=true`, `gate_accepted=true`, `full_leaf_100=true` via accepted substitute.
- Boundary: this is not upstream backend parity; it proves AiMaMi 1.0.9 has no backend command owner for this frontend voice wrapper.
