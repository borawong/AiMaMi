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
import type {
  SkillsConfirmDialogProps,
  SkillsConfirmDialogsProps,
} from "../types";

export function SkillsConfirmDialogs({ controller }: SkillsConfirmDialogsProps) {
  return (
    <>
      <RemoveSkillDialog controller={controller.removeDialog} />
      <DeleteBackupDialog controller={controller.deleteBackupDialog} />
    </>
  );
}

function RemoveSkillDialog({ controller }: SkillsConfirmDialogProps) {
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

function DeleteBackupDialog({ controller }: SkillsConfirmDialogProps) {
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
