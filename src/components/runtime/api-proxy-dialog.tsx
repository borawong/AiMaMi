import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiProxyConfigPayload,
  ApiProxyMode,
  ApiProxyDetectPayload,
  ApiProxyTestPayload,
} from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import { Input } from "@/components/ui/input";
import { AnimatedSegmentedControl } from "@/components/ui/animated-segmented-control";
import { toast } from "@/hooks/use-toast";
import { useBusyAction } from "@/hooks/use-busy-action";
const RUNTIME_STATE_DISPLAY_QUERY_KEY = ["runtime-state", "display"] as const;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SnapshotEnvelope = Awaited<ReturnType<typeof api.loadSnapshot>>;

interface ApiProxyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProxy?: ApiProxyConfigPayload | null;
  onSaved?: () => Promise<unknown> | void;
  defaultModeOnOpen?: ApiProxyMode;
}

function normalizeProxyUrl(mode: ApiProxyMode, url: string) {
  return mode === "manual" ? url.trim() : undefined;
}

function formatProxyTestResult(
  t: (key: string, options?: Record<string, unknown>) => string,
  mode: ApiProxyMode,
  result: ApiProxyTestPayload,
) {
  if (result.reachable) {
    return mode === "manual"
      ? t("settings.apiProxyTestReachableManual")
      : t("settings.apiProxyTestReachableDirect");
  }

  switch (result.code) {
    case "not_found":
      return t("settings.apiProxyDetectFailed");
    case "invalid_config":
      return t("settings.apiProxyTestInvalidConfig");
    case "client_build_failed":
      return t("settings.apiProxyTestClientBuildFailed");
    case "network_error":
      return t("settings.apiProxyTestNetworkFailed");
    default:
      return t("settings.apiProxyTestFailed");
  }
}

function formatProxySaveError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("Manual proxy mode requires a proxy URL") ||
    message.includes("Invalid proxy URL") ||
    message.includes("Unsupported proxy scheme")
  ) {
    return t("settings.apiProxyTestInvalidConfig");
  }

  return message;
}

export function ApiProxyDialog({
  open,
  onOpenChange,
  currentProxy,
  onSaved,
  defaultModeOnOpen,
}: ApiProxyDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const proxy = currentProxy ?? { mode: "direct" as ApiProxyMode, url: null };
  const [draftProxyMode, setDraftProxyMode] = useState<ApiProxyMode>(proxy.mode);
  const [draftProxyUrl, setDraftProxyUrl] = useState(proxy.url ?? "");
  const [proxyTestResult, setProxyTestResult] = useState<ApiProxyTestPayload | null>(null);
  const detectProxyAction = useBusyAction({ minVisibleMs: 600 });
  const testProxyAction = useBusyAction({ minVisibleMs: 600 });
  const saveProxyAction = useBusyAction({ minVisibleMs: 600 });

  useEffect(() => {
    if (!open) return;
    setDraftProxyMode(defaultModeOnOpen ?? proxy.mode);
    setDraftProxyUrl(proxy.url ?? "");
    setProxyTestResult(null);
  }, [defaultModeOnOpen, open, proxy.mode, proxy.url]);

  const saveProxyMutation = useMutation({
    mutationFn: () => api.setApiProxyConfig(draftProxyMode, normalizeProxyUrl(draftProxyMode, draftProxyUrl)),
    onSuccess: async (result) => {
      onOpenChange(false);
      setProxyTestResult(null);
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              api: result.data.api,
            },
          },
        };
      });
      await onSaved?.();
      toast({
        title: t("settings.apiProxySaved"),
        description: t("settings.apiProxySavedDesc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: formatProxySaveError(t, error),
        variant: "destructive",
      });
    },
  });

  const testProxyMutation = useMutation({
    mutationFn: () => api.testApiProxyConfig(draftProxyMode, normalizeProxyUrl(draftProxyMode, draftProxyUrl)),
    onSuccess: (result) => {
      setProxyTestResult(result.data);
    },
    onError: (error) => {
      setProxyTestResult({
        code: "network_error",
        reachable: false,
        statusCode: null,
        message: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const detectProxyMutation = useMutation({
    mutationFn: () => api.detectApiProxyConfig(),
    onSuccess: (result) => {
      const payload: ApiProxyDetectPayload = result.data;
      if (payload.found && payload.mode === "manual" && payload.url) {
        setDraftProxyMode("manual");
        setDraftProxyUrl(payload.url);
      }
      setProxyTestResult(payload.probe);
    },
    onError: () => {
      setProxyTestResult({
        code: "not_found",
        reachable: false,
        statusCode: null,
        message: "",
      });
    },
  });

  const manualProxyMissing = draftProxyMode === "manual" && draftProxyUrl.trim().length === 0;
  const proxyTestMessage = proxyTestResult
    ? formatProxyTestResult(t, draftProxyMode, proxyTestResult)
    : null;

  const handleTestProxy = async () => {
    await testProxyAction.run(async () => {
      if (manualProxyMissing) return;
      await testProxyMutation.mutateAsync();
    });
  };

  const handleDetectProxy = async () => {
    await detectProxyAction.run(async () => {
      await detectProxyMutation.mutateAsync();
    });
  };

  const handleSaveProxy = async () => {
    await saveProxyAction.run(async () => {
      if (manualProxyMissing) return;
      await saveProxyMutation.mutateAsync();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                value={draftProxyMode}
                onValueChange={(nextValue) => {
                  setDraftProxyMode(nextValue as "direct" | "manual");
                  setProxyTestResult(null);
                }}
                className="gap-0.5"
                indicatorClassName="rounded-full bg-white shadow-sm dark:bg-white/[0.10]"
                itemClassName="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                activeItemClassName="text-foreground"
                inactiveItemClassName="text-muted-foreground hover:text-foreground"
              />
            </div>
          </div>

          {draftProxyMode === "manual" ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("settings.apiProxyUrl")}</div>
              <div className="flex items-center gap-2">
                <Input
                  value={draftProxyUrl}
                  onChange={(e) => {
                    setDraftProxyUrl(e.target.value);
                    setProxyTestResult(null);
                  }}
                  placeholder={t("settings.apiProxyUrlPlaceholder")}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-9 flex-1 rounded-[8px] text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectProxy}
                  disabled={detectProxyAction.busy}
                  aria-busy={detectProxyAction.busy}
                  className="shrink-0"
                >
                  <ButtonBusyContent
                    busy={detectProxyAction.busy}
                    idleLabel={t("settings.apiProxyDetect")}
                    busyLabel={t("settings.apiProxyDetecting")}
                  />
                </Button>
              </div>
            </div>
          ) : null}

          {proxyTestResult ? (
            <div
              className={cn(
                "rounded-[8px] border px-3 py-2 text-xs",
                proxyTestResult.reachable
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {proxyTestMessage}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestProxy}
            disabled={testProxyAction.busy || manualProxyMissing}
            aria-busy={testProxyAction.busy}
          >
            <ButtonBusyContent
              busy={testProxyAction.busy}
              idleLabel={t("common.test")}
              busyLabel={t("settings.apiProxyTesting")}
            />
          </Button>
          <Button
            onClick={handleSaveProxy}
            disabled={saveProxyAction.busy || manualProxyMissing}
            aria-busy={saveProxyAction.busy}
          >
            <ButtonBusyContent
              busy={saveProxyAction.busy}
              idleLabel={t("common.save")}
              busyLabel={t("settings.apiProxySaving")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
