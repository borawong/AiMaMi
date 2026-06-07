import { useTranslation } from "react-i18next";
import { AnimatedSegmentedControl } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SettingsControllerProps } from "../types";
import { formatSettingsProxyTestResult } from "../utils";

export function SettingsApiProxyDialog({
  controller,
}: SettingsControllerProps) {
  const { t } = useTranslation();
  const dialog = controller.proxyDialog;
  const proxyTestMessage = dialog.proxyTestResult
    ? formatSettingsProxyTestResult(t, dialog.draftProxyMode, dialog.proxyTestResult)
    : null;

  return (
    <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.apiProxyDialogTitle")}</DialogTitle>
          <DialogDescription>{t("settings.apiProxyDialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("settings.apiProxyMode")}</div>
            <div className="inline-flex rounded-full bg-muted p-0.5 dark:bg-white/[0.06]">
              <AnimatedSegmentedControl
                items={[
                  { value: "direct", label: t("settings.apiProxyModeDirect") },
                  { value: "manual", label: t("settings.apiProxyModeManual") },
                ]}
                value={dialog.draftProxyMode}
                onValueChange={(nextValue) =>
                  controller.actions.setProxyMode(nextValue as typeof dialog.draftProxyMode)
                }
                className="gap-0.5"
                indicatorClassName="rounded-full bg-white shadow-sm dark:bg-white/[0.10]"
                itemClassName="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                activeItemClassName="text-foreground"
                inactiveItemClassName="text-muted-foreground hover:text-foreground"
              />
            </div>
          </div>

          {dialog.draftProxyMode === "manual" ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("settings.apiProxyUrl")}</div>
              <div className="flex items-center gap-2">
                <Input
                  value={dialog.draftProxyUrl}
                  onChange={(event) => controller.actions.setProxyUrl(event.target.value)}
                  placeholder={t("settings.apiProxyUrlPlaceholder")}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-9 flex-1 rounded-[8px] text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={controller.actions.detectProxy}
                  disabled={dialog.detecting}
                  aria-busy={dialog.detecting}
                  className="shrink-0"
                >
                  <ButtonBusyContent
                    busy={dialog.detecting}
                    idleLabel={t("settings.apiProxyDetect")}
                    busyLabel={t("settings.apiProxyDetecting")}
                  />
                </Button>
              </div>
            </div>
          ) : null}

          {dialog.proxyTestResult ? (
            <div
              className={cn(
                "rounded-[8px] border px-3 py-2 text-xs",
                dialog.proxyTestResult.reachable
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {proxyTestMessage}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => dialog.setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={controller.actions.testProxy}
            disabled={dialog.testing || dialog.manualProxyMissing}
            aria-busy={dialog.testing}
          >
            <ButtonBusyContent
              busy={dialog.testing}
              idleLabel={t("common.test")}
              busyLabel={t("settings.apiProxyTesting")}
            />
          </Button>
          <Button
            onClick={controller.actions.saveProxy}
            disabled={dialog.saving || dialog.manualProxyMissing}
            aria-busy={dialog.saving}
          >
            <ButtonBusyContent
              busy={dialog.saving}
              idleLabel={t("common.save")}
              busyLabel={t("settings.apiProxySaving")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
