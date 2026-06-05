# Frontend Consumer Chain 109 - Custom Instructions (macos)

This file is the consumer handoff for frontend control-flow, UI state, TanStack Query wiring, and current source archive code connection to the reverse backend contract. It does not change backend IDA owner evidence or promote gates by itself.

Current status: Current source archive frontend chain is live, but AiMaMi 1.0.9 backend proof is an accepted same-platform IDA absence/orphan substitute. Consumers must treat behavior as source archive product/local implementation, not upstream backend owner parity.

## Command Chain

### `load_custom_instruction_state`
- UI trigger: Custom instructions page mount
- TanStack field/state: ["custom-instructions", "state"]
- API wrapper: `api.loadCustomInstructionState()`
- Terminal invoke/callback: `invoke("load_custom_instruction_state")`
- UI consumption: initializes draftContent from current.managedContent; loading/error/page state

### `preview_custom_instruction_apply`
- UI trigger: Preview/apply button or template preview
- TanStack field/state: mutation only
- API wrapper: `api.previewCustomInstructionApply(content)`
- Terminal invoke/callback: `invoke("preview_custom_instruction_apply", { content })`
- UI consumption: guard blocks protected state and busy duplicate; opens PreviewDialog on success; destructive toast on error

### `apply_custom_instruction`
- UI trigger: Preview dialog confirm/apply selected template
- TanStack field/state: mutation; success uses setQueryData on state field
- API wrapper: `api.applyCustomInstruction(params)`
- Terminal invoke/callback: `invoke("apply_custom_instruction", { content, templateCode?, templateTitle?, source })`
- UI consumption: syncAfterSuccess rewrites state envelope, draftContent, selectedTemplate; closes preview/pending; toast success/fail

### `clear_custom_instruction_block`
- UI trigger: Clear managed block button -> confirm
- TanStack field/state: mutation; success uses setQueryData on state field
- API wrapper: `api.clearCustomInstructionBlock()`
- Terminal invoke/callback: `invoke("clear_custom_instruction_block")`
- UI consumption: confirm dialog closes; draft/state refreshed through returned payload

### `rollback_custom_instruction`
- UI trigger: HistoryList rollback action
- TanStack field/state: mutation; success uses setQueryData on state field
- API wrapper: `api.rollbackCustomInstruction(historyId)`
- Terminal invoke/callback: `invoke("rollback_custom_instruction", { historyId })`
- UI consumption: history rollback toast; returned payload becomes current state

## TanStack / State Rules

Do not invalidate on successful apply/clear/rollback; current code uses returned CoreEnvelope payload and `queryClient.setQueryData(["custom-instructions","state"], envelope)` to preserve exact UI state. Templates are pure frontend via `mergeCustomInstructionTemplates([])` and have no IPC.

## Backend Contract Link

Raw leaves remain under `<source-location>/raw/aimami/1.0.9/macos/custom-instructions/<command>/`. Use those leaves for owner/threading/interface/error/side-effect facts; use this file for current source archive frontend consumer wiring.

## Acceptance Mapping

Mount page, preview from editor and template, apply, clear, rollback, protected-state guard, and verify state envelope replacement plus toasts/dialog closure.

## Product / Upstream Boundary

The current source archive implementation is live and consumable, but upstream 1.0.9 backend owner parity is absent by IDA proof. Consumers must label implementation as source archive product/local behavior, not upstream backend reconstruction.

## Validator Notes

- Initial load_custom_instruction_state failure lacks a dedicated visible error alert in the current page and can be perceived as a spinner/empty-current state.
- Successful apply/clear/rollback intentionally uses setQueryData with returned CoreEnvelope instead of invalidation; changing this can alter UI state timing.
- Current source archive implementation is product/local behavior; upstream 1.0.9 backend owner parity is absent substitute, not strict backend reconstruction.
