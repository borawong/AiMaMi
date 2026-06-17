import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiProxyMode } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AnimatedSegmentedControl } from "@/components/ui/animated-segmented-control";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sun, Moon, Monitor, Globe, Download, Loader2 } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import {
  ACCENT_PRESETS,
  HEATMAP_PRESETS,
  type AccentPreset,
  type HeatmapPreset,
} from "@/hooks/use-accent-color";
import type { Theme } from "@/hooks/use-theme";
const RUNTIME_STATE_DISPLAY_QUERY_KEY = ["runtime-state", "display"] as const;
import { REFRESH_OPTIONS, type RefreshInterval } from "@/hooks/use-auto-refresh";
import { useBusyAction } from "@/hooks/use-busy-action";
import { isMacPlatform } from "@/lib/platform";
import { ApiProxyDialog } from "@/components/runtime/api-proxy-dialog";
import { SshServersSection } from "@/components/settings/ssh-servers-section";

type SnapshotEnvelope = Awaited<ReturnType<typeof api.loadSnapshot>>;
interface SettingsPageProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  accent: AccentPreset;
  setAccent: (accent: AccentPreset) => void;
  heatmap: HeatmapPreset;
  setHeatmap: (heatmap: HeatmapPreset) => void;
  language: string;
  setLanguage: (lang: string) => void;
  refreshInterval: RefreshInterval;
  setRefreshInterval: (v: RefreshInterval) => void;
  onCheckUpdate: () => Promise<"available" | "up-to-date" | "error">;
  onRefreshUsageStatus?: () => Promise<unknown>;
}

function proxyModeBadgeLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  mode: ApiProxyMode,
) {
  return mode === "manual"
    ? t("settings.apiProxyModeManual")
    : t("settings.apiProxyModeDirect");
}

export function SettingsPage({
  theme,
  onThemeChange,
  accent,
  setAccent,
  heatmap,
  setHeatmap,
  language,
  setLanguage,
  refreshInterval,
  setRefreshInterval,
  onCheckUpdate,
  onRefreshUsageStatus,
}: SettingsPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const supportsHotspot = isMacPlatform();

  const statusQuery = useQuery({
    queryKey: RUNTIME_STATE_DISPLAY_QUERY_KEY,
    queryFn: () => api.loadSnapshot(false),
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const status = statusQuery.data?.data.status;

  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [draft5h, setDraft5h] = useState(15);
  const [draftWeekly, setDraftWeekly] = useState(10);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const updateCheckAction = useBusyAction({ minVisibleMs: 600 });

  const openThresholdDialog = (enabling: boolean) => {
    setPendingEnable(enabling);
    setDraft5h(status?.autoSwitch.threshold5hPercent ?? 15);
    setDraftWeekly(status?.autoSwitch.thresholdWeeklyPercent ?? 10);
    setThresholdDialogOpen(true);
  };

  const openProxyDialog = () => {
    setProxyDialogOpen(true);
  };

  const disableAutoSwitchMutation = useMutation({
    mutationFn: () => api.setAutoSwitch(false),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: RUNTIME_STATE_DISPLAY_QUERY_KEY });
      const previous = queryClient.getQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY);
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: { ...old.data.status.autoSwitch, enabled: false },
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(RUNTIME_STATE_DISPLAY_QUERY_KEY, context.previous);
      }
    },
    onSuccess: () => {
      toast({
        title: t("settings.autoSwitchDisabled"),
        description: t("settings.autoSwitchDisabledDesc"),
        variant: "success",
      });
    },
  });

  const saveThresholdsMutation = useMutation({
    mutationFn: async (params: { enable: boolean; t5h: number; tWeekly: number }) => {
      if (params.enable) await api.setAutoSwitch(true);
      return api.configureAutoSwitch(params.t5h, params.tWeekly);
    },
    onSuccess: (_data, params) => {
      setThresholdDialogOpen(false);
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: {
                ...old.data.status.autoSwitch,
                enabled: true,
                threshold5hPercent: params.t5h,
                thresholdWeeklyPercent: params.tWeekly,
              },
            },
          },
        };
      });
      toast({
        title: params.enable ? t("settings.autoSwitchEnabled") : t("settings.thresholdSavedTitle"),
        description: params.enable
          ? t("settings.autoSwitchEnabledDesc")
          : t("settings.thresholdSavedDesc"),
        variant: "success",
      });
    },
  });

  const notchQuery = useQuery({
    queryKey: ["has-notch"],
    queryFn: () => api.hasNotch(),
    staleTime: Infinity,
    enabled: supportsHotspot,
  });

  const hasNotch = notchQuery.data ?? false;

  const hotspotQuery = useQuery({
    queryKey: ["hotspot-enabled"],
    queryFn: () => api.getHotspotEnabled(),
    enabled: supportsHotspot && hasNotch,
  });

  const hotspotMutation = useMutation({
    mutationFn: (enabled: boolean) => api.setHotspotEnabled(enabled),
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["hotspot-enabled"] });
      toast({
        title: enabled ? t("settings.hotspotEnabled") : t("settings.hotspotDisabled"),
        description: enabled ? t("settings.hotspotEnabledDesc") : t("settings.hotspotDisabledDesc"),
        variant: "success",
      });
    },
  });

  const checkingUpdate = updateCheckAction.busy;
  const handleCheckUpdate = async () => {
    await updateCheckAction.run(async () => {
      try {
        const result = await onCheckUpdate();
        if (result === "up-to-date") {
          toast({
            title: t("settings.upToDate"),
            description: t("settings.upToDateDesc"),
            variant: "default",
          });
        } else if (result === "error") {
          toast({
            title: t("settings.updateCheckFailed"),
            description: t("settings.updateCheckFailedDesc"),
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: t("settings.updateCheckFailed"),
          description: t("settings.updateCheckFailedDesc"),
          variant: "destructive",
        });
      }
    });
  };

  const [appVersion, setAppVersion] = useState("...");
  useEffect(() => {
    import("@tauri-apps/api/app")
      .then((m) => m.getVersion())
      .then(setAppVersion)
      .catch(() => setAppVersion("unknown"));
  }, []);

  const currentProxy = status?.api.proxy ?? { mode: "direct" as ApiProxyMode, url: null };

  return (
    <div className="space-y-8">
      <Section title={t("settings.appearance")}>
        <SettingRow label={t("settings.theme")}>
          <SettingSegmentedControl
            items={[
              { value: "light", icon: Sun, label: t("settings.light") },
              { value: "dark", icon: Moon, label: t("settings.dark") },
              { value: "system", icon: Monitor, label: t("settings.system") },
            ]}
            value={theme}
            onChange={(v) => onThemeChange(v as Theme)}
          />
        </SettingRow>

        <SettingRow label={t("settings.language")}>
          <SettingSegmentedControl
            items={[
              { value: "zh", icon: Globe, label: "中文" },
              { value: "en", icon: Globe, label: "English" },
            ]}
            value={language}
            onChange={setLanguage}
          />
        </SettingRow>

        <SettingRow label={t("settings.accentColor")} description={t("settings.accentColorDesc")}>
          <div className="flex gap-2">
            {(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map((key) => (
              <button
                key={key}
                onClick={() => setAccent(key)}
                title={ACCENT_PRESETS[key].label}
                className={cn(
                  "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                  accent === key ? "ring-foreground" : "ring-transparent",
                )}
                style={{ backgroundColor: ACCENT_PRESETS[key].hex }}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label={t("settings.heatmapColor")} description={t("settings.heatmapColorDesc")}>
          <div className="flex gap-2">
            {(Object.keys(HEATMAP_PRESETS) as HeatmapPreset[]).map((key) => (
              <button
                key={key}
                onClick={() => setHeatmap(key)}
                title={HEATMAP_PRESETS[key].label}
                className={cn(
                  "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                  heatmap === key ? "ring-foreground" : "ring-transparent",
                )}
                style={{ backgroundColor: HEATMAP_PRESETS[key].hex }}
              />
            ))}
          </div>
        </SettingRow>

        {supportsHotspot && (
          <SettingRow
            label={t("settings.hotspot")}
            description={hasNotch ? t("settings.hotspotDesc") : t("settings.hotspotNotSupported")}
          >
            <Switch
              checked={hasNotch && (hotspotQuery.data ?? false)}
              onCheckedChange={(v) => hotspotMutation.mutate(v)}
              disabled={!hasNotch || hotspotMutation.isPending}
            />
          </SettingRow>
        )}

      </Section>

      <Section title={t("settings.modeSwitch")}>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{t("settings.autoSwitch")}</span>
              {status?.autoSwitch.enabled && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-[11px] font-normal hover:bg-secondary/60"
                  onClick={() => openThresholdDialog(false)}
                >
                  5h ≤{status.autoSwitch.threshold5hPercent ?? 15}% · 1w ≤{status.autoSwitch.thresholdWeeklyPercent ?? 10}%
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.autoSwitchDesc")}</p>
          </div>
          <Switch
            checked={status?.autoSwitch.enabled ?? false}
            onCheckedChange={(v) => {
              if (v) {
                openThresholdDialog(true);
              } else {
                disableAutoSwitchMutation.mutate();
              }
            }}
            disabled={disableAutoSwitchMutation.isPending || saveThresholdsMutation.isPending}
          />
        </div>
        <SettingRow
          label={t("settings.refreshInterval")}
          description={t("settings.refreshIntervalDesc")}
        >
          <SettingSegmentedControl
            items={REFRESH_OPTIONS.map(({ value, labelKey }) => ({
              value,
              label: t(labelKey),
            }))}
            value={refreshInterval}
            onChange={(v) => setRefreshInterval(v as RefreshInterval)}
            compact
          />
        </SettingRow>
        <SettingRow
          label={
            <div className="flex items-center gap-2">
              <span>{t("settings.apiProxy")}</span>
              <Badge variant="secondary" className="text-[11px] font-normal">
                {proxyModeBadgeLabel(t, currentProxy.mode)}
              </Badge>
            </div>
          }
          description={t("settings.apiProxyDesc")}
        >
          <Button variant="outline" size="sm" onClick={openProxyDialog}>
            {t("common.edit")}
          </Button>
        </SettingRow>
      </Section>

      <Section title={t("settings.remoteServersSection")}>
        <SshServersSection />
      </Section>

      <Section title={t("settings.about")}>
        <SettingRow label={t("settings.version")}>
          <span className=" text-sm text-muted-foreground">
            {appVersion}
          </span>
        </SettingRow>
        <SettingRow label={t("settings.checkUpdate")}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            aria-busy={checkingUpdate}
          >
            <ButtonBusyContent
              busy={checkingUpdate}
              idleIcon={<Download className="h-3.5 w-3.5 shrink-0" />}
              idleLabel={t("settings.checkUpdate")}
              busyLabel={t("settings.checkUpdateBusy")}
            />
          </Button>
        </SettingRow>
      </Section>

      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.thresholdDialogTitle")}</DialogTitle>
            <DialogDescription>{t("settings.thresholdDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("settings.threshold5h")}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={draft5h}
                  onChange={(e) => setDraft5h(Number(e.target.value))}
                  className="h-8 w-20 rounded-[8px] text-right text-xs"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("settings.thresholdWeekly")}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={draftWeekly}
                  onChange={(e) => setDraftWeekly(Number(e.target.value))}
                  className="h-8 w-20 rounded-[8px] text-right text-xs"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThresholdDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                saveThresholdsMutation.mutate({
                  enable: pendingEnable,
                  t5h: draft5h,
                  tWeekly: draftWeekly,
                })
              }
              disabled={saveThresholdsMutation.isPending}
            >
              {saveThresholdsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApiProxyDialog
        open={proxyDialogOpen}
        onOpenChange={setProxyDialogOpen}
        currentProxy={currentProxy}
        onSaved={() => onRefreshUsageStatus?.()}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <BentoCard className="p-0 [&>div]:divide-y [&>div]:divide-border">{children}</BentoCard>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <span className="text-[13px] font-medium">{label}</span>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function SettingSegmentedControl({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: {
    value: string;
    icon?: typeof Sun;
    label: string;
  }[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-full bg-muted p-0.5 dark:bg-white/[0.06]")}>
      <AnimatedSegmentedControl
        items={items}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue)}
        className="gap-0.5"
        indicatorClassName="rounded-full bg-white shadow-sm dark:bg-white/[0.10]"
        itemClassName={cn(
          "rounded-full whitespace-nowrap text-xs font-medium [&_svg]:h-3.5 [&_svg]:w-3.5",
          compact ? "px-2.5 py-1.5" : "gap-1.5 px-3 py-1.5",
        )}
        activeItemClassName="text-foreground"
        inactiveItemClassName="text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}
