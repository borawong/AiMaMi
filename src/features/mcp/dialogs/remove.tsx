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
import type { useMcpPageController } from "../hooks";

type McpPageController = ReturnType<typeof useMcpPageController>;

interface McpRemoveDialogProps {
  remover: McpPageController["remover"];
}

export function McpRemoveDialog({
  remover,
}: McpRemoveDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={remover.open} onOpenChange={(value) => !value && remover.onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("mcp.delete")}</AlertDialogTitle>
          <AlertDialogDescription>{t("mcp.confirmDelete")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("mcp.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!remover.serverName || remover.requestState.remove}
            aria-busy={remover.requestState.remove}
            onClick={remover.onConfirm}
          >
            {t("mcp.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
