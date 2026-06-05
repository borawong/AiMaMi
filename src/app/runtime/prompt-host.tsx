/**
 * 中文职责说明：集中承载全局提示、更新覆盖层和安装位置弹窗，避免 runtime 初始化层拥有 UI。
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { UpdateOverlay } from "@/components/update/update-overlay";
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
import { useUpdateCheck } from "@/hooks/use-update-check";
import { useInstallLocationPrompt } from "./use-install-location-prompt";

interface PromptHostActions {
  checkForUpdate: () => Promise<"available" | "up-to-date" | "error">;
}

const PromptHostContext = createContext<PromptHostActions | null>(null);

export function PromptHost({ children }: { children: ReactNode }) {
  const update = useUpdateCheck();
  const installLocationPrompt = useInstallLocationPrompt();
  const showUpdateOverlay =
    update.status === "available" ||
    update.status === "downloading" ||
    update.status === "installing" ||
    update.status === "error";

  const actions = useMemo<PromptHostActions>(
    () => ({
      checkForUpdate: update.checkForUpdate,
    }),
    [update.checkForUpdate],
  );

  return (
    <PromptHostContext.Provider value={actions}>
      {children}
      <Toaster />
      <InstallLocationPromptDialog prompt={installLocationPrompt} />
      {showUpdateOverlay && !installLocationPrompt.open && (
        <UpdateOverlay
          status={update.status as "checking" | "available" | "downloading" | "installing" | "error"}
          currentVersion={update.updateInfo?.currentVersion ?? "0.0.0"}
          newVersion={update.updateInfo?.version}
          body={update.updateInfo?.body}
          progress={update.progress}
          error={update.error}
          onInstall={update.installUpdate}
          onRetry={update.checkForUpdate}
          onSkip={update.dismiss}
        />
      )}
    </PromptHostContext.Provider>
  );
}

export function usePromptHostActions() {
  const context = useContext(PromptHostContext);
  if (!context) {
    throw new Error("缺少 PromptHostContext");
  }
  return context;
}

function InstallLocationPromptDialog({
  prompt,
}: {
  prompt: ReturnType<typeof useInstallLocationPrompt>;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={prompt.open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("update.installPromptTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("update.installPromptDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={prompt.dismiss}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={prompt.openApplications}>
            {t("update.openApplications")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
