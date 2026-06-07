import type { CustomInstructionsConfigurePanelController } from "../types";
import { CustomInstructionsCurrentStatusPanel } from "./status";
import { CustomInstructionsEditorPanel } from "./editor";
import { CustomInstructionsHistoryPanel } from "./history";

export function CustomInstructionsConfigurePanel({
  current,
  draftContent,
  history,
  protectedMode,
  selectedTemplateTitle,
  previewPending,
  clearPending,
  rollbackingId,
  onDraftContentChange,
  onOpenGlobalPath,
  onRestoreCurrent,
  onRequestClear,
  onPreviewDraft,
  onResetEditor,
  onRollback,
}: CustomInstructionsConfigurePanelController) {
  return (
    <div className="space-y-6">
      <CustomInstructionsCurrentStatusPanel
        current={current}
        protectedMode={protectedMode}
        clearPending={clearPending}
        onOpenGlobalPath={onOpenGlobalPath}
        onRestoreCurrent={onRestoreCurrent}
        onRequestClear={onRequestClear}
      />
      <CustomInstructionsEditorPanel
        draftContent={draftContent}
        protectedMode={protectedMode}
        previewPending={previewPending}
        selectedTemplateTitle={selectedTemplateTitle}
        onDraftContentChange={onDraftContentChange}
        onPreviewDraft={onPreviewDraft}
        onResetEditor={onResetEditor}
      />
      <CustomInstructionsHistoryPanel
        history={history}
        rollbackingId={rollbackingId}
        onRollback={onRollback}
      />
    </div>
  );
}
