# Frontend Full Chain - AiMaMi 1.0.9 macOS voice

Scope: additive frontend/current-source archive consumer chain for the accepted macOS voice absence-substitute package. This file does not change gate state.

## Current source archive frontend surface

- Page component: `src/components/voice/voice-page.tsx`.
- Overlay component: `src/components/voice/voice-overlay-root.tsx`.
- Tests reference `loadVoiceRuntimeStatus`, `loadVoiceWorkspace`, `loadVoiceLlmConfig`, `loadVoiceAsrConfig`, runtime updates, capture controls, and overlay adapter behavior.

## Broken current chain

- `src/lib/api.ts` does not define the `loadVoice*`, `saveVoice*`, `startVoiceCapture`, `stopVoiceCapture`, or overlay voice wrappers used by the voice components.
- `src/lib/voice-adapter.ts` is absent in current source.
- No matching command registrations were found in `src-tauri/src/lib.rs`.
- No matching `src-tauri/src/commands` or `src-tauri/src/core` voice implementation exists.
- No sidebar route or shell preload/render path for `voice` was found.

## Upstream boundary

The reverse package is accepted by `ida_backend_command_absence`. It proves AiMaMi 1.0.9 backend command absence for the voice rows, not a working source archive frontend/backend implementation.

## Consumer action

Treat voice as <source-location>/product-added or orphan frontend work. A consumer must create or remove the broken frontend/API/adapter/backend chain before implementation can be called closed in current source archive.

