/**
 * 中文职责说明：sessions 页面只渲染会话列表和短生命周期选择状态。
 */
import { useMemo, useState } from "react";
import { MessageSquareText, Trash2 } from "lucide-react";
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
  const module = useSessionsModule();
  const payload = envelopeData(module.sessionsQuery.data);
  const sessions = readArray(payload, ["items", "sessions", "data.items"]);
  const total = sessions.length || readNumber(payload, ["total", "count"]);
  const totalSize = readNumber(payload, ["totalSizeBytes", "stats.totalSizeBytes"]);

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

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.sessions"
        descriptionKey="sessions.description"
        actions={[]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          labelKey="sessions.total"
          value={
            <span className="inline-flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              {total}
            </span>
          }
        />
        <MetricCard labelKey="sessions.selected" value={selectedIds.length} />
        <MetricCard labelKey="sessions.totalSize" value={formatBytes(totalSize)} />
      </div>

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
