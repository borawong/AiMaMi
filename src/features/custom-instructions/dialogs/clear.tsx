import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert";
import type { CustomInstructionsPageController } from "../hooks";

type CustomInstructionsClearManagedBlockDialogProps =
  CustomInstructionsPageController["clearDialog"];

export function CustomInstructionsClearManagedBlockDialog({
  open,
  clearing,
  onOpenChange,
  onConfirm,
}: CustomInstructionsClearManagedBlockDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("customInstructions.clearConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("customInstructions.clearConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={clearing}>
            {clearing
              ? t("customInstructions.clearing")
              : t("customInstructions.clearManagedBlock")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
