# Frontend Full Chain - AiMaMi 1.0.9 Windows custom-instructions

Scope: additive frontend/current-source archive consumer chain for the accepted Windows custom-instructions absence-substitute package. This file does not change gate state.

## UI entry

- Route/page: `src/components/custom-instructions/custom-instructions-page.tsx`.

## API and invoke chain

- `api.loadCustomInstructionState()` -> `invoke("load_custom_instruction_state")`.
- `api.previewCustomInstructionApply(...)` -> `invoke("preview_custom_instruction_apply")`.
- `api.applyCustomInstruction(...)` -> `invoke("apply_custom_instruction")`.
- `api.clearCustomInstructionBlock(...)` -> `invoke("clear_custom_instruction_block")`.
- `api.rollbackCustomInstruction(...)` -> `invoke("rollback_custom_instruction")`.

Backend binding is `src-tauri/src/commands/custom_instructions.rs` into `src-tauri/src/core/custom_instructions.rs`.

## Shell load and state effects

- Custom instructions is lazy route only in current source archive source.
- No bootstrap/default shell preload slice was found.
- Successful apply/clear/rollback updates `["custom-instructions","state"]` directly.

## Upstream boundary

This package is an accepted IDA absence-substitute/orphan surface, not backend owner parity for an upstream AiMaMi backend command implementation.

