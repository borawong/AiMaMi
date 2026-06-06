/**
 * 中文职责说明：skills 确认弹窗只渲染 remove/delete backup 确认动作，状态由 controller 持有。
 */
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
} from "@/components/ui/alert-dialog";
import type { SkillsPageController } from "../hooks";

export function SkillsConfirmDialogs({
  controller,
}: {
  controller: SkillsPageController;
}) {
  return (
    <>
      <RemoveSkillDialog controller={controller.removeDialog} />
      <DeleteBackupDialog controller={controller.deleteBackupDialog} />
    </>
  );
}

function RemoveSkillDialog({
  controller,
}: {
  controller: SkillsPageController["removeDialog"];
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog
      open={controller.open}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("skills.remove")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("skills.confirmRemove")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={controller.isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={controller.isPending}
            onClick={controller.confirm}
          >
            {t("skills.remove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteBackupDialog({
  controller,
}: {
  controller: SkillsPageController["deleteBackupDialog"];
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog
      open={controller.open}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("skills.deleteBackup")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("skills.confirmDeleteBackup")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={controller.isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={controller.isPending}
            onClick={controller.confirm}
          >
            {t("skills.deleteBackup")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
