/**
 * 中文职责说明：sessions 页面只渲染会话列表和短生命周期选择状态。
 */
import { useMemo, useState } from "react";
import { BarChart3, MessageSquareText, Trash2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  envelopeData,
  readArray,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import {
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
} from "@/features/_shared/evidence-panels";
import { previewText } from "@/features/_shared/evidence-data";
import { useSessionsModule } from "../hooks";

export function SessionsPage() {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionJsonDraft, setSessionJsonDraft] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const module = useSessionsModule();
  const payload = envelopeData(module.sessionsQuery.data);
  const usage = envelopeData(module.usageQuery.data);
  const sessionAnalytics = envelopeData(module.sessionAnalyticsQuery.data);
  const sessions = readArray(payload, ["items", "sessions", "data.items"]);
  const sessionSeries = readArray(sessionAnalytics, ["series", "items"]);
  const total = sessions.length || readNumber(payload, ["total", "count"]);
  const totalSize = readNumber(payload, ["totalSizeBytes", "stats.totalSizeBytes"]);
  const todaySessions = readNumber(usage, ["today.sessionCount"]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSession = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    await module.deleteSessionsMutation.mutateAsync(selectedIds);
    setSelectedIds([]);
  };

  const importSession = async () => {
    const sessionJson = sessionJsonDraft.trim();
    if (!sessionJson) return;
    await module.importSessionMutation.mutateAsync({
      sessionJson,
      overwriteExisting,
    });
    setSessionJsonDraft("");
    setOverwriteExisting(false);
  };

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.sessions"
        descriptionKey="sessions.description"
        actions={[]}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="sessions.total"
          value={
            <span className="inline-flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              {total}
            </span>
          }
        />
        <MetricCard labelKey="sessions.todaySessions" value={todaySessions} />
        <MetricCard labelKey="sessions.selected" value={selectedIds.length} />
        <MetricCard labelKey="sessions.totalSize" value={formatBytes(totalSize)} />
        <MetricCard
          labelKey="sessions.analyticsPoints"
          value={
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {sessionSeries.length}
            </span>
          }
        />
      </div>

      <QueryPanel titleKey="sessions.importSession" state={module.sessionsQuery}>
        <div className="grid gap-3">
          <label className="min-w-0 text-xs text-muted-foreground">
            <span>{t("sessions.sessionJsonInput")}</span>
            <textarea
              className="mt-1 min-h-28 w-full resize-y rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              value={sessionJsonDraft}
              placeholder={t("sessions.sessionJsonPlaceholder")}
              onChange={(event) => setSessionJsonDraft(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={overwriteExisting}
                onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
              />
              <span>{t("sessions.overwriteExisting")}</span>
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !sessionJsonDraft.trim() || module.importSessionMutation.isPending
              }
              onClick={() => void importSession()}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("sessions.importSession")}
            </Button>
          </div>
        </div>
      </QueryPanel>

      <QueryPanel titleKey="sessions.list" state={module.sessionsQuery}>
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedIds.length === 0 || module.deleteSessionsMutation.isPending}
            onClick={() => void deleteSelected()}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("sessions.deleteSelected")}
          </Button>
        </div>
        <RecordList
          items={sessions}
          emptyKey="sessions.empty"
          renderItem={(session, index) => {
            const id =
              readString(session, ["id", "sessionId", "conversationId", "path"]) ||
              String(index);
            return (
              <div className="flex min-w-0 items-center gap-3">
                <Checkbox
                  checked={selectedSet.has(id)}
                  onCheckedChange={(checked) => toggleSession(id, checked === true)}
                  aria-label={t("sessions.select")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(session, ["title", "name", "id"], t("sessions.untitled"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {previewText(
                      readString(session, ["projectPath", "path", "createdAt"], ""),
                    )}
                  </p>
                </div>
              </div>
            );
          }}
        />
      </QueryPanel>

      <QueryPanel titleKey="sessions.analytics" state={module.sessionAnalyticsQuery}>
        <RecordList
          items={sessionSeries}
          emptyKey="sessions.emptyAnalytics"
        />
      </QueryPanel>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
