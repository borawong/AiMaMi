import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { ButtonBusyContent } from "@/components/ui/busy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  MaintenanceFixIssueInput,
  MaintenanceRouterDiagnosticItem,
  MaintenanceRouterDiagnosticsPayload,
  MaintenanceRouterFixPayload,
} from "../types";

const MODAL_FEEDBACK_MS = 600;

interface RouterDiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runDiagnostics: () => Promise<MaintenanceRouterDiagnosticsPayload>;
  fixIssueAndRefresh: (
    input: MaintenanceFixIssueInput,
  ) => Promise<{
    fixResult: MaintenanceRouterFixPayload;
    diagnosticsResult: MaintenanceRouterDiagnosticsPayload;
  }>;
}

export function RouterDiagnosticsDialog({
  open,
  onOpenChange,
  runDiagnostics,
  fixIssueAndRefresh,
}: RouterDiagnosticsDialogProps) {
  const { t } = useTranslation();
  const [diagnostics, setDiagnostics] =
    useState<MaintenanceRouterDiagnosticsPayload | null>(null);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);
  const [fixingItemId, setFixingItemId] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [fixResult, setFixResult] = useState<MaintenanceRouterFixPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = diagnosticsBusy || fixingAll || fixingItemId !== null;

  const handleDiagnosticsResult = useCallback(
    (payload: MaintenanceRouterDiagnosticsPayload) => {
      setDiagnostics(payload);
    },
    [],
  );

  const handleFixResult = useCallback(
    (payload: MaintenanceRouterFixPayload) => {
      setFixResult(payload);
    },
    [],
  );

  const recheck = useCallback(
    async (initial = false) => {
      if (initial) {
        setDiagnosticsBusy(true);
      } else {
        flushSync(() => setDiagnosticsBusy(true));
        await waitForPaint();
      }

      setFixResult(null);
      setError(null);
      const startedAt = Date.now();

      try {
        handleDiagnosticsResult(await runDiagnostics());
      } catch (err) {
        setError(errorToString(err));
      } finally {
        if (!initial) {
          await waitForFeedback(startedAt);
        }
        setDiagnosticsBusy(false);
      }
    },
    [handleDiagnosticsResult, runDiagnostics],
  );

  const fixIssue = useCallback(
    async (itemId: string) => {
      flushSync(() => setFixingItemId(itemId));
      await waitForPaint();
      setFixResult(null);
      setError(null);
      const startedAt = Date.now();

      try {
        const result = await fixIssueAndRefresh({ itemId });
        handleFixResult(result.fixResult);
        handleDiagnosticsResult(result.diagnosticsResult);
      } catch (err) {
        setError(errorToString(err));
      } finally {
        await waitForFeedback(startedAt);
        setFixingItemId(null);
      }
    },
    [fixIssueAndRefresh, handleDiagnosticsResult, handleFixResult],
  );

  const fixAll = useCallback(async () => {
    flushSync(() => setFixingAll(true));
    await waitForPaint();
    setFixResult(null);
    setError(null);
    const startedAt = Date.now();

    try {
      const result = await fixIssueAndRefresh({ itemId: "all" });
      handleFixResult(result.fixResult);
      handleDiagnosticsResult(result.diagnosticsResult);
    } catch (err) {
      setError(errorToString(err));
    } finally {
      await waitForFeedback(startedAt);
      setFixingAll(false);
    }
  }, [fixIssueAndRefresh, handleDiagnosticsResult, handleFixResult]);

  useEffect(() => {
    if (open) {
      void recheck(true);
      return;
    }

    setDiagnostics(null);
    setFixResult(null);
    setError(null);
  }, [open, recheck]);

  const fixableIssueCount =
    diagnostics?.items.filter(
      (item) => item.fixable && readRouterDiagnosticStatus(item) !== "ok",
    )
      .length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("relay.diagnostic.title")}</DialogTitle>
          <DialogDescription>{t("relay.diagnostic.description")}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/50 dark:bg-red-900/20">
            <p className="break-all text-[12px] text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {diagnosticsBusy && !diagnostics ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t("relay.diagnostic.running")}
            </span>
          </div>
        ) : diagnostics && !diagnostics.hasIssues ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-[13px] leading-relaxed text-foreground/80">
                {t("relay.diagnostic.allClear")}
              </p>
            </div>
            <RouterFixLog result={fixResult} />
            <div className="flex justify-center pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void recheck()}
                disabled={busy}
                aria-busy={diagnosticsBusy}
              >
                <ButtonBusyContent
                  busy={diagnosticsBusy}
                  idleIcon={<RotateCw className="h-3.5 w-3.5" />}
                  idleLabel={t("relay.diagnostic.recheck")}
                  busyLabel={t("relay.diagnostic.running")}
                />
              </Button>
            </div>
          </div>
        ) : diagnostics ? (
          <div className="space-y-3">
            <div className="space-y-1">
              {diagnostics.items.map((item) => (
                <RouterDiagnosticItemRow
                  key={item.id}
                  item={item}
                  fixing={fixingItemId === item.id}
                  onFix={() => void fixIssue(item.id)}
                  disabled={busy}
                />
              ))}
            </div>
            <RouterFixLog result={fixResult} />
            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void recheck()}
                disabled={busy}
                aria-busy={diagnosticsBusy}
              >
                <ButtonBusyContent
                  busy={diagnosticsBusy}
                  idleIcon={<RotateCw className="h-3.5 w-3.5" />}
                  idleLabel={t("relay.diagnostic.recheck")}
                  busyLabel={t("relay.diagnostic.running")}
                />
              </Button>
              {fixableIssueCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => void fixAll()}
                  disabled={busy}
                  aria-busy={fixingAll}
                >
                  <ButtonBusyContent
                    busy={fixingAll}
                    idleIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    idleLabel={t("relay.diagnostic.fixAll", {
                      count: fixableIssueCount,
                    })}
                    busyLabel={t("relay.diagnostic.fixingAll")}
                  />
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RouterFixLog({
  result,
}: {
  result: MaintenanceRouterFixPayload | null;
}) {
  const { t } = useTranslation();
  const details = result?.details ? [result.details] : [];

  if (details.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 dark:bg-black/25">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
        {t("relay.diagnostic.fixLog")}
      </p>
      {details.map((detail, index) => (
        <p key={`${detail}-${index}`} className="text-[11px] text-muted-foreground">
          {detail}
        </p>
      ))}
    </div>
  );
}

function RouterDiagnosticItemRow({
  item,
  fixing,
  onFix,
  disabled,
}: {
  item: MaintenanceRouterDiagnosticItem;
  fixing: boolean;
  onFix: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const status = readRouterDiagnosticStatus(item);
  const detail = item.detail ?? null;
  const StatusIcon = status === "ok" ? CheckCircle2 : AlertCircle;
  const iconColor =
    status === "ok"
      ? "text-emerald-500"
      : status === "warning"
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="rounded-xl border border-border/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
        <button
          type="button"
          className="flex-1 text-left text-[12px] leading-snug"
          onClick={() => detail && setExpanded((value) => !value)}
          aria-expanded={detail ? expanded : undefined}
        >
          {readRouterDiagnosticLabel(item)}
        </button>
        {item.fixable && status !== "ok" && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px]"
            onClick={onFix}
            disabled={disabled || fixing}
            aria-busy={fixing}
          >
            <ButtonBusyContent
              busy={fixing}
              idleLabel={t("relay.diagnostic.fix")}
              busyLabel={t("relay.diagnostic.fix")}
              spinnerClassName="h-3 w-3"
            />
          </Button>
        )}
      </div>
      {expanded && detail && (
        <p className="mt-1.5 pl-5 text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}
    </div>
  );
}

async function waitForPaint() {
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function waitForFeedback(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MODAL_FEEDBACK_MS) {
    await new Promise((resolve) => setTimeout(resolve, MODAL_FEEDBACK_MS - elapsed));
  }
}

function readRouterDiagnosticLabel(item: MaintenanceRouterDiagnosticItem) {
  return item.label ?? item.title ?? item.message ?? item.id;
}

function readRouterDiagnosticStatus(item: MaintenanceRouterDiagnosticItem) {
  return item.status ?? item.severity;
}

function errorToString(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
