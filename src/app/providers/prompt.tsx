/**
 * 中文职责说明：集中承载全局提示、更新覆盖层和安装位置弹窗，避免 runtime 初始化层拥有 UI。
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { UpdateOverlay } from "@/components/update/overlay";
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
import { useUpdateCheck } from "@/hooks/update";
import { useInstallLocationPrompt } from "@/app/runtime/install";
import { usePendingAutoSwitchPrompt } from "@/app/runtime/pending";

interface PromptHostActions {
  checkForUpdate: () => Promise<"available" | "up-to-date" | "error">;
}

const PromptHostContext = createContext<PromptHostActions | null>(null);

export function PromptHost({ children }: { children: ReactNode }) {
  const update = useUpdateCheck();
  const installLocationPrompt = useInstallLocationPrompt();
  const pendingAutoSwitchPrompt = usePendingAutoSwitchPrompt();
  const showPendingAutoSwitchPrompt =
    pendingAutoSwitchPrompt.open && !installLocationPrompt.open;
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
      <PendingAutoSwitchPromptDialog
        open={showPendingAutoSwitchPrompt}
        prompt={pendingAutoSwitchPrompt}
      />
      {showUpdateOverlay && !installLocationPrompt.open && !showPendingAutoSwitchPrompt && (
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

function PendingAutoSwitchPromptDialog({
  open,
  prompt,
}: {
  open: boolean;
  prompt: ReturnType<typeof usePendingAutoSwitchPrompt>;
}) {
  const { t } = useTranslation();
  const unknown = t("accounts.unknown");

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.autoSwitchPromptTitle")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {t("settings.autoSwitchPromptDesc", {
                  current: prompt.currentText || unknown,
                  candidate: prompt.candidateText || unknown,
                })}
              </p>
              <PromptAccountLine
                label={t("settings.autoSwitchPromptCurrent")}
                value={prompt.currentText || unknown}
              />
              <PromptAccountLine
                label={t("settings.autoSwitchPromptCandidate")}
                value={prompt.candidateText || unknown}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={prompt.isPending}
            onClick={() => void prompt.dismiss()}
          >
            {t("settings.autoSwitchPromptSkip")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={prompt.isPending}
            onClick={() => void prompt.confirmAndRestart()}
          >
            {t("settings.autoSwitchPromptConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PromptAccountLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
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
