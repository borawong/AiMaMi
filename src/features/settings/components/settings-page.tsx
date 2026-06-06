/**
 * 中文职责说明：设置模块现有可运行页面，由 features/settings/Content 作为模块 Content 接入。
 */
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
import { Sun, Moon, Monitor, Globe, Download, Loader2, Image, Power } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import {
  ACCENT_PRESETS,
  HEATMAP_PRESETS,
  type AccentPreset,
  type HeatmapPreset,
} from "@/hooks/use-accent-color";
import type { Theme } from "@/hooks/use-theme";
import { REFRESH_OPTIONS, type RefreshInterval } from "@/hooks/use-auto-refresh";
import { useBusyAction } from "@/hooks/use-busy-action";
import { isMacPlatform } from "@/lib/platform";
import { ApiProxyDialog } from "./api-proxy-dialog";
import {
  useSettingsAppVersion,
  useSettingsAutoSwitchMutations,
  useSettingsHotspotMutation,
  useSettingsHotspotReadyMutation,
  useSettingsImageCompat,
  useSettingsRefreshInterval,
  useSettingsRuntimeState,
  useSettingsUpdateInstallabilityMutation,
} from "../hooks";
export interface SettingsPageProps {
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

function isRefreshInterval(value: unknown): value is RefreshInterval {
  return (
    typeof value === "string" &&
    REFRESH_OPTIONS.some((item) => item.value === value)
  );
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
  const supportsHotspot = isMacPlatform();
  const {
    status,
    currentProxy,
    hasNotch,
    hotspotQuery,
  } = useSettingsRuntimeState(supportsHotspot);
  const autoSwitch = status?.autoSwitch;
  const {
    refreshIntervalQuery,
    saveRefreshIntervalMutation,
  } = useSettingsRefreshInterval();
  const {
    imageCompatQuery,
    setImageCompatMutation,
  } = useSettingsImageCompat();
  const hotspotReadyMutation = useSettingsHotspotReadyMutation();
  const updateInstallabilityMutation = useSettingsUpdateInstallabilityMutation();

  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [draft5h, setDraft5h] = useState(15);
  const [draftWeekly, setDraftWeekly] = useState(10);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const updateCheckAction = useBusyAction({ minVisibleMs: 600 });

  const openThresholdDialog = (enabling: boolean) => {
    setPendingEnable(enabling);
    setDraft5h(autoSwitch?.threshold5hPercent ?? 15);
    setDraftWeekly(autoSwitch?.thresholdWeeklyPercent ?? 10);
    setThresholdDialogOpen(true);
  };

  const openProxyDialog = () => {
    setProxyDialogOpen(true);
  };

  const {
    disableAutoSwitchMutation,
    saveThresholdsMutation,
  } = useSettingsAutoSwitchMutations({
    onDisabled: () => {
      toast({
        title: t("settings.autoSwitchDisabled"),
        description: t("settings.autoSwitchDisabledDesc"),
        variant: "success",
      });
    },
    onThresholdsSaved: (params) => {
      setThresholdDialogOpen(false);
      toast({
        title: params.enable ? t("settings.autoSwitchEnabled") : t("settings.thresholdSavedTitle"),
        description: params.enable
          ? t("settings.autoSwitchEnabledDesc")
          : t("settings.thresholdSavedDesc"),
        variant: "success",
      });
    },
  });

  const hotspotMutation = useSettingsHotspotMutation({
    onChanged: (enabled) => {
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
        await updateInstallabilityMutation.mutateAsync();
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

  const appVersion = useSettingsAppVersion();

  useEffect(() => {
    const nextRefreshInterval = refreshIntervalQuery.data;
    if (
      isRefreshInterval(nextRefreshInterval) &&
      nextRefreshInterval !== refreshInterval
    ) {
      setRefreshInterval(nextRefreshInterval);
    }
  }, [refreshIntervalQuery.data, refreshInterval, setRefreshInterval]);

  const handleRefreshIntervalChange = (value: string) => {
    if (!isRefreshInterval(value) || value === refreshInterval) return;

    const previousRefreshInterval = refreshInterval;
    setRefreshInterval(value);
    saveRefreshIntervalMutation.mutate(value, {
      onError: () => {
        setRefreshInterval(previousRefreshInterval);
        toast({
          title: t("settings.refreshIntervalSaveFailedTitle"),
          description: t("settings.refreshIntervalSaveFailedDesc"),
          variant: "destructive",
        });
      },
    });
  };

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
              { value: "zh", icon: Globe, label: t("settings.languageZh") },
              { value: "en", icon: Globe, label: t("settings.languageEn") },
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
            <div className="flex items-center gap-2">
              <Switch
                checked={hasNotch && (hotspotQuery.data ?? false)}
                onCheckedChange={(v) => hotspotMutation.mutate(v)}
                disabled={!hasNotch || hotspotMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => hotspotReadyMutation.mutate()}
                disabled={!hasNotch || hotspotReadyMutation.isPending}
                aria-busy={hotspotReadyMutation.isPending}
              >
                <ButtonBusyContent
                  busy={hotspotReadyMutation.isPending}
                  idleLabel={t("settings.hotspotReady")}
                  busyLabel={t("settings.hotspotReadyBusy")}
                />
              </Button>
            </div>
          </SettingRow>
        )}

        <SettingRow
          label={
            <span className="inline-flex items-center gap-2">
              <Image className="h-3.5 w-3.5 text-muted-foreground" />
              {t("settings.imageCompat")}
            </span>
          }
          description={t("settings.imageCompatDesc")}
        >
          <Switch
            checked={imageCompatQuery.data ?? false}
            onCheckedChange={(v) => setImageCompatMutation.mutate(v)}
            disabled={imageCompatQuery.isLoading || setImageCompatMutation.isPending}
          />
        </SettingRow>

      </Section>

      <Section title={t("settings.modeSwitch")}>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{t("settings.autoSwitch")}</span>
              {autoSwitch?.enabled && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-[11px] font-normal hover:bg-secondary/60"
                  onClick={() => openThresholdDialog(false)}
                >
                  5h ≤{autoSwitch?.threshold5hPercent ?? 15}% · 1w ≤{autoSwitch?.thresholdWeeklyPercent ?? 10}%
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.autoSwitchDesc")}</p>
          </div>
          <Switch
            checked={autoSwitch?.enabled ?? false}
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
            onChange={handleRefreshIntervalChange}
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
            disabled={checkingUpdate || updateInstallabilityMutation.isPending}
            aria-busy={checkingUpdate || updateInstallabilityMutation.isPending}
          >
            <ButtonBusyContent
              busy={checkingUpdate || updateInstallabilityMutation.isPending}
              idleIcon={<Download className="h-3.5 w-3.5 shrink-0" />}
              idleLabel={t("settings.checkUpdate")}
              busyLabel={t("settings.checkUpdateBusy")}
            />
          </Button>
        </SettingRow>
        <SettingRow
          label={t("settings.updateRestart")}
          description={t("settings.updateRestartDesc")}
        >
          {/* 更新重启需要已安装更新的运行时证据，当前切片只暴露禁用边界。 */}
          <Button variant="outline" size="sm" disabled>
            <Power className="h-3.5 w-3.5 shrink-0" />
            {t("settings.updateRestartBoundary")}
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
