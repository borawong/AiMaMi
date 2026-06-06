/**
 * 中文职责说明：配置面板只组合当前状态、编辑区和历史子面板。
 */
import type { CustomInstructionsPageController } from "../hooks";
import { CustomInstructionsCurrentStatusPanel } from "./status";
import { CustomInstructionsEditorPanel } from "./editor";
import { CustomInstructionsHistoryPanel } from "./history";

type CustomInstructionsConfigurePanelProps =
  CustomInstructionsPageController["bodyPanel"]["configure"];

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
}: CustomInstructionsConfigurePanelProps) {
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
