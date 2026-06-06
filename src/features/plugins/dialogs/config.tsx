/**
 * 中文职责说明：plugins 配置弹窗只渲染 JSON 草稿和确认动作，状态由 controller 持有。
 */
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { PluginsPageController } from "../hooks";
import { formatJsonSummary } from "../utils";

type PluginConfigDialogController = PluginsPageController["configDialog"];

export function PluginConfigDialog({
  controller,
}: {
  controller: PluginConfigDialogController;
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={controller.open}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("plugins.config")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <PluginConfigSummary value={controller.summaryValue} />
          <div className="space-y-2">
            <label
              htmlFor="plugin-config-json"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("plugins.configJson")}
            </label>
            <Textarea
              id="plugin-config-json"
              value={controller.draft}
              onChange={(event) => controller.updateDraft(event.target.value)}
              className="min-h-[240px] font-mono text-xs leading-5"
              disabled={controller.isLoading || controller.isSaving}
              spellCheck={false}
            />
            {controller.parseErrorKey ? (
              <p className="text-xs text-destructive" role="alert">
                {t(controller.parseErrorKey)}
              </p>
            ) : null}
            {controller.isLoadError ? (
              <p className="text-xs text-destructive" role="alert">
                {t("plugins.configLoadFailed")}
              </p>
            ) : null}
            {controller.isSaveError ? (
              <p className="text-xs text-destructive" role="alert">
                {t("plugins.configSaveFailed")}
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={controller.close}>
            {t("plugins.closeConfig")}
          </Button>
          <Button
            type="button"
            disabled={!controller.canSave}
            onClick={() => void controller.save()}
          >
            <Save className="h-3.5 w-3.5" />
            {t("plugins.saveConfig")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PluginConfigSummary({ value }: { value: unknown }) {
  return (
    <pre className="max-h-32 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
      {formatJsonSummary(value)}
    </pre>
  );
}
