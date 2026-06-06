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
