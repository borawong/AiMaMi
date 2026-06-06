import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  MessageSquareText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  envelopeData,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import { EvidencePageHeader, MetricCard } from "@/features/_shared/evidence-panels";
import { cn } from "@/lib/utils";
import { useSessionsModule } from "../hooks";

interface SessionNode {
  session: unknown;
  isOrphan: boolean;
  children: SessionNode[];
}

interface SessionGroup {
  key: string;
  name: string;
  path: string;
  roots: SessionNode[];
  sessionCount: number;
  projectPathMissing: boolean;
}

interface DeleteRequest {
  ids: string[];
  title: string;
  description: string;
  actionLabel: string;
}

export function SessionsPage() {
  const { t } = useTranslation();
  const module = useSessionsModule();
  const initialExpanded = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set());
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);

  const sessionsPayload =
    module.sessionsEnvelope?.payload ??
    (module.sessionsEnvelope ? null : module.sessionsQuery.data);
  const usagePayload =
    module.usageEnvelope?.payload ??
    (module.usageEnvelope ? null : module.usageQuery.data);
  const payload = envelopeData(sessionsPayload);
  const usage = envelopeData(usagePayload);
  const sessions = readArray(payload, ["items", "sessions", "data.items"]);
  const groups = useMemo(() => buildSessionGroups(sessions), [sessions]);
  const allIds = useMemo(() => flattenGroups(groups), [groups]);
  const allIdSet = useMemo(() => new Set(allIds), [allIds]);
  const orphanCount = useMemo(() => countOrphans(groups), [groups]);
  const loading = !sessionsPayload && (module.sessionsQuery.isLoading || module.sessionsQuery.isFetching);

  useEffect(() => {
    if (initialExpanded.current || groups.length === 0) return;
    const firstGroup = groups[0];
    const firstRoot = firstGroup.roots[0];
    initialExpanded.current = true;
    setExpandedProjects(new Set([firstGroup.key]));
    if (firstRoot) setExpandedThreads(new Set([sessionId(firstRoot.session)]));
  }, [groups]);

  useEffect(() => {
    setSelected((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (allIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [allIdSet]);

  useEffect(() => {
    if (allIds.length === 0) {
      if (focusedId !== null) setFocusedId(null);
      return;
    }
    if (!focusedId || !allIdSet.has(focusedId)) setFocusedId(allIds[0]);
  }, [allIds, allIdSet, focusedId]);

  const refresh = async () => {
    await module.refreshAction.run();
  };

  const deleteSessions = async () => {
    if (!deleteRequest) return;
    await module.deleteSessions.run(deleteRequest.ids);
    setSelected((current) => {
      const next = new Set(current);
      for (const id of deleteRequest.ids) next.delete(id);
      return next;
    });
    setDeleteRequest(null);
  };

  const toggleProject = (key: string) => {
    setExpandedProjects((current) => toggleSetItem(current, key));
  };
  const toggleThread = (id: string) => {
    setExpandedThreads((current) => toggleSetItem(current, id));
  };
  const toggleIds = (ids: string[]) => {
    setSelected((current) => {
      const next = new Set(current);
      const shouldSelect = ids.some((id) => !next.has(id));
      for (const id of ids) {
        if (shouldSelect) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <EvidencePageHeader
        titleKey="nav.sessions"
        descriptionKey="sessions.description"
        actions={[]}
      />

      <div className="flex shrink-0 items-center justify-between gap-4">
        <div className="grid flex-1 gap-3 md:grid-cols-4">
          <MetricCard
            labelKey="sessions.totalSessions"
            value={readNumber(usage, ["sessionStats.totalSessions"], sessions.length)}
          />
          <MetricCard
            labelKey="sessions.totalSize"
            value={formatBytes(readNumber(usage, ["sessionStats.totalSizeBytes"]))}
          />
          <MetricCard
            labelKey="sessions.activeDays"
            value={readNumber(usage, ["sessionStats.activeDays"])}
          />
          <MetricCard
            labelKey="sessions.avgPerDay"
            value={readNumber(usage, ["sessionStats.avgSessionsPerActiveDay"]).toFixed(1)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selected.size > 0 ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={module.deleteSessions.isPending}
              onClick={() =>
                setDeleteRequest({
                  ids: [...selected],
                  title: t("sessions.deleteSelectionTitle", { count: selected.size }),
                  description: t("sessions.deleteSelectionDesc", { count: selected.size }),
                  actionLabel: t("sessions.delete"),
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("sessions.delete")} ({selected.size})
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={module.refreshAction.isPending}
            aria-label={t("common.refresh")}
            onClick={() => void refresh()}
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                module.refreshAction.isPending && "animate-spin",
              )}
            />
          </Button>
        </div>
      </div>

      {orphanCount > 0 ? (
        <div className="shrink-0">
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300">
            {t("sessions.orphanCount", { count: orphanCount })}
          </Badge>
        </div>
      ) : null}

      {loading ? (
        <SessionsLoading />
      ) : groups.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{t("sessions.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="shrink-0 border-b border-border/60 px-4 py-4">
            <div className="text-sm font-semibold text-foreground">{t("sessions.treeTitle")}</div>
            <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
              {t("sessions.treeDescription")}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-card px-4 py-4">
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <SessionGroupBlock
                  key={group.key}
                  group={group}
                  expandedProjects={expandedProjects}
                  expandedThreads={expandedThreads}
                  selected={selected}
                  focusedId={focusedId}
                  onToggleProject={toggleProject}
                  onToggleThread={toggleThread}
                  onToggleIds={toggleIds}
                  onFocusSession={setFocusedId}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={deleteRequest !== null}
        onOpenChange={(open) => !open && setDeleteRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteRequest?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRequest?.description}
              <span className="mt-2 block text-xs text-amber-700 dark:text-amber-300">
                {t("sessions.deleteLagHint")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={module.deleteSessions.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={module.deleteSessions.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void deleteSessions();
              }}
            >
              {module.deleteSessions.isPending
                ? t("common.loading")
                : deleteRequest?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionGroupBlock({
  group,
  expandedProjects,
  expandedThreads,
  selected,
  focusedId,
  onToggleProject,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  group: SessionGroup;
  expandedProjects: Set<string>;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleProject: (key: string) => void;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  const ids = flattenGroup(group);
  const checked = ids.length > 0 && ids.every((id) => selected.has(id));
  const expanded = expandedProjects.has(group.key);
  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3.5 py-3.5 transition-colors",
          expanded ? "bg-muted/60" : "hover:bg-muted/40",
        )}
        onClick={() => onToggleProject(group.key)}
      >
        <SessionCheck checked={checked} onToggle={() => onToggleIds(ids)} />
        {expanded ? <ChevronDown className="h-[18px] w-[18px] text-muted-foreground" /> : <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />}
        {group.key === "__conversations__" ? (
          <MessageSquareText className="h-[18px] w-[18px] text-primary" strokeWidth={2.4} />
        ) : (
          <Folder className="h-[18px] w-[18px] text-primary" strokeWidth={2.4} />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">
            {group.key === "__conversations__"
              ? t("sessions.conversationGroup")
              : group.name || t("sessions.unknownProject")}
          </div>
          {group.key !== "__conversations__" ? (
            <div className="truncate text-[13px] text-muted-foreground">{group.path}</div>
          ) : null}
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
          {group.sessionCount}
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-border/60 bg-background/40">
          {group.roots.map((node) => (
            <RootSessionNode
              key={sessionId(node.session)}
              node={node}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RootSessionNode({
  node,
  expandedThreads,
  selected,
  focusedId,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  node: SessionNode;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const id = sessionId(node.session);
  const ids = flattenNode(node);
  const hasChildren = node.children.length > 0;
  const expanded = expandedThreads.has(id);
  const checked = ids.length > 0 && ids.every((item) => selected.has(item));
  const focused = focusedId === id;

  const activate = () => {
    if (hasChildren) {
      onToggleIds(ids);
      if (!expanded) onToggleThread(id);
    } else {
      onToggleIds([id]);
    }
    onFocusSession(id);
  };

  return (
    <div className="border-t border-border/60 py-3 first:border-t-0">
      <div className="group relative w-full transition-colors hover:bg-muted/40">
        {focused ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] bg-primary" /> : null}
        <div className="relative z-0 flex w-full cursor-pointer items-center gap-3 px-4 py-3" onClick={activate}>
          <SessionCheck checked={checked} onToggle={() => onToggleIds(ids)} />
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
          <SessionNodeText node={node} focused={focused} root />
        </div>
      </div>
      {hasChildren && expanded ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <ChildSessionNode
              key={sessionId(child.session)}
              node={child}
              level={1}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChildSessionNode({
  node,
  level,
  expandedThreads,
  selected,
  focusedId,
  onToggleThread,
  onToggleIds,
  onFocusSession,
}: {
  node: SessionNode;
  level: number;
  expandedThreads: Set<string>;
  selected: Set<string>;
  focusedId: string | null;
  onToggleThread: (id: string) => void;
  onToggleIds: (ids: string[]) => void;
  onFocusSession: (id: string) => void;
}) {
  const id = sessionId(node.session);
  const ids = flattenNode(node);
  const hasChildren = node.children.length > 0;
  const expanded = expandedThreads.has(id);
  const checked = hasChildren
    ? ids.every((item) => selected.has(item))
    : selected.has(id);
  const activate = () => {
    if (hasChildren) {
      onToggleIds(ids);
      if (!expanded) onToggleThread(id);
    } else {
      onToggleIds([id]);
    }
    onFocusSession(id);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full transition-colors hover:bg-muted/40">
        {focusedId === id ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] bg-primary" /> : null}
        <div className="flex w-full cursor-pointer items-center gap-3 px-4 py-3" onClick={activate}>
          <SessionCheck
            checked={checked}
            onToggle={() => onToggleIds(hasChildren ? ids : [id])}
          />
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/60 ring-4 ring-primary/10" />
          <SessionNodeText node={node} focused={focusedId === id} />
        </div>
      </div>
      {hasChildren && expanded ? (
        <div className="space-y-3 border-l border-border/60 pl-4" style={{ marginLeft: `${Math.max(8, level * 12)}px` }}>
          {node.children.map((child) => (
            <ChildSessionNode
              key={sessionId(child.session)}
              node={child}
              level={level + 1}
              expandedThreads={expandedThreads}
              selected={selected}
              focusedId={focusedId}
              onToggleThread={onToggleThread}
              onToggleIds={onToggleIds}
              onFocusSession={onFocusSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SessionNodeText({
  node,
  focused,
  root,
}: {
  node: SessionNode;
  focused: boolean;
  root?: boolean;
}) {
  const { t } = useTranslation();
  const size = formatBytes(readNumber(node.session, ["fileSize"]));
  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "block min-w-0 flex-1 truncate text-left font-semibold transition-colors",
            root ? "text-[14px]" : "text-[14px] font-medium",
            focused ? "text-foreground" : "text-foreground/90",
          )}
        >
          {readString(node.session, ["threadName", "title", "name", "id"], t("sessions.untitled"))}
        </span>
      </div>
      <div className="mt-1 flex min-w-0 flex-nowrap items-center gap-2 text-[12px] text-muted-foreground">
        <div className="min-w-0 flex-1 truncate">
          {sessionKindLabel(node, t)} - {formatSessionTime(readNumber(node.session, ["updatedAt"]))}
          {size ? ` - ${size}` : ""}
        </div>
        {node.isOrphan ? (
          <Badge variant="outline" className="shrink-0 rounded-full px-2 py-0 text-[10px] font-medium text-amber-600 dark:text-amber-300">
            {t("sessions.orphanThread")}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function SessionCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent hover:border-primary",
      )}
      aria-pressed={checked}
    >
      <Check className={cn("h-3 w-3", checked ? "opacity-100" : "opacity-0")} strokeWidth={3} />
    </button>
  );
}

function SessionsLoading() {
  return (
    <div className="min-h-0 flex-1 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
            <Skeleton className="h-4 w-4 rounded-[4px]" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSessionGroups(sessions: unknown[]): SessionGroup[] {
  const grouped = new Map<string, unknown[]>();
  for (const session of sessions) {
    const key = readBoolean(session, ["isConversationThread"])
      ? "__conversations__"
      : readString(session, ["projectPath"], "__ungrouped__") || "__ungrouped__";
    const bucket = grouped.get(key) ?? [];
    bucket.push(session);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, items]) => {
      const nodeMap = new Map<string, SessionNode>();
      for (const session of items) {
        nodeMap.set(sessionId(session), { session, isOrphan: false, children: [] });
      }

      const roots: SessionNode[] = [];
      for (const session of items) {
        const id = sessionId(session);
        const node = nodeMap.get(id);
        if (!node) continue;
        const parentId = readString(session, ["parentSessionId"], "");
        const parent = parentId ? nodeMap.get(parentId) : undefined;
        if (parent) {
          parent.children.push(node);
        } else {
          node.isOrphan = Boolean(parentId);
          roots.push(node);
        }
      }

      sortNodes(roots);
      const first = items[0];
      return {
        key,
        name:
          key === "__conversations__"
          ? "__conversations__"
          : readString(first, ["projectName"], ""),
        path: key === "__conversations__" ? "" : readString(first, ["projectPath"], ""),
        roots,
        sessionCount: items.length,
        projectPathMissing:
          key !== "__conversations__" &&
          items.some((item) => readBoolean(item, ["projectPathMissing"])),
      };
    })
    .sort((left, right) => latestUpdated(right.roots) - latestUpdated(left.roots));
}

function sortNodes(nodes: SessionNode[]) {
  nodes.sort((left, right) => readNumber(right.session, ["updatedAt"]) - readNumber(left.session, ["updatedAt"]));
  for (const node of nodes) sortNodes(node.children);
}

function latestUpdated(nodes: SessionNode[]) {
  let latest = 0;
  const visit = (items: SessionNode[]) => {
    for (const item of items) {
      latest = Math.max(latest, readNumber(item.session, ["updatedAt"]));
      visit(item.children);
    }
  };
  visit(nodes);
  return latest;
}

function flattenNode(node: SessionNode): string[] {
  return [sessionId(node.session), ...node.children.flatMap(flattenNode)];
}

function flattenGroup(group: SessionGroup): string[] {
  return group.roots.flatMap(flattenNode);
}

function flattenGroups(groups: SessionGroup[]): string[] {
  return groups.flatMap(flattenGroup);
}

function countOrphans(groups: SessionGroup[]) {
  let count = 0;
  const visit = (node: SessionNode) => {
    if (node.isOrphan) count += 1;
    node.children.forEach(visit);
  };
  groups.forEach((group) => group.roots.forEach(visit));
  return count;
}

function sessionId(session: unknown) {
  return readString(session, ["id", "sessionId", "conversationId", "path"], "");
}

function toggleSetItem(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function sessionKindLabel(node: SessionNode, t: (key: string, options?: Record<string, unknown>) => string) {
  if (node.isOrphan) return t("sessions.orphanThread");
  if (readString(node.session, ["parentSessionId"], "")) return t("sessions.childThread");
  const count = node.children.length;
  return `${t("sessions.mainThread")} - ${t("sessions.childThreadsInline", { count })}`;
}

function formatSessionTime(value: number) {
  if (!value) return "";
  const date = new Date(value > 10_000_000_000 ? value : value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
