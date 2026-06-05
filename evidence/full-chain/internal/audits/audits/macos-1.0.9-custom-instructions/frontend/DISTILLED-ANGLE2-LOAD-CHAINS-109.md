# DISTILLED Angle-2+4 Frontend Load Chains — AiMaMi 1.0.9 Custom Instructions Page

produced_at: 2026-06-03
session: <audit-session>
machine: <workstation>
authoritative: false  <!-- additive read layer; canonical gate in manifest.json + gate-report.json; no gate promotion -->
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
upstream_note: Accepted IDA absence-substitute/orphan surface — source archive product/local behavior, not upstream AiMaMi 1.0.9 backend owner parity
evidence_basis: frontend source read (custom-instructions-page.tsx + api.ts + types/index.ts + CLAUDE.md) cross-verified against existing FRONTEND-CONSUMER-CHAIN-109.md

---

## Page Entry

- Component: `CustomInstructionsPage` — `src/components/custom-instructions/custom-instructions-page.tsx`
- Route mount: lazy-loaded via `src/main-app.tsx` (dynamic import); prefetch fires on hover
- Bootstrap pre-seeding: NONE — custom-instructions has no bootstrap slice. Query fires on route mount.

---

## Default Mount Load Chain (tab = "configure", on first render)

```
CustomInstructionsPage mounts
  ├─ useQuery(["custom-instructions", "state"])
  │     queryFn: api.loadCustomInstructionState()
  │     invoke("load_custom_instruction_state")   ← backend: commands/custom_instructions.rs → core/custom_instructions.rs
  │     response: CoreEnvelope<CustomInstructionStatePayload>
  │       .data.current: CustomInstructionCurrentState
  │         { globalPath, fileExists, managedBlockPresent, protectionState,
  │           issueMessage, managedContent, lastAppliedAt, lastTemplateCode, lastTemplateTitle }
  │       .data.history: CustomInstructionHistoryEntry[]
  │         [{ id, createdAt, action, source, templateCode, templateTitle }]
  │     UI: loading → Spinner in center | error → silent (no dedicated error alert; appears as empty/spinner state)
  │           NOTE: load failure lacks visible error alert — perceived as spinner/empty current state
  │     useEffect: on first state load, sets draftContent = state.current.managedContent
  │
  └─ useQuery(["custom-instructions", "templates"])
        queryFn: mergeCustomInstructionTemplates([])   ← PURE FRONTEND, no IPC
        response: CustomInstructionTemplate[]
        This query never fires an invoke; it merges builtin templates with no remote source
```

---

## User-Triggered Chains (tab = "configure")

### preview_custom_instruction_apply
```
User edits draftContent in Textarea → clicks "预览并应用" (or TemplateCard "Apply" button)
  Guard: if current.protectionState === "protected" → return early (no IPC)
  Guard: if previewBusy || previewingTemplateCode !== null → return early
  → setPendingApply({ content, templateCode?, templateTitle?, source })
  → previewMutation.mutateAsync(content)
       invoke("preview_custom_instruction_apply", { content })
       response: CoreEnvelope<CustomInstructionPreviewPayload>
         .data.globalPath: string
         .data.protectionState: CustomInstructionProtectionState
         .data.issueMessage: string | null
         .data.currentManagedContent: string
         .data.nextManagedContent: string
         .data.resultingContent: string
  → onSuccess: setPreview(response.data); setPreviewOpen(true)
  → onError: toast(destructive) with error.message
  → onSettled: setPreviewingTemplateCode(null)
  UI: previewBusy state on button; setPreviewingTemplateCode for per-template spinner
```

### apply_custom_instruction (requires preview step first)
```
PreviewDialog open → user clicks confirm/apply
  → applyMutation.mutateAsync(pendingApply)
       invoke("apply_custom_instruction", { content, templateCode?, templateTitle?, source })
       response: CoreEnvelope<CustomInstructionStatePayload>   ← same shape as load_custom_instruction_state
  → onSuccess:
       syncAfterSuccess(response.data):
         queryClient.setQueryData(["custom-instructions","state"], { schemaVersion:1, success:true, code:"ok", message:"", warnings:[], data: payload })
         setDraftContent(payload.current.managedContent)
         setSelectedTemplate(template matching lastTemplateCode, or null)
       setPreviewOpen(false); setPreview(null); setPendingApply(null)
       toast(success): "customInstructions.applySuccess"
  → onError: setPreviewOpen(false); toast(destructive)
  NOTE: uses setQueryData NOT invalidateQueries — intentional to preserve exact UI state timing
```

### clear_custom_instruction_block
```
User clicks "清除受控区块" → clearOpen=true
AlertDialog → confirms → handleClearManagedBlock()
  Guard: protectionState === "protected" → button disabled, no IPC
  Guard: !managedBlockPresent → button disabled
  → clearMutation.mutateAsync()
       invoke("clear_custom_instruction_block")    ← no params
       response: CoreEnvelope<CustomInstructionStatePayload>
  → onSuccess: syncAfterSuccess(response.data); setClearOpen(false); toast(success)
  → onError: toast(destructive)
  NOTE: uses setQueryData NOT invalidateQueries
```

### rollback_custom_instruction
```
User clicks rollback in HistoryList → handleRollback(historyId)
  Guard: rollbackBusy || rollbackingId !== null → return early
  → rollbackMutation.mutateAsync(historyId)
       invoke("rollback_custom_instruction", { historyId })
       response: CoreEnvelope<CustomInstructionStatePayload>
  → onSuccess: syncAfterSuccess(response.data); toast(success)
  → onError: toast(destructive)
  NOTE: uses setQueryData NOT invalidateQueries
```

### openPath (not an invoke with CoreEnvelope)
```
User clicks "打开全局文件"
  Guard: !current.fileExists → button disabled
  → api.openPath(current.globalPath)
       (uses @tauri-apps/plugin-opener openPath — not a Tauri IPC invoke command)
  → error: toast(destructive) with formatInvokeError
```

---

## Tab "templates" — No additional IPC

```
User switches to "模板中心" tab
  → templatesQuery data (already loaded, pure frontend)
  → TemplateCard list renders
  → TemplateCard "Apply" → calls beginPreview with source="one_click"
       (same preview → apply chain as configure tab)
```

---

## TanStack Query Cache Rules

| field | staleTime | enabled | updated by |
|---|---|---|---|
| `["custom-instructions", "state"]` | default | always | NEVER invalidated — only setQueryData on apply/clear/rollback success |
| `["custom-instructions", "templates"]` | default | always | pure frontend merge; no IPC |

**Critical rule**: apply/clear/rollback use `queryClient.setQueryData` with the returned `CoreEnvelope<CustomInstructionStatePayload>`, NOT `invalidateQueries`. This preserves exact UI state. Do not change to invalidation without understanding the timing impact.

---

## Protection State Gate

`current.protectionState === "protected"` disables:
- Editor Textarea (readOnly via disabled)
- "预览并应用" button
- "清除受控区块" button
- `beginPreview()` early return
- TemplateCard apply buttons (via previewDisabled)

No IPC fires when protected. The guard is frontend-only.

---

## DTO Shapes (from src/types/index.ts)

```typescript
// CustomInstructionProtectionState
type = "ready" | "unmanaged" | "protected"

// CustomInstructionHistoryAction
type = "apply" | "clear" | "rollback"

// CustomInstructionCurrentState
{ globalPath: string; fileExists: boolean; managedBlockPresent: boolean;
  protectionState: CustomInstructionProtectionState; issueMessage: string | null;
  managedContent: string; lastAppliedAt: number | null;
  lastTemplateCode: string | null; lastTemplateTitle: string | null }

// CustomInstructionHistoryEntry
{ id: string; createdAt: number; action: CustomInstructionHistoryAction;
  source: string; templateCode: string | null; templateTitle: string | null }

// CustomInstructionStatePayload
{ current: CustomInstructionCurrentState; history: CustomInstructionHistoryEntry[] }

// CustomInstructionPreviewPayload
{ globalPath: string; protectionState: CustomInstructionProtectionState;
  issueMessage: string | null; currentManagedContent: string;
  nextManagedContent: string; resultingContent: string }

// apply_custom_instruction invoke args
{ content: string; templateCode?: string; templateTitle?: string; source: string }
// source values seen: "one_click" | "edit_then_apply" | "manual"
```

---

## Error Branches

| mutation/query | error surface | handler |
|---|---|---|
| stateQuery (load_custom_instruction_state) | NO dedicated alert — appears as spinner/empty (known gap) | stateQuery.isError not rendered visibly |
| previewMutation | toast(destructive) | previewMutation.onError |
| applyMutation | setPreviewOpen(false) + toast(destructive) | applyMutation.onError |
| clearMutation | toast(destructive) | clearMutation.onError |
| rollbackMutation | toast(destructive) | rollbackMutation.onError |
| openPath | toast(destructive) with formatInvokeError | try/catch in handleOpenGlobalFile |

**Known gap**: `load_custom_instruction_state` failure has no visible error alert. The page shows a Spinner/empty current state. This is a product-known limitation.

---

## Backend Binding

- Commands: `src-tauri/src/commands/custom_instructions.rs`
- Business: `src-tauri/src/core/custom_instructions.rs`
- Upstream note: accepted IDA absence-substitute; source archive product/local behavior only
- Raw leaves: `<source-location>/raw/aimami/1.0.9/macos/custom-instructions/<command>/`
