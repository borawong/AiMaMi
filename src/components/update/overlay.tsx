import { useTranslation } from "react-i18next";
import { Download, Loader2, RotateCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UpdateOverlayProps {
  status: "checking" | "available" | "downloading" | "installing" | "error";
  currentVersion: string;
  newVersion: string | undefined;
  body: string | null | undefined;
  progress: { total: number; downloaded: number } | null;
  error: string | null;
  onInstall: () => void;
  onRetry: () => void;
  onSkip: () => void;
}

export function UpdateOverlay({
  status,
  currentVersion,
  newVersion,
  body,
  progress,
  error,
  onInstall,
  onRetry,
  onSkip,
}: UpdateOverlayProps) {
  const { t } = useTranslation();

  const pct =
    progress && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : 0;

  const downloadedMB = progress
    ? (progress.downloaded / (1024 * 1024)).toFixed(1)
    : "0";
  const totalMB = progress
    ? (progress.total / (1024 * 1024)).toFixed(1)
    : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm dark:bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <h2 className="text-xl font-bold">
          {status === "error" ? t("update.checkTitle") : t("update.title")}
        </h2>

        {status === "checking" && (
          <div className="mt-6 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("update.checking")}</span>
          </div>
        )}

        {(status === "available" ||
          status === "downloading" ||
          status === "installing") && (
          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-xl bg-muted px-2.5 py-1  text-muted-foreground">
                v{currentVersion}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-xl bg-primary/10 px-2.5 py-1  font-semibold text-primary">
                v{newVersion}
              </span>
            </div>

            {body && (
              <div className="max-h-32 overflow-y-auto rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                {body}
              </div>
            )}

            {(status === "downloading" || status === "installing") && (
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all duration-300",
                      status === "installing" && "animate-pulse",
                    )}
                    style={{ width: `${status === "installing" ? 100 : pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {status === "installing"
                      ? t("update.installing")
                      : `${t("update.downloading")} ${pct}%`}
                  </span>
                  {status === "downloading" && progress && progress.total > 0 && (
                    <span>
                      {downloadedMB} / {totalMB} MB
                    </span>
                  )}
                </div>
              </div>
            )}

            {status === "available" && (
              <Button className="w-full py-3" onClick={onInstall}>
                <Download className="h-4 w-4" />
                {t("update.installAndRestart")}
              </Button>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error || t("update.failed")}</span>
            </div>
            <Button variant="outline" className="w-full py-3" onClick={onRetry}>
              <RotateCw className="h-4 w-4" />
              {t("update.retry")}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={onSkip}>
              {t("update.skipThisTime")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
