# Frontend Full Chain - AiMaMi 1.0.9 macOS custom-instructions

Scope: additive frontend/current-source archive consumer chain for the accepted macOS custom-instructions absence-substitute package. This file does not change gate state.

## Shell route and preload

- `src/main-app.tsx` lazy-loads the Custom Instructions route through `renderPage(route)`.
- Sidebar navigation calls 
avigateToRoute("customInstructions")`, starts route feedback, then commits the route after two animation frames through `startTransition`.
- `useMountedRoutes` keeps exiting routes mounted for the exit window before unmount.
- Route preloading runs after startup idle delay and on sidebar hover via `scheduleRoutePreload`.
- `RouteFeedbackGate` controls when the page subtree renders; Custom Instructions is not a HIGH_IO delayed route.

## UI entry

- Route/page: `src/components/custom-instructions/custom-instructions-page.tsx`.

## Default load chain

```text
CustomInstructionsPage mount, default tab="configure"
  -> useQuery({ queryKey: ["custom-instructions", "state"] })
     -> api.loadCustomInstructionState()
     -> invoke("load_custom_instruction_state", {})
     -> CoreEnvelope<CustomInstructionStatePayload>

  -> useQuery({ queryKey: ["custom-instructions", "templates"] })
     -> mergeCustomInstructionTemplates([])
     -> frontend-only, no invoke
```

There is no bootstrap seed for this page, so state load is a cold route load.

`CustomInstructionStatePayload`:

```ts
{
  current: {
    globalPath: string;
    fileExists: boolean;
    managedBlockPresent: boolean;
    protectionState: "ready" | "unmanaged" | "protected";
    issueMessage: string | null;
    managedContent: string;
    lastAppliedAt: number | null;
    lastTemplateCode: string | null;
    lastTemplateTitle: string | null;
  };
  history: CustomInstructionHistoryEntry[];
}
```

After successful state load, an effect initializes `draftContent` from `state.current.managedContent` once while `draftInitialized` is false.

## API and invoke chain

- `api.loadCustomInstructionState()` -> `invoke("load_custom_instruction_state")`.
- `api.previewCustomInstructionApply(...)` -> `invoke("preview_custom_instruction_apply")`.
- `api.applyCustomInstruction(...)` -> `invoke("apply_custom_instruction")`.
- `api.clearCustomInstructionBlock(...)` -> `invoke("clear_custom_instruction_block")`.
- `api.rollbackCustomInstruction(...)` -> `invoke("rollback_custom_instruction")`.

Backend binding is `src-tauri/src/commands/custom_instructions.rs` into `src-tauri/src/core/custom_instructions.rs`.

## Interaction chain

| Interaction | Invoke | Params | Success effect |
|---|---|---|---|
| Load state | `load_custom_instruction_state` | `{}` | Populate current/history state |
| Preview apply | `preview_custom_instruction_apply` | template/content input | Show preview/diff path before applying |
| Apply block | `apply_custom_instruction` | managed content/template input | `setQueryData(["custom-instructions","state"], response)` |
| Clear block | `clear_custom_instruction_block` | clear input | `setQueryData(["custom-instructions","state"], response)` |
| Rollback | `rollback_custom_instruction` | history entry input | `setQueryData(["custom-instructions","state"], response)` |

Successful apply/clear/rollback uses returned `CoreEnvelope` data to update `["custom-instructions", "state"]` directly instead of invalidating and refetching. Changing this can alter UI state timing.

## Guards and errors

- Initial `load_custom_instruction_state` failure does not have a dedicated visible error alert in the current page and can appear as a spinner or empty-current state.
- Mutation failures surface in the page action/error areas through the current component state.
- The templates query is frontend-only and does not exercise any backend owner.
- No bootstrap/default shell preload slice exists for this page.

## Shell load and state effects

- Custom instructions is lazy route only in current source archive source.
- No bootstrap/default shell preload slice was found.
- Successful apply/clear/rollback updates `["custom-instructions","state"]` directly.

## Upstream boundary

This package is an accepted IDA absence-substitute/orphan surface, not backend owner parity for an upstream AiMaMi backend command implementation.
