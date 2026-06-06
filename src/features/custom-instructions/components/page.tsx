/**
 * 中文职责说明：route/module shell 只装配 custom-instructions controller、panels 和 dialogs。
 */
import {
  CustomInstructionsClearManagedBlockDialog,
  CustomInstructionsPreviewApplyDialog,
} from "../dialogs";
import { useCustomInstructionsPageController } from "../hooks";
import {
  CustomInstructionsLoadErrorPanel,
  CustomInstructionsPageBodyPanel,
  CustomInstructionsPageHeaderPanel,
} from "../panels";

export function CustomInstructionsPage() {
  const controller = useCustomInstructionsPageController();

  return (
    <div className="space-y-6">
      <CustomInstructionsPageHeaderPanel {...controller.headerPanel} />
      <CustomInstructionsLoadErrorPanel {...controller.loadErrorPanel} />
      <CustomInstructionsPageBodyPanel {...controller.bodyPanel} />
      <CustomInstructionsPreviewApplyDialog {...controller.previewDialog} />
      <CustomInstructionsClearManagedBlockDialog {...controller.clearDialog} />
    </div>
  );
}
