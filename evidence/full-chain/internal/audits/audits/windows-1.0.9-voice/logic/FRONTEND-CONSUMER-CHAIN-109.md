# Frontend Consumer Chain 109 - Voice (windows)

This file is the consumer handoff for frontend control-flow, UI state, TanStack Query wiring, and current source archive code connection to the reverse backend contract. It does not change backend IDA owner evidence or promote gates by itself.

Current status: AiMaMi 1.0.9 voice commands are accepted same-platform IDA backend absence/orphan substitutes. Current source archive code has residual voice components but no live route/API/adapter chain: navigation tests exclude `voice`, `src/lib/api.ts` has no voice wrappers, and `src/lib/voice-adapter.ts` is absent.

## Command Chain

### `load_voice_workspace`
- UI trigger: Residual VoicePage query only; no live route
- TanStack field/state: ["voice","workspace"]
- API wrapper: `missing api.loadVoiceWorkspace`
- Terminal invoke/callback: `would need invoke("load_voice_workspace")`
- UI consumption: not live in current source archive; restore only by Product decision

### `load_voice_runtime_status`
- UI trigger: Residual VoicePage query only; no live route
- TanStack field/state: ["voice","runtime"]
- API wrapper: `missing api.loadVoiceRuntimeStatus`
- Terminal invoke/callback: `would need invoke("load_voice_runtime_status")`
- UI consumption: not live in current source archive; controls runtime cards/toggles if restored

### `load_voice_llm_config`
- UI trigger: Residual provider config query
- TanStack field/state: ["voice","llm-config","doubao"]
- API wrapper: `missing api.loadVoiceLlmConfig("doubao")`
- Terminal invoke/callback: `would need invoke("load_voice_llm_config", { provider })`
- UI consumption: not live

### `load_voice_asr_config`
- UI trigger: Residual provider config query
- TanStack field/state: ["voice","asr-config","appleSpeech"]
- API wrapper: `missing api.loadVoiceAsrConfig("appleSpeech")`
- Terminal invoke/callback: `would need invoke("load_voice_asr_config", { provider })`
- UI consumption: not live

### `save/test/update/capture/vocabulary/history/prompt/overlay/shortcut voice mutators`
- UI trigger: Residual VoicePage or overlay handlers only
- TanStack field/state: would invalidate/refetch voice runtime/workspace/provider keys if restored
- API wrapper: `missing api wrappers and voiceAdapter wrappers`
- Terminal invoke/callback: `would need corresponding invoke/native callback wrappers`
- UI consumption: not live; Product decision start only

## TanStack / State Rules

Current consumer action is to preserve removed/orphan status. If voice is restored, add api.ts wrappers, restore `src/lib/voice-adapter.ts`, route/nav entry, query invalidation for runtime/workspace/provider keys, and tests before claiming a live frontend chain.

## Backend Contract Link

Raw leaves remain under `<source-location>/raw/aimami/1.0.9/windows/voice/<command>/`. Use those leaves for owner/threading/interface/error/side-effect facts; use this file for current source archive frontend consumer wiring.

## Acceptance Mapping

For current source archive: verify voice route remains absent and no API wrapper exists. For Product decision restore: route mount, provider load/save/test, permissions, shortcut capture, start/stop capture, vocabulary/template/history, overlay ready/show/hide, and prompt generation must be tested.

## Product Decision Boundary

Voice is not a live current source archive frontend-backend chain. The accepted substitute closes upstream absence/orphan proof only. Restoring voice is a source archive Product decision and must create a new implementation task; do not treat residual components as current live parity.

## Validator Notes

- Current source archive voice is removed/orphan, not live: Route/ALL_APP_ROUTES exclude voice, sidebar has no voice nav item, and main-app has no VoicePage render case.
- src/lib/api.ts has no voice wrappers and src/lib/voice-adapter.ts is absent; residual voice components import/call missing wrappers.
- Accepted substitute closes AiMaMi 1.0.9 backend command absence/orphan proof only. Restoring voice requires Product decision plus route/api/adapter/DTO/mock/test work.
